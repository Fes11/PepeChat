use std::{
    io::Cursor,
    sync::{
        atomic::{AtomicBool, Ordering},
        mpsc, Arc, Mutex,
    },
    thread,
    time::{Duration, Instant},
};

use base64::{engine::general_purpose::STANDARD, Engine};
use image::{DynamicImage, ImageFormat, RgbaImage};
use livekit::{
    options::{TrackPublishOptions, VideoCodec},
    track::{LocalTrack, LocalVideoTrack, TrackSource},
    webrtc::{
        desktop_capturer::{
            CaptureError, CaptureSource as DesktopSource, DesktopCaptureSourceType,
            DesktopCapturer, DesktopCapturerOptions, DesktopFrame,
        },
        native::yuv_helper,
        prelude::{I420Buffer, RtcVideoSource, VideoFrame, VideoResolution, VideoRotation},
        video_source::native::NativeVideoSource,
    },
    Room, RoomOptions,
};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};

const DEFAULT_FPS: u32 = 30;
const MAX_FPS: u32 = 30;
const MAX_WIDTH: u32 = 1920;
const MAX_HEIGHT: u32 = 1080;
const CAPTURE_TIMEOUT: Duration = Duration::from_secs(3);
const MAX_CONSECUTIVE_ERRORS: u32 = 30;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptureSource {
    id: String,
    kind: String,
    title: String,
    app_name: Option<String>,
    width: u32,
    height: u32,
    is_primary: bool,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartScreenShareRequest {
    source_id: String,
    url: String,
    token: String,
    with_audio: bool,
    max_fps: Option<u32>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScreenShareState {
    active: bool,
    source_id: Option<String>,
    audio_available: bool,
}

struct ScreenShareSession {
    room: Arc<Room>,
    active: Arc<AtomicBool>,
    source_id: String,
}

#[derive(Default)]
pub struct ScreenShareManager(Mutex<Option<ScreenShareSession>>);

struct CapturedFrame {
    data: Vec<u8>,
    width: u32,
    height: u32,
    stride: u32,
}

fn source_parts(source_id: &str) -> Result<(DesktopCaptureSourceType, u64), String> {
    let (kind, id) = source_id
        .split_once(':')
        .ok_or_else(|| "Некорректный идентификатор источника".to_string())?;
    let kind = match kind {
        "screen" => DesktopCaptureSourceType::Screen,
        "window" => DesktopCaptureSourceType::Window,
        _ => return Err("Неизвестный тип источника".into()),
    };
    let id = id
        .parse::<u64>()
        .map_err(|_| "Некорректный идентификатор источника".to_string())?;
    Ok((kind, id))
}

fn capturer_options(kind: DesktopCaptureSourceType) -> DesktopCapturerOptions {
    let mut options = DesktopCapturerOptions::new(kind);
    options.set_include_cursor(true);
    options
}

fn resolve_source(source_id: &str) -> Result<(DesktopCapturer, DesktopSource), String> {
    let (kind, id) = source_parts(source_id)?;
    let capturer = DesktopCapturer::new(capturer_options(kind))
        .ok_or_else(|| "Не удалось создать нативный захват экрана".to_string())?;
    let source = capturer
        .get_source_list()
        .into_iter()
        .find(|source| source.id() == id)
        .ok_or_else(|| "Источник больше недоступен".to_string())?;
    Ok((capturer, source))
}

fn copy_frame(frame: DesktopFrame) -> CapturedFrame {
    CapturedFrame {
        data: frame.data().to_vec(),
        width: frame.width().max(0) as u32,
        height: frame.height().max(0) as u32,
        stride: frame.stride(),
    }
}

fn capture_one(source_id: &str) -> Result<CapturedFrame, String> {
    let (mut capturer, source) = resolve_source(source_id)?;
    let (sender, receiver) = mpsc::sync_channel(1);
    capturer.start_capture(Some(source), move |result| {
        let _ = sender.try_send(result.map(copy_frame));
    });
    capturer.capture_frame();
    match receiver.recv_timeout(CAPTURE_TIMEOUT) {
        Ok(Ok(frame)) if frame.width > 0 && frame.height > 0 => Ok(frame),
        Ok(Ok(_)) => Err("Источник вернул пустой кадр".into()),
        Ok(Err(CaptureError::Temporary)) => Err("Источник временно недоступен".into()),
        Ok(Err(CaptureError::Permanent)) => Err("Захват источника завершён".into()),
        Err(_) => Err("Превышено время ожидания кадра".into()),
    }
}

fn output_size(width: u32, height: u32) -> (u32, u32) {
    let scale = (MAX_WIDTH as f64 / width as f64)
        .min(MAX_HEIGHT as f64 / height as f64)
        .min(1.0);
    let even = |value: u32| (value.max(2) / 2) * 2;
    (
        even((width as f64 * scale) as u32),
        even((height as f64 * scale) as u32),
    )
}

#[cfg(target_os = "windows")]
fn frame_with_cursor(frame: &DesktopFrame) -> Option<Vec<u8>> {
    use std::{ffi::c_void, mem::size_of, ptr};
    use windows::Win32::{
        Graphics::Gdi::{
            CreateCompatibleDC, CreateDIBSection, DeleteDC, DeleteObject, SelectObject, BITMAPINFO,
            BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS, HGDIOBJ,
        },
        UI::WindowsAndMessaging::{
            DrawIconEx, GetCursorInfo, GetIconInfo, CURSORINFO, CURSOR_SHOWING, DI_NORMAL, ICONINFO,
        },
    };

    let width = frame.width();
    let height = frame.height();
    let row_bytes = width.max(0) as usize * 4;
    if width <= 0 || height <= 0 || (frame.stride() as usize) < row_bytes {
        return None;
    }

    unsafe {
        let mut cursor = CURSORINFO {
            cbSize: size_of::<CURSORINFO>() as u32,
            ..Default::default()
        };
        if GetCursorInfo(&mut cursor).is_err() || cursor.flags != CURSOR_SHOWING {
            return None;
        }
        let mut icon = ICONINFO::default();
        if GetIconInfo(cursor.hCursor.into(), &mut icon).is_err() {
            return None;
        }

        let cursor_x = cursor.ptScreenPos.x - frame.left() - icon.xHotspot as i32;
        let cursor_y = cursor.ptScreenPos.y - frame.top() - icon.yHotspot as i32;
        if !icon.hbmMask.is_invalid() {
            let _ = DeleteObject(HGDIOBJ(icon.hbmMask.0));
        }
        if !icon.hbmColor.is_invalid() {
            let _ = DeleteObject(HGDIOBJ(icon.hbmColor.0));
        }
        if cursor_x >= width || cursor_y >= height || cursor_x < -128 || cursor_y < -128 {
            return None;
        }

        let mut bitmap_info = BITMAPINFO::default();
        bitmap_info.bmiHeader = BITMAPINFOHEADER {
            biSize: size_of::<BITMAPINFOHEADER>() as u32,
            biWidth: width,
            biHeight: -height,
            biPlanes: 1,
            biBitCount: 32,
            biCompression: BI_RGB.0,
            ..Default::default()
        };
        let dc = CreateCompatibleDC(None);
        if dc.is_invalid() {
            return None;
        }
        let mut bits: *mut c_void = ptr::null_mut();
        let bitmap =
            match CreateDIBSection(Some(dc), &bitmap_info, DIB_RGB_COLORS, &mut bits, None, 0) {
                Ok(bitmap) => bitmap,
                Err(_) => {
                    let _ = DeleteDC(dc);
                    return None;
                }
            };
        let previous = SelectObject(dc, HGDIOBJ(bitmap.0));
        let target = std::slice::from_raw_parts_mut(bits.cast::<u8>(), row_bytes * height as usize);
        for row in 0..height as usize {
            let source_start = row * frame.stride() as usize;
            let target_start = row * row_bytes;
            target[target_start..target_start + row_bytes]
                .copy_from_slice(&frame.data()[source_start..source_start + row_bytes]);
        }
        let _ = DrawIconEx(
            dc,
            cursor_x,
            cursor_y,
            cursor.hCursor.into(),
            0,
            0,
            0,
            None,
            DI_NORMAL,
        );
        let output = target.to_vec();
        SelectObject(dc, previous);
        let _ = DeleteObject(HGDIOBJ(bitmap.0));
        let _ = DeleteDC(dc);
        Some(output)
    }
}

fn frame_to_i420(frame: &DesktopFrame, include_cursor_overlay: bool) -> I420Buffer {
    let width = frame.width().max(2) as u32;
    let height = frame.height().max(2) as u32;
    #[cfg(target_os = "windows")]
    let cursor_frame = include_cursor_overlay
        .then(|| frame_with_cursor(frame))
        .flatten();
    #[cfg(target_os = "windows")]
    let (argb, argb_stride) = cursor_frame
        .as_deref()
        .map(|data| (data, width * 4))
        .unwrap_or((frame.data(), frame.stride()));
    #[cfg(not(target_os = "windows"))]
    let (argb, argb_stride) = (frame.data(), frame.stride());
    let mut buffer = I420Buffer::new(width, height);
    let (stride_y, stride_u, stride_v) = buffer.strides();
    let (data_y, data_u, data_v) = buffer.data_mut();
    // libWebRTC DesktopFrame uses little-endian ARGB (BGRA byte order).
    // libyuv performs this conversion with platform SIMD instructions.
    yuv_helper::argb_to_i420(
        argb,
        argb_stride,
        data_y,
        stride_y,
        data_u,
        stride_u,
        data_v,
        stride_v,
        width as i32,
        height as i32,
    );
    let (output_width, output_height) = output_size(width, height);
    if output_width != width || output_height != height {
        buffer.scale(output_width as i32, output_height as i32)
    } else {
        buffer
    }
}

fn frame_to_preview(frame: CapturedFrame) -> Result<String, String> {
    let row_bytes = frame.width as usize * 4;
    let mut rgba = Vec::with_capacity(row_bytes * frame.height as usize);
    for row in 0..frame.height as usize {
        let start = row * frame.stride as usize;
        let end = start + row_bytes;
        let source_row = frame
            .data
            .get(start..end)
            .ok_or_else(|| "Некорректный stride кадра".to_string())?;
        rgba.extend_from_slice(source_row);
    }
    for pixel in rgba.chunks_exact_mut(4) {
        pixel.swap(0, 2);
    }
    let image = RgbaImage::from_raw(frame.width, frame.height, rgba)
        .ok_or_else(|| "Некорректный формат кадра".to_string())?;
    let preview = DynamicImage::ImageRgba8(image).thumbnail(420, 236);
    let mut bytes = Cursor::new(Vec::new());
    preview
        .write_to(&mut bytes, ImageFormat::Jpeg)
        .map_err(|error| error.to_string())?;
    Ok(format!(
        "data:image/jpeg;base64,{}",
        STANDARD.encode(bytes.into_inner())
    ))
}

fn sources_for(
    kind: DesktopCaptureSourceType,
    kind_name: &str,
) -> Result<Vec<CaptureSource>, String> {
    let capturer = DesktopCapturer::new(capturer_options(kind))
        .ok_or_else(|| "Не удалось получить список источников".to_string())?;
    let is_screen = kind == DesktopCaptureSourceType::Screen;
    Ok(capturer
        .get_source_list()
        .into_iter()
        .enumerate()
        .filter_map(|(index, source)| {
            let title = source.title().trim().to_string();
            if !is_screen && (title.is_empty() || title.to_lowercase().contains("pepechat")) {
                return None;
            }
            Some(CaptureSource {
                id: format!("{kind_name}:{}", source.id()),
                kind: kind_name.into(),
                title: if title.is_empty() {
                    format!("Экран {}", index + 1)
                } else {
                    title
                },
                app_name: None,
                width: 0,
                height: 0,
                is_primary: is_screen && index == 0,
            })
        })
        .collect())
}

#[tauri::command]
pub async fn list_capture_sources() -> Result<Vec<CaptureSource>, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let mut sources = sources_for(DesktopCaptureSourceType::Window, "window")?;
        sources.extend(sources_for(DesktopCaptureSourceType::Screen, "screen")?);
        Ok(sources)
    })
    .await
    .map_err(|error| error.to_string())?
}

#[tauri::command]
pub async fn get_capture_thumbnail(source_id: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || frame_to_preview(capture_one(&source_id)?))
        .await
        .map_err(|error| error.to_string())?
}

#[tauri::command]
pub async fn start_screen_share(
    app: AppHandle,
    manager: State<'_, ScreenShareManager>,
    request: StartScreenShareRequest,
) -> Result<ScreenShareState, String> {
    {
        let mut current = manager.0.lock().map_err(|error| error.to_string())?;
        if current
            .as_ref()
            .is_some_and(|session| session.active.load(Ordering::Relaxed))
        {
            return Err("Трансляция экрана уже запущена".into());
        }
        *current = None;
    }

    let first_frame = {
        let source_id = request.source_id.clone();
        tauri::async_runtime::spawn_blocking(move || capture_one(&source_id))
            .await
            .map_err(|error| error.to_string())??
    };
    let (width, height) = output_size(first_frame.width, first_frame.height);
    let (room, _events) = Room::connect(&request.url, &request.token, RoomOptions::default())
        .await
        .map_err(|error| error.to_string())?;
    let room = Arc::new(room);
    let rtc_source = NativeVideoSource::new(VideoResolution { width, height }, true);
    let track = LocalVideoTrack::create_video_track(
        "screen-share",
        RtcVideoSource::Native(rtc_source.clone()),
    );
    room.local_participant()
        .publish_track(
            LocalTrack::Video(track),
            TrackPublishOptions {
                source: TrackSource::Screenshare,
                video_codec: VideoCodec::H264,
                simulcast: false,
                ..Default::default()
            },
        )
        .await
        .map_err(|error| error.to_string())?;

    let active = Arc::new(AtomicBool::new(true));
    let worker_active = active.clone();
    let source_id = request.source_id.clone();
    let worker_source_id = source_id.clone();
    let fps = request.max_fps.unwrap_or(DEFAULT_FPS).clamp(1, MAX_FPS);
    let app_handle = app.clone();
    thread::spawn(move || {
        let include_cursor_overlay = worker_source_id.starts_with("screen:");
        let (mut capturer, source) = match resolve_source(&worker_source_id) {
            Ok(value) => value,
            Err(error) => {
                worker_active.store(false, Ordering::Relaxed);
                let _ = app_handle.emit("screen-share-error", error);
                return;
            }
        };
        let callback_active = worker_active.clone();
        let callback_app = app_handle.clone();
        let capture_started = Instant::now();
        let mut consecutive_errors = 0;
        capturer.start_capture(Some(source), move |result| match result {
            Ok(frame) => {
                consecutive_errors = 0;
                let buffer = frame_to_i420(&frame, include_cursor_overlay);
                let mut video_frame = VideoFrame::new(VideoRotation::VideoRotation0, buffer);
                video_frame.timestamp_us = capture_started.elapsed().as_micros().max(1) as i64;
                rtc_source.capture_frame(&video_frame);
            }
            Err(error) => {
                consecutive_errors += 1;
                if error == CaptureError::Permanent || consecutive_errors >= MAX_CONSECUTIVE_ERRORS
                {
                    callback_active.store(false, Ordering::Relaxed);
                    let _ = callback_app
                        .emit("screen-share-error", "Нативный захват источника завершён");
                }
            }
        });

        let interval = Duration::from_secs_f64(1.0 / fps as f64);
        let mut next_frame = Instant::now();
        while worker_active.load(Ordering::Relaxed) {
            capturer.capture_frame();
            next_frame += interval;
            thread::sleep(next_frame.saturating_duration_since(Instant::now()));
            if next_frame < Instant::now() {
                next_frame = Instant::now();
            }
        }
        let _ = app_handle.emit("screen-share-stopped", ());
    });

    *manager.0.lock().map_err(|error| error.to_string())? = Some(ScreenShareSession {
        room,
        active,
        source_id: source_id.clone(),
    });
    let state = ScreenShareState {
        active: true,
        source_id: Some(source_id),
        audio_available: !request.with_audio,
    };
    let _ = app.emit("screen-share-started", &state);
    Ok(state)
}

#[tauri::command]
pub async fn stop_screen_share(manager: State<'_, ScreenShareManager>) -> Result<(), String> {
    let session = manager.0.lock().map_err(|error| error.to_string())?.take();
    if let Some(session) = session {
        session.active.store(false, Ordering::Relaxed);
        session
            .room
            .close()
            .await
            .map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_screen_share_state(
    manager: State<'_, ScreenShareManager>,
) -> Result<ScreenShareState, String> {
    let session = manager.0.lock().map_err(|error| error.to_string())?;
    Ok(match session.as_ref() {
        Some(session) if session.active.load(Ordering::Relaxed) => ScreenShareState {
            active: true,
            source_id: Some(session.source_id.clone()),
            audio_available: false,
        },
        _ => ScreenShareState {
            active: false,
            source_id: None,
            audio_available: false,
        },
    })
}
