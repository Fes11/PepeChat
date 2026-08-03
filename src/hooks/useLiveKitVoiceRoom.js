import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  api,
  redirectToLogin,
  refreshAccessToken,
} from "../api/index.jsx";
import { VoiceRoomSocket } from "../api/voiceRoomSocket";
import { Context } from "../main";
import { mediaService } from "../services/MediaService";
import { LiveKitVoiceTransport } from "../services/LiveKitVoiceTransport";
import roomJoinSoundUrl from "../assets/sounds/JoinSound.mp3";
import roomLeftSoundUrl from "../assets/sounds/LeftSound.mp3";
import { isHotAudioSettingsChange } from "../constants/audioSettings";
import {
  clearMediaParticipant,
  mergeMediaParticipant,
  replaceRoomParticipants,
  setParticipantNetworkIssue,
} from "./voiceParticipantState";
import {
  isDesktopApp,
  screenShareService,
} from "../services/ScreenShareService";
import {
  DEFAULT_SCREEN_SHARE_QUALITY,
  normalizeScreenShareQuality,
} from "../constants/screenShareQuality";
import useSpeakingDetector from "./useSpeakingDetector";

const HEARTBEAT_INTERVAL = 10_000;
const MEDIA_RECONNECT_DELAY = 1_000;
const MAX_MEDIA_RECONNECT_DELAY = 30_000;
const ROOM_SOUND_VOLUME = 0.2;

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
  const [screenShareActive, setScreenShareActive] = useState(false);
  const [latencyMs, setLatencyMs] = useState(null);
  const transportRef = useRef(null);
  const socketRef = useRef(null);
  const heartbeatRef = useRef(null);
  const pingStartedAtRef = useRef(null);
  const directoryRef = useRef(new Map());
  const manuallyClosedRef = useRef(false);
  const microphoneRequestRef = useRef(0);
  const screenShareRequestRef = useRef(0);
  const microphoneEnabledRef = useRef(true);
  const localMuteStateRef = useRef({ muted: false });
  const localSpeakingRef = useRef(false);
  const liveKitSpeakingRef = useRef(new Set());
  const localJoinSoundPlayedRef = useRef(false);

  const updateLocalParticipantState = useCallback(
    (statePatch) => {
      setParticipants((current) =>
        current.map((item) =>
          String(item.user?.id) === String(AuthStore.user?.id)
            ? { ...item, state: { ...item.state, ...statePatch } }
            : item,
        ),
      );
    },
    [AuthStore.user?.id],
  );

  const handleLocalSpeakingChange = useCallback(
    (speaking) => {
      localSpeakingRef.current = speaking;
      const isReportedByLiveKit = liveKitSpeakingRef.current.has(
        String(AuthStore.user?.id),
      );
      updateLocalParticipantState({
        speaking:
          !localMuteStateRef.current.muted &&
          (speaking || isReportedByLiveKit),
      });
    },
    [AuthStore.user?.id, updateLocalParticipantState],
  );

  const { startSpeakingDetection, stopSpeakingDetection } =
    useSpeakingDetector({
      isMutedRef: localMuteStateRef,
      onSpeakingChange: handleLocalSpeakingChange,
    });

  const mergeTransportParticipant = useCallback((mediaParticipant) => {
    setParticipants((current) =>
      mergeMediaParticipant(
        current,
        directoryRef.current,
        mediaParticipant,
      ),
    );
  }, []);

  const clearTransportParticipant = useCallback((identity) => {
    // ParticipantDisconnected is also emitted for every remote participant
    // during a LiveKit full reconnect. Keep logical room membership and only
    // detach media until ParticipantConnected/TrackSubscribed restores it.
    setParticipants((current) => clearMediaParticipant(current, identity));
  }, []);

  const setNetworkIssue = useCallback((identity, networkIssue) => {
    if (identity == null) return;
    setParticipants((current) =>
      setParticipantNetworkIssue(current, identity, networkIssue),
    );
  }, []);

  const startMicrophone = useCallback(async () => {
    const requestId = ++microphoneRequestRef.current;
    const stream = await mediaService.getMicrophone(
      MediaStore.selectedMicrophone,
      {
        volume: MediaStore.volume,
        audioSettings: MediaStore.getAudioSettings(),
      },
    );
    if (requestId !== microphoneRequestRef.current || !transportRef.current) {
      mediaService.stopStream(stream);
      return;
    }
    await transportRef.current?.publishMicrophone(stream);
    await transportRef.current?.setMicrophoneEnabled(
      microphoneEnabledRef.current,
    );
    await startSpeakingDetection(stream);
    setLocalStreamReady(true);
  }, [MediaStore, startSpeakingDetection]);

  const disconnect = useCallback(
    async ({ playSound = true } = {}) => {
      if (manuallyClosedRef.current) return;
      manuallyClosedRef.current = true;
      if (playSound)
        playRoomSound(roomLeftSoundUrl, MediaStore.selectedDisplay);
      microphoneRequestRef.current += 1;
      screenShareRequestRef.current += 1;
      clearInterval(heartbeatRef.current);
      stopSpeakingDetection();
      liveKitSpeakingRef.current.clear();
      localSpeakingRef.current = false;
      const socket = socketRef.current;
      const transport = transportRef.current;
      socket?.send({ type: "leave" });
      socket?.disconnect();
      if (isDesktopApp()) {
        try {
          await screenShareService.stop();
        } catch (error) {
          console.warn("[VoiceRoom] Cannot stop native screen share", error);
        }
      } else {
        await transport?.setScreenShareEnabled(false).catch(() => {});
      }
      await transport?.disconnect();
      if (transportRef.current === transport) transportRef.current = null;
      if (socketRef.current === socket) socketRef.current = null;
      setParticipants([]);
      setLocalStreamReady(false);
      setScreenShareActive(false);
      ChatStore?.clearVoiceParticipants(chatId);
    },
    [
      ChatStore,
      MediaStore.selectedDisplay,
      chatId,
      stopSpeakingDetection,
    ],
  );

  useEffect(() => {
    manuallyClosedRef.current = false;
    localJoinSoundPlayedRef.current = false;
    directoryRef.current = new Map();
    pingStartedAtRef.current = null;
    setLatencyMs(null);
    let cancelled = false;
    let mediaReconnectTimer = null;
    let mediaReconnectAttempts = 0;
    let mediaConnectInProgress = false;

    const scheduleMediaReconnect = () => {
      if (
        cancelled ||
        manuallyClosedRef.current ||
        mediaReconnectTimer
      ) {
        return;
      }

      const delay = Math.min(
        MEDIA_RECONNECT_DELAY * 2 ** mediaReconnectAttempts,
        MAX_MEDIA_RECONNECT_DELAY,
      );
      mediaReconnectAttempts += 1;
      setIsJoining(true);
      mediaReconnectTimer = window.setTimeout(() => {
        mediaReconnectTimer = null;
        void connectMedia();
      }, delay);
    };

    const connectMedia = async () => {
      if (
        cancelled ||
        manuallyClosedRef.current ||
        mediaConnectInProgress
      ) {
        return;
      }

      mediaConnectInProgress = true;
      let transport = null;
      try {
        const { data } = await api.post(
          `/api/rooms/${chatId}/media-token/`,
          null,
          {
            skipErrorNotification: true,
          },
        );
        if (data.transport !== "livekit") {
          throw new Error("Server did not select the LiveKit transport");
        }

        transport = new LiveKitVoiceTransport({
          onParticipantChanged: mergeTransportParticipant,
          onParticipantLeft: clearTransportParticipant,
          onActiveSpeakers: (identities) => {
            const speaking = new Set(identities.map(String));
            liveKitSpeakingRef.current = speaking;
            setParticipants((current) =>
              current.map((item) => {
                const identity = String(item.user?.id);
                const isLocal =
                  identity === String(AuthStore.user?.id);
                return {
                  ...item,
                  state: {
                    ...item.state,
                    speaking: isLocal
                      ? !localMuteStateRef.current.muted &&
                        (localSpeakingRef.current || speaking.has(identity))
                      : speaking.has(identity),
                  },
                };
              }),
            );
          },
          onLocalScreenShareChanged: setScreenShareActive,
          onReconnecting: () => {
            if (transportRef.current !== transport) return;
            setNetworkIssue(AuthStore.user?.id, true);
            setIsJoining(true);
          },
          onReconnected: () => {
            if (transportRef.current !== transport) return;
            mediaReconnectAttempts = 0;
            setNetworkIssue(AuthStore.user?.id, false);
            setIsJoining(false);
            transport.refreshParticipants();
          },
          onDisconnected: () => {
            if (
              transportRef.current !== transport ||
              manuallyClosedRef.current ||
              cancelled
            ) {
              return;
            }

            transportRef.current = null;
            setScreenShareActive(false);
            setNetworkIssue(AuthStore.user?.id, true);
            setLocalStreamReady(false);
            setIsJoining(true);
            void transport.disconnect().catch(() => {});
            scheduleMediaReconnect();
          },
        });
        transportRef.current = transport;
        await transport.connect(data.url, data.token);
        if (
          cancelled ||
          manuallyClosedRef.current ||
          transportRef.current !== transport
        ) {
          if (transportRef.current === transport) transportRef.current = null;
          await transport.disconnect();
          return;
        }
        if (!localJoinSoundPlayedRef.current) {
          localJoinSoundPlayedRef.current = true;
          playRoomSound(roomJoinSoundUrl, MediaStore.selectedDisplay);
        }
        await startMicrophone();
        mediaReconnectAttempts = 0;
        setNetworkIssue(AuthStore.user?.id, false);
        setIsJoining(false);
      } catch (error) {
        if (!cancelled && !manuallyClosedRef.current) {
          console.error("[VoiceRoom] LiveKit connection failed", error);
          if (transportRef.current === transport) transportRef.current = null;
          await transport?.disconnect().catch(() => {});
          setLocalStreamReady(false);
          scheduleMediaReconnect();
        }
      } finally {
        mediaConnectInProgress = false;
      }
    };

    const socket = new VoiceRoomSocket(chatId, {
      onOpen: () => {
        clearInterval(heartbeatRef.current);
        const sendHeartbeat = () => {
          if (socket.send({ type: "ping" })) {
            pingStartedAtRef.current = performance.now();
          }
        };
        sendHeartbeat();
        heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
      },
      onMessage: (data) => {
        if (data.type === "pong") {
          if (pingStartedAtRef.current != null) {
            setLatencyMs(
              Math.max(0, Math.round(performance.now() - pingStartedAtRef.current)),
            );
            pingStartedAtRef.current = null;
          }
        } else if (data.type === "room_state") {
          directoryRef.current = new Map(
            data.participants.map((item) => [String(item.user?.id), item]),
          );
          setParticipants((current) =>
            replaceRoomParticipants(current, data.participants),
          );
          queueMicrotask(() => transportRef.current?.refreshParticipants());
        } else if (data.type === "user_joined") {
          playRoomSound(roomJoinSoundUrl, MediaStore.selectedDisplay);
          directoryRef.current.set(
            String(data.participant.user?.id),
            data.participant,
          );
          setParticipants((current) =>
            current.some(
              (item) => String(item.id) === String(data.participant.id),
            )
              ? current
              : [...current, data.participant],
          );
          queueMicrotask(() => transportRef.current?.refreshParticipants());
        } else if (data.type === "user_left") {
          playRoomSound(roomLeftSoundUrl, MediaStore.selectedDisplay);
          for (const [identity, participant] of directoryRef.current) {
            if (String(participant.id) === String(data.participant_id)) {
              directoryRef.current.delete(identity);
              break;
            }
          }
          setParticipants((current) =>
            current.filter(
              (item) => String(item.id) !== String(data.participant_id),
            ),
          );
        } else if (data.type === "media_state_update") {
          setParticipants((current) =>
            current.map((item) =>
              item.id === data.participant_id
                ? { ...item, state: { ...item.state, ...data.state } }
                : item,
            ),
          );
        }
      },
      onClose: () => {
        clearInterval(heartbeatRef.current);
        pingStartedAtRef.current = null;
        setLatencyMs(null);
      },
      onReconnecting: () => {
        if (!manuallyClosedRef.current) {
          console.info("[VoiceRoom] Reconnecting presence socket");
        }
      },
      refreshToken: refreshAccessToken,
      onAuthFailure: redirectToLogin,
      onError: (error) =>
        console.warn("[VoiceRoom] Presence socket error", error),
    });
    // Defer side effects by one macrotask. In development React Strict Mode
    // mounts, cleans up, and mounts effects again; the first timer is cancelled
    // before it can request a token or open duplicate LiveKit/room sockets.
    const connectTimer = window.setTimeout(() => {
      if (cancelled) return;
      socketRef.current = socket;
      socket.connect();
      void connectMedia();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(connectTimer);
      if (mediaReconnectTimer) {
        window.clearTimeout(mediaReconnectTimer);
        mediaReconnectTimer = null;
      }
      disconnect({ playSound: false });
    };
  }, [chatId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    ChatStore?.setVoiceParticipants(chatId, participants);
  }, [ChatStore, chatId, participants]);

  useEffect(() => {
    const replaceMicrophone = () => startMicrophone().catch(console.error);
    const applyAudioSettings = (event) => {
      const changedKeys = event.detail?.changedKeys ?? [];
      const settings = event.detail?.settings ?? MediaStore.getAudioSettings();
      if (
        isHotAudioSettingsChange(changedKeys) &&
        transportRef.current?.updateMicrophoneSettings(settings, changedKeys)
      ) {
        return;
      }
      replaceMicrophone();
    };
    const replaceCamera = (event) => {
      transportRef.current
        ?.switchCamera(event.detail?.deviceId)
        .catch((error) =>
          console.warn("[VoiceRoom] Cannot switch camera", error),
        );
    };
    window.addEventListener("pepechat:microphonechange", replaceMicrophone);
    window.addEventListener("pepechat:audiosettingschange", applyAudioSettings);
    window.addEventListener("pepechat:camerachange", replaceCamera);
    return () => {
      window.removeEventListener(
        "pepechat:microphonechange",
        replaceMicrophone,
      );
      window.removeEventListener(
        "pepechat:audiosettingschange",
        applyAudioSettings,
      );
      window.removeEventListener("pepechat:camerachange", replaceCamera);
    };
  }, [MediaStore, startMicrophone]);

  const setMicEnabled = useCallback(
    (enabled) => {
      microphoneEnabledRef.current = enabled;
      localMuteStateRef.current.muted = !enabled;
      if (!enabled) localSpeakingRef.current = false;
      updateLocalParticipantState({ muted: !enabled, speaking: false });
      transportRef.current?.setMicrophoneEnabled(enabled).catch((error) => {
        console.warn("[VoiceRoom] Cannot change microphone state", error);
      });
      socketRef.current?.send({
        type: "media_state",
        state: { muted: !enabled },
      });
    },
    [updateLocalParticipantState],
  );

  const setHeadphonesMuted = useCallback(
    (deafened) => {
      transportRef.current?.setDeafened(deafened);
      socketRef.current?.send({ type: "media_state", state: { deafened } });
      updateLocalParticipantState({ deafened });
    },
    [updateLocalParticipantState],
  );

  return {
    participants,
    localStreamReady,
    screenShareActive,
    isJoining,
    latencyMs,
    setMicEnabled,
    setHeadphonesMuted,
    setCameraEnabled: (enabled) =>
      transportRef.current?.setCameraEnabled(
        enabled,
        MediaStore.selectedCamera,
      ),
    setScreenShareEnabled: (enabled, options) =>
      transportRef.current?.setScreenShareEnabled(enabled, options),
    startScreenShare: async (
      sourceId,
      withAudio,
      qualityId = DEFAULT_SCREEN_SHARE_QUALITY,
    ) => {
      const quality = normalizeScreenShareQuality(qualityId);
      if (!isDesktopApp()) {
        const transport = transportRef.current;
        if (!transport) throw new Error("Медиасоединение ещё не установлено");
        const state = await transport.setScreenShareEnabled(true, {
          withAudio,
          qualityId: quality,
        });
        setScreenShareActive(Boolean(state?.active));
        return state;
      }
      const requestId = ++screenShareRequestRef.current;
      const { data } = await api.post(
        `/api/rooms/${chatId}/media-token/`,
        { role: "screen" },
        { skipErrorNotification: true },
      );
      if (
        manuallyClosedRef.current ||
        requestId !== screenShareRequestRef.current
      ) {
        throw new Error("Голосовая комната уже закрыта");
      }
      const state = await screenShareService.start({
        sourceId,
        withAudio,
        quality,
        url: data.url,
        token: data.token,
      });
      if (
        manuallyClosedRef.current ||
        requestId !== screenShareRequestRef.current
      ) {
        await screenShareService.stop().catch(() => {});
        throw new Error("Голосовая комната уже закрыта");
      }
      return state;
    },
    stopScreenShare: () => {
      screenShareRequestRef.current += 1;
      setScreenShareActive(false);
      return isDesktopApp()
        ? screenShareService.stop()
        : transportRef.current?.setScreenShareEnabled(false);
    },
    send: (data) => socketRef.current?.send(data),
    disconnect,
  };
};
