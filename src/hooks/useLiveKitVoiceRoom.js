import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { api } from "../api/index.jsx";
import { VoiceRoomSocket } from "../api/voiceRoomSocket";
import { Context } from "../main";
import { mediaService } from "../services/MediaService";
import { LiveKitVoiceTransport } from "../services/LiveKitVoiceTransport";
import roomJoinSoundUrl from "../assets/sounds/JoinSound.mp3";
import roomLeftSoundUrl from "../assets/sounds/LeftSound.mp3";

const HEARTBEAT_INTERVAL = 10_000;
const ROOM_SOUND_VOLUME = 0.4;

const playRoomSound = (url, outputDeviceId) => {
  const audio = new Audio(url);
  audio.volume = ROOM_SOUND_VOLUME;
  mediaService.setAudioOutput(audio, outputDeviceId).finally(() => {
    audio.play().catch((error) => {
      console.warn("[VoiceRoom] Cannot play room sound", error);
    });
  });
};

export const useLiveKitVoiceRoom = (chatId) => {
  const { AuthStore, ChatStore, MediaStore } = useContext(Context);
  const [participants, setParticipants] = useState([]);
  const [isJoining, setIsJoining] = useState(true);
  const [localStreamReady, setLocalStreamReady] = useState(false);
  const transportRef = useRef(null);
  const socketRef = useRef(null);
  const heartbeatRef = useRef(null);
  const directoryRef = useRef(new Map());
  const manuallyClosedRef = useRef(false);
  const microphoneRequestRef = useRef(0);
  const localJoinSoundPlayedRef = useRef(false);

  const mergeTransportParticipant = useCallback((mediaParticipant) => {
    setParticipants((current) =>
      current.map((participant) =>
        String(participant.user?.id) === String(mediaParticipant.identity)
          ? {
              ...participant,
              media: mediaParticipant.media,
              isLocalMedia: mediaParticipant.isLocal,
              stream: mediaParticipant.media.audio?.stream ?? null,
              state: {
                ...participant.state,
                speaking: mediaParticipant.isSpeaking,
                muted: Boolean(mediaParticipant.media.audio?.publication?.isMuted),
              },
            }
          : participant,
      ),
    );
  }, []);

  const startMicrophone = useCallback(async () => {
    const requestId = ++microphoneRequestRef.current;
    const stream = await mediaService.getMicrophone(MediaStore.selectedMicrophone, {
      volume: MediaStore.volume,
      audioSettings: MediaStore.getAudioSettings(),
    });
    if (requestId !== microphoneRequestRef.current || !transportRef.current) {
      mediaService.stopStream(stream);
      return;
    }
    await transportRef.current?.publishMicrophone(stream);
    setLocalStreamReady(true);
  }, [MediaStore]);

  const disconnect = useCallback(async ({ playSound = true } = {}) => {
    if (manuallyClosedRef.current) return;
    manuallyClosedRef.current = true;
    if (playSound) playRoomSound(roomLeftSoundUrl, MediaStore.selectedDisplay);
    microphoneRequestRef.current += 1;
    clearInterval(heartbeatRef.current);
    const socket = socketRef.current;
    const transport = transportRef.current;
    socket?.send({ type: "leave" });
    socket?.disconnect();
    await transport?.disconnect();
    if (transportRef.current === transport) transportRef.current = null;
    if (socketRef.current === socket) socketRef.current = null;
    setParticipants([]);
    setLocalStreamReady(false);
    ChatStore?.clearVoiceParticipants(chatId);
  }, [ChatStore, MediaStore.selectedDisplay, chatId]);

  useEffect(() => {
    manuallyClosedRef.current = false;
    localJoinSoundPlayedRef.current = false;
    let cancelled = false;

    const connect = async () => {
      try {
        const { data } = await api.post(`/api/rooms/${chatId}/media-token/`, null, {
          skipErrorNotification: true,
        });
        if (data.transport !== "livekit") {
          throw new Error("Server did not select the LiveKit transport");
        }

        const transport = new LiveKitVoiceTransport({
          onParticipantChanged: mergeTransportParticipant,
          onParticipantLeft: (identity) =>
            setParticipants((current) =>
              current.filter((item) => String(item.user?.id) !== String(identity)),
            ),
          onActiveSpeakers: (identities) => {
            const speaking = new Set(identities.map(String));
            setParticipants((current) =>
              current.map((item) => ({
                ...item,
                state: { ...item.state, speaking: speaking.has(String(item.user?.id)) },
              })),
            );
          },
          onReconnecting: () => setIsJoining(true),
          onReconnected: () => setIsJoining(false),
          onDisconnected: () => {
            if (!manuallyClosedRef.current) setIsJoining(true);
          },
        });
        transportRef.current = transport;
        await transport.connect(data.url, data.token);
        if (cancelled) {
          await transport.disconnect();
          return;
        }
        if (!localJoinSoundPlayedRef.current) {
          localJoinSoundPlayedRef.current = true;
          playRoomSound(roomJoinSoundUrl, MediaStore.selectedDisplay);
        }
        await startMicrophone();
        setIsJoining(false);
      } catch (error) {
        if (!cancelled) {
          console.error("[VoiceRoom] LiveKit connection failed", error);
          setIsJoining(false);
        }
      }
    };

    const socket = new VoiceRoomSocket(chatId, {
      onOpen: () => {
        heartbeatRef.current = setInterval(
          () => socket.send({ type: "ping" }),
          HEARTBEAT_INTERVAL,
        );
      },
      onMessage: (data) => {
        if (data.type === "room_state") {
          directoryRef.current = new Map(
            data.participants.map((item) => [String(item.user?.id), item]),
          );
          setParticipants((current) =>
            data.participants.map((item) => {
              const existing = current.find(
                (entry) => String(entry.user?.id) === String(item.user?.id),
              );
              return existing ? { ...item, media: existing.media, stream: existing.stream } : item;
            }),
          );
          queueMicrotask(() => transportRef.current?.refreshParticipants());
        } else if (data.type === "user_joined") {
          playRoomSound(roomJoinSoundUrl, MediaStore.selectedDisplay);
          setParticipants((current) =>
            current.some((item) => item.id === data.participant.id)
              ? current
              : [...current, data.participant],
          );
        } else if (data.type === "user_left") {
          playRoomSound(roomLeftSoundUrl, MediaStore.selectedDisplay);
          setParticipants((current) =>
            current.filter((item) => item.id !== data.participant_id),
          );
        } else if (data.type === "media_state_update") {
          setParticipants((current) => current.map((item) =>
            item.id === data.participant_id
              ? { ...item, state: { ...item.state, ...data.state } }
              : item,
          ));
        }
      },
      onClose: () => clearInterval(heartbeatRef.current),
      onError: (error) => console.warn("[VoiceRoom] Presence socket error", error),
    });
    // Defer side effects by one macrotask. In development React Strict Mode
    // mounts, cleans up, and mounts effects again; the first timer is cancelled
    // before it can request a token or open duplicate LiveKit/room sockets.
    const connectTimer = window.setTimeout(() => {
      if (cancelled) return;
      socketRef.current = socket;
      socket.connect();
      connect();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(connectTimer);
      disconnect({ playSound: false });
    };
  }, [chatId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    ChatStore?.setVoiceParticipants(chatId, participants);
  }, [ChatStore, chatId, participants]);

  useEffect(() => {
    const replaceMicrophone = () => startMicrophone().catch(console.error);
    const replaceCamera = (event) => {
      transportRef.current
        ?.switchCamera(event.detail?.deviceId)
        .catch((error) => console.warn("[VoiceRoom] Cannot switch camera", error));
    };
    window.addEventListener("pepechat:microphonechange", replaceMicrophone);
    window.addEventListener("pepechat:audiosettingschange", replaceMicrophone);
    window.addEventListener("pepechat:camerachange", replaceCamera);
    return () => {
      window.removeEventListener("pepechat:microphonechange", replaceMicrophone);
      window.removeEventListener("pepechat:audiosettingschange", replaceMicrophone);
      window.removeEventListener("pepechat:camerachange", replaceCamera);
    };
  }, [startMicrophone]);

  const setMicEnabled = useCallback((enabled) => {
    transportRef.current?.setMicrophoneEnabled(enabled);
    socketRef.current?.send({ type: "media_state", state: { muted: !enabled } });
  }, []);

  const setHeadphonesMuted = useCallback((deafened) => {
    transportRef.current?.setDeafened(deafened);
    socketRef.current?.send({ type: "media_state", state: { deafened } });
    setParticipants((current) => current.map((item) =>
      String(item.user?.id) === String(AuthStore.user?.id)
        ? { ...item, state: { ...item.state, deafened } }
        : item,
    ));
  }, [AuthStore.user?.id]);

  return {
    participants,
    localStreamReady,
    isJoining,
    setMicEnabled,
    setHeadphonesMuted,
    setCameraEnabled: (enabled) =>
      transportRef.current?.setCameraEnabled(enabled, MediaStore.selectedCamera),
    setScreenShareEnabled: (enabled) =>
      transportRef.current?.setScreenShareEnabled(enabled),
    send: (data) => socketRef.current?.send(data),
    disconnect,
  };
};
