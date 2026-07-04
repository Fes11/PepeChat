import { useContext, useEffect, useRef, useState, useCallback } from "react";
import { VoiceRoomSocket } from "../api/VoiceRoomSocket";
import useWebRTC from "./useWebRTC";
import useSpeakingDetector from "./useSpeakingDetector";
import roomJoinSoundUrl from "../assets/sounds/JoinSound.mp3";
import roomLeftSoundUrl from "../assets/sounds/LeftSound.mp3";
import { Context } from "../main";

const HEARTBEAT_INTERVAL = 10_000;
const RECONNECT_DELAY = 3_000;
const ROOM_JOIN_SOUND_VOLUME = 0.4;
const LOCAL_STREAM_WAIT_TIMEOUT = 1_500;

const playRoomJoinSound = () => {
  const audio = new Audio(roomJoinSoundUrl);
  audio.volume = ROOM_JOIN_SOUND_VOLUME;
  audio.play().catch((err) => {
    console.warn("[VoiceRoom] Cannot play join sound", err);
  });
};

const playRoomLeftSound = () => {
  const audio = new Audio(roomLeftSoundUrl);
  audio.volume = ROOM_JOIN_SOUND_VOLUME;
  audio.play().catch((err) => {
    console.warn("[VoiceRoom] Cannot play left sound", err);
  });
};

export const useVoiceRoom = (chatId) => {
  const { AuthStore, MediaStore } = useContext(Context);
  const [participants, setParticipants] = useState([]);
  const [localStreamReady, setLocalStreamReady] = useState(false);

  // localStreamReady в замыканиях устаревает — держим актуальное значение в ref
  const localStreamReadyRef = useRef(false);

  const {
    peerConnections,
    localMediaStream,
    startLocalStream,
    switchLocalMicrophone,
    createPeerConnection,
    closePeerConnection,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    cleanup,
  } = useWebRTC(setParticipants, (ready) => {
    localStreamReadyRef.current = ready;
    setLocalStreamReady(ready);
  });

  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const connectTimeoutRef = useRef(null);
  const heartbeatRef = useRef(null);
  const manuallyClosedRef = useRef(false);
  const disconnectStartedRef = useRef(false);
  const localJoinSoundPlayedRef = useRef(false);
  const localMediaStateRef = useRef({ muted: false, speaking: false });
  const localParticipantIdRef = useRef(null);
  const connectingParticipantIdsRef = useRef(new Set());

  const mergeLocalParticipantState = useCallback(
    (nextParticipants, state = localMediaStateRef.current) => {
      const currentUserId = AuthStore.user?.id;
      if (!currentUserId) return nextParticipants;

      return nextParticipants.map((participant) =>
        String(participant.user?.id) === String(currentUserId)
          ? {
              ...participant,
              state: {
                ...participant.state,
                ...state,
              },
            }
          : participant,
      );
    },
    [AuthStore.user?.id],
  );

  const updateLocalParticipantState = useCallback(
    (state) => {
      setParticipants((prev) => mergeLocalParticipantState(prev, state));
    },
    [mergeLocalParticipantState],
  );

  const upsertParticipant = useCallback((participant) => {
    setParticipants((prev) => {
      const participantId = String(participant.id);
      const exists = prev.some((p) => String(p.id) === participantId);

      if (!exists) return [...prev, participant];

      return prev.map((p) =>
        String(p.id) === participantId
          ? { ...p, ...participant, state: { ...p.state, ...participant.state } }
          : p,
      );
    });
  }, []);

  const removeParticipant = useCallback((participantId) => {
    setParticipants((prev) =>
      prev.filter((p) => String(p.id) !== String(participantId)),
    );
  }, []);

  const rememberLocalParticipant = useCallback(
    (nextParticipants) => {
      const currentUserId = AuthStore.user?.id;
      if (!currentUserId) return;

      const localParticipant = nextParticipants.find(
        (participant) =>
          String(participant.user?.id) === String(currentUserId),
      );

      localParticipantIdRef.current = localParticipant?.id ?? null;
    },
    [AuthStore.user?.id],
  );

  const sendLocalMediaState = useCallback(
    (statePatch) => {
      localMediaStateRef.current = {
        ...localMediaStateRef.current,
        ...statePatch,
      };

      updateLocalParticipantState(localMediaStateRef.current);

      socketRef.current?.send({
        type: "media_state",
        state: localMediaStateRef.current,
      });
    },
    [updateLocalParticipantState],
  );

  const handleSpeakingChange = useCallback(
    (speaking) => {
      sendLocalMediaState({ speaking });
    },
    [sendLocalMediaState],
  );

  const { startSpeakingDetection, stopSpeakingDetection } = useSpeakingDetector({
    isMutedRef: localMediaStateRef,
    onSpeakingChange: handleSpeakingChange,
  });

  // ── Heartbeat ────────────────────────────────────────────────────────────

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();
    heartbeatRef.current = setInterval(() => {
      socketRef.current?.send({ type: "ping" });
    }, HEARTBEAT_INTERVAL);
  }, [stopHeartbeat]);

  // ── Join new participant ─────────────────────────────────────────────────

  // Используем ref чтобы joinUser всегда видел актуальный socketRef
  const joinUser = useCallback(
    async (participant) => {
      upsertParticipant(participant);

      const pc = await createPeerConnection(
        participant.id,
        (data) => socketRef.current?.send(data),
      );

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current?.send({
        type: "offer",
        target: participant.id,
        offer,
      });
    },
    [createPeerConnection, upsertParticipant],
  );

  const shouldInitiateConnection = useCallback((participant) => {
    const localParticipantId = localParticipantIdRef.current;
    if (!localParticipantId || !participant?.id) return false;

    const localId = Number(localParticipantId);
    const remoteId = Number(participant.id);

    if (Number.isFinite(localId) && Number.isFinite(remoteId)) {
      return localId < remoteId;
    }

    return String(localParticipantId) < String(participant.id);
  }, []);

  const waitForLocalStream = useCallback(async () => {
    if (localStreamReadyRef.current) return;

    await new Promise((resolve) => {
      const startedAt = Date.now();
      const id = setInterval(() => {
        if (
          localStreamReadyRef.current ||
          Date.now() - startedAt >= LOCAL_STREAM_WAIT_TIMEOUT
        ) {
          clearInterval(id);
          resolve();
        }
      }, 50);
    });
  }, []);

  const connectToParticipant = useCallback(
    async (participant) => {
      const participantId = String(participant.id);

      if (
        !participant?.id ||
        String(participant.id) === String(localParticipantIdRef.current) ||
        connectingParticipantIdsRef.current.has(participantId) ||
        peerConnections.current[participantId]
      ) {
        return;
      }

      connectingParticipantIdsRef.current.add(participantId);

      try {
        await waitForLocalStream();
        await joinUser(participant);
      } finally {
        connectingParticipantIdsRef.current.delete(participantId);
      }
    },
    [joinUser, peerConnections, waitForLocalStream],
  );

  const connectToParticipants = useCallback(
    async (nextParticipants) => {
      const initiators = nextParticipants.filter((participant) =>
        shouldInitiateConnection(participant),
      );

      for (const participant of initiators) {
        await connectToParticipant(participant);
      }
    },
    [connectToParticipant, shouldInitiateConnection],
  );

  // ── Connect ──────────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (!chatId) return;

    let socket;

    socket = new VoiceRoomSocket(chatId, {
      onOpen: async () => {
        if (socketRef.current !== socket) return;

        console.log("[VoiceRoom] WS connected");
        try {
          const stream = await startLocalStream();
          await startSpeakingDetection(stream);
        } catch {
          console.error("[VoiceRoom] Cannot access microphone");
        }
        if (!localJoinSoundPlayedRef.current) {
          localJoinSoundPlayedRef.current = true;
          playRoomJoinSound();
        }
        startHeartbeat();
      },

      onClose: () => {
        if (socketRef.current !== socket) return;

        console.log("[VoiceRoom] WS closed");
        stopHeartbeat();
        stopSpeakingDetection();
        cleanup();
        setParticipants([]);

        if (!manuallyClosedRef.current) {
          reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY);
        }
      },

      onError: (err) => {
        if (socketRef.current !== socket) return;
        console.error("[VoiceRoom] WS error", err);
      },

      onMessage: async (data) => {
        if (socketRef.current !== socket) return;

        switch (data.type) {
          // Начальное состояние комнаты — приходит сразу после подключения
          case "room_state": {
            const nextParticipants = mergeLocalParticipantState(
              data.participants,
            );
            rememberLocalParticipant(nextParticipants);
            setParticipants(nextParticipants);

            await connectToParticipants(nextParticipants);
            break;
          }

          // Новый участник подключился — мы инициируем offer
          case "user_joined": {
            playRoomJoinSound();

            if (shouldInitiateConnection(data.participant)) {
              await connectToParticipant(data.participant);
            } else {
              upsertParticipant(data.participant);
            }
            break;
          }

          // Участник отключился
          case "user_left":
            playRoomLeftSound();

            removeParticipant(data.participant_id);
            closePeerConnection(data.participant_id);
            connectingParticipantIdsRef.current.delete(
              String(data.participant_id),
            );
            break;

          // Входящий offer — мы отвечаем answer
          // Бэкенд шлёт тип "webrtc_offer", а не "offer"
          case "webrtc_offer":
            await handleOffer(
              data,
              (signal) => socketRef.current?.send(signal),
            );
            break;

          case "webrtc_answer":
            await handleAnswer(data);
            break;

          case "ice_candidate":
            await handleIceCandidate(data);
            break;

          case "media_state_update":
            setParticipants((prev) =>
              prev.map((p) =>
                String(p.id) === String(data.participant_id)
                  ? { ...p, state: { ...p.state, ...data.state } }
                  : p,
              ),
            );
            break;

          case "pong":
            break;

          default:
            console.warn("[VoiceRoom] Unknown message type:", data.type);
        }
      },
    });

    socketRef.current = socket;
    socket.connect();
  }, [
    chatId,
    startLocalStream,
    startSpeakingDetection,
    startHeartbeat,
    stopHeartbeat,
    stopSpeakingDetection,
    joinUser,
    connectToParticipant,
    connectToParticipants,
    mergeLocalParticipantState,
    rememberLocalParticipant,
    upsertParticipant,
    removeParticipant,
    shouldInitiateConnection,
    closePeerConnection,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    cleanup,
  ]);

  // ── Disconnect ───────────────────────────────────────────────────────────

  const disconnect = useCallback((options = {}) => {
    if (disconnectStartedRef.current) return;

    const { playSound = true } = options;
    disconnectStartedRef.current = true;
    manuallyClosedRef.current = true;
    stopHeartbeat();
    stopSpeakingDetection();

    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }

    if (playSound) {
      playRoomLeftSound();
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    socketRef.current?.send({ type: "leave" });
    cleanup(); // закрывает все PeerConnections и останавливает поток

    socketRef.current?.disconnect();
  }, [stopHeartbeat, stopSpeakingDetection, cleanup]);

  // ── Mute / Unmute ────────────────────────────────────────────────────────

  const setMicEnabled = useCallback(
    (enabled) => {
      localMediaStream.current
        ?.getAudioTracks()
        .forEach((t) => (t.enabled = enabled));

      sendLocalMediaState({
        muted: !enabled,
        speaking: enabled ? localMediaStateRef.current.speaking : false,
      });
    },
    [localMediaStream, sendLocalMediaState],
  );

  useEffect(() => {
    const switchMicrophone = async (deviceId) => {
      const stream = await switchLocalMicrophone(deviceId);
      await startSpeakingDetection(stream);
    };

    const handleMicrophoneChange = async (event) => {
      const deviceId = event.detail?.deviceId;

      try {
        await switchMicrophone(deviceId);
      } catch (err) {
        console.error("[VoiceRoom] Cannot switch microphone", err);
      }
    };

    const handleAudioSettingsChange = async () => {
      try {
        await switchMicrophone(MediaStore.selectedMicrophone);
      } catch (err) {
        console.error("[VoiceRoom] Cannot apply audio settings", err);
      }
    };

    window.addEventListener(
      "pepechat:microphonechange",
      handleMicrophoneChange,
    );
    window.addEventListener(
      "pepechat:audiosettingschange",
      handleAudioSettingsChange,
    );

    return () => {
      window.removeEventListener(
        "pepechat:microphonechange",
        handleMicrophoneChange,
      );
      window.removeEventListener(
        "pepechat:audiosettingschange",
        handleAudioSettingsChange,
      );
    };
  }, [
    MediaStore.selectedMicrophone,
    startSpeakingDetection,
    switchLocalMicrophone,
  ]);

  // ── Lifecycle ────────────────────────────────────────────────────────────

  useEffect(() => {
    manuallyClosedRef.current = false;
    disconnectStartedRef.current = false;
    localJoinSoundPlayedRef.current = false;
    localMediaStateRef.current = { muted: false, speaking: false };
    localParticipantIdRef.current = null;
    connectingParticipantIdsRef.current = new Set();

    connectTimeoutRef.current = setTimeout(() => {
      connectTimeoutRef.current = null;
      connect();
    }, 0);

    return () => disconnect({ playSound: false });
  }, [chatId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    participants,
    localStreamReady,
    setMicEnabled,
    send: (data) => socketRef.current?.send(data),
    disconnect,
  };
};
