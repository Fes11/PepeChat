import { useEffect, useRef, useState, useCallback } from "react";
import { VoiceRoomSocket } from "../api/VoiceRoomSocket";
import useWebRTC from "./useWebRTC";

const HEARTBEAT_INTERVAL = 10_000;
const RECONNECT_DELAY = 3_000;

export const useVoiceRoom = (chatId) => {
  const [participants, setParticipants] = useState([]);
  const [localStreamReady, setLocalStreamReady] = useState(false);

  // localStreamReady в замыканиях устаревает — держим актуальное значение в ref
  const localStreamReadyRef = useRef(false);

  const {
    peerConnections,
    localMediaStream,
    startLocalStream,
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
  const heartbeatRef = useRef(null);
  const manuallyClosedRef = useRef(false);

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
      // Добавляем в список только если ещё нет
      setParticipants((prev) => {
        if (prev.find((p) => p.id === participant.id)) return prev;
        return [...prev, participant];
      });

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
    [createPeerConnection],
  );

  // ── Connect ──────────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (!chatId) return;

    const socket = new VoiceRoomSocket(chatId, {
      onOpen: async () => {
        console.log("[VoiceRoom] WS connected");
        try {
          await startLocalStream();
        } catch {
          console.error("[VoiceRoom] Cannot access microphone");
        }
        startHeartbeat();
      },

      onClose: () => {
        console.log("[VoiceRoom] WS closed");
        stopHeartbeat();
        cleanup();
        setParticipants([]);

        if (!manuallyClosedRef.current) {
          reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY);
        }
      },

      onError: (err) => {
        console.error("[VoiceRoom] WS error", err);
      },

      onMessage: async (data) => {
        switch (data.type) {
          // Начальное состояние комнаты — приходит сразу после подключения
          case "room_state":
            setParticipants(data.participants);
            break;

          // Новый участник подключился — мы инициируем offer
          case "user_joined": {
            // Ждём готовности локального потока (без setInterval-антипаттерна)
            if (!localStreamReadyRef.current) {
              await new Promise((resolve) => {
                const id = setInterval(() => {
                  if (localStreamReadyRef.current) {
                    clearInterval(id);
                    resolve();
                  }
                }, 50);
              });
            }
            await joinUser(data.participant);
            break;
          }

          // Участник отключился
          case "user_left":
            setParticipants((prev) =>
              prev.filter((p) => String(p.id) !== String(data.participant_id)),
            );
            closePeerConnection(data.participant_id);
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
                  ? { ...p, state: data.state }
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
    startHeartbeat,
    stopHeartbeat,
    joinUser,
    closePeerConnection,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    cleanup,
  ]);

  // ── Disconnect ───────────────────────────────────────────────────────────

  const disconnect = useCallback(() => {
    manuallyClosedRef.current = true;
    stopHeartbeat();

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    cleanup(); // закрывает все PeerConnections и останавливает поток

    socketRef.current?.disconnect();
    socketRef.current = null;
  }, [stopHeartbeat, cleanup]);

  // ── Mute / Unmute ────────────────────────────────────────────────────────

  const setMicEnabled = useCallback(
    (enabled) => {
      localMediaStream.current
        ?.getAudioTracks()
        .forEach((t) => (t.enabled = enabled));

      socketRef.current?.send({
        type: "media_state",
        state: { muted: !enabled },
      });
    },
    [localMediaStream],
  );

  // ── Lifecycle ────────────────────────────────────────────────────────────

  useEffect(() => {
    manuallyClosedRef.current = false;
    connect();
    return disconnect;
  }, [chatId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    participants,
    localStreamReady,
    setMicEnabled,
    send: (data) => socketRef.current?.send(data),
    disconnect,
  };
};
