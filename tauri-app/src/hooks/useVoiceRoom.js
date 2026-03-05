import { useEffect, useRef, useState, useCallback } from "react";
import { VoiceRoomSocket } from "../api/VoiceRoomSocket";
import useWebRTC from "./useWebRTC";

const HEARTBEAT_INTERVAL = 10000; // 10 сек
const RECONNECT_DELAY = 3000; // 3 сек

export const useVoiceRoom = (chatId) => {
  const {
    startLocalStream,
    createPeerConnection,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    // startVoiceDetection,
  } = useWebRTC();
  const [participants, setParticipants] = useState([]);
  const socketRef = useRef(null);

  const reconnectTimeoutRef = useRef(null);
  const heartbeatRef = useRef(null);
  const manuallyClosedRef = useRef(false);

  // useEffect(() => {
  //   if (!socketRef.current) return;

  //   const init = async () => {
  //     try {
  //       startVoiceDetection((isSpeaking) => {
  //         socketRef.current.send({
  //           type: "media_state",
  //           state: { speaking: isSpeaking },
  //         });
  //       });
  //     } catch (e) {
  //       console.warn("Cannot access microphone", e);
  //     }
  //   };

  //   init();
  // }, [startLocalStream]);

  const startHeartbeat = useCallback(() => {
    stopHeartbeat();

    heartbeatRef.current = setInterval(() => {
      socketRef.current?.send({ type: "ping" });
    }, HEARTBEAT_INTERVAL);
  }, []);

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  };

  const connect = useCallback(() => {
    if (!chatId) return;

    const socket = new VoiceRoomSocket(chatId, {
      onOpen: async () => {
        console.log("WS connected");
        // try {
        //   startVoiceDetection((isSpeaking) => {
        //     console.log("Voice: ", isSpeaking);
        //     socketRef.current.send({
        //       type: "media_state",
        //       state: { speaking: isSpeaking },
        //     });
        //   });
        // } catch (e) {
        //   console.warn("Cannot access microphone", e);
        // }

        // startHeartbeat();
      },

      onClose: () => {
        console.log("WS closed");
        // stopHeartbeat();

        if (!manuallyClosedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_DELAY);
        }
      },

      onError: (err) => {
        console.log("WS error", err);
      },

      onMessage: async (data) => {
        switch (data.type) {
          case "room_state":
            setParticipants(data.participants);
            break;

          case "user_joined":
            setParticipants((prev) => {
              if (prev.find((p) => p.id === data.participant.id)) return prev;
              return [...prev, data.participant];
            });

            const pc = createPeerConnection(
              data.participant.id,
              socketRef.current.send.bind(socketRef.current),
            );

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socketRef.current.send({
              type: "offer",
              target: data.participant.id,
              offer,
            });

          case "user_left":
            setParticipants((prev) =>
              prev.filter((p) => String(p.id) !== String(data.participant_id)),
            );
            break;

          case "webrtc_offer":
            await handleOffer(
              data,
              socketRef.current.send.bind(socketRef.current),
            );
            break;

          case "webrtc_answer":
            await handleAnswer(data);
            break;

          case "ice_candidate":
            await handleIceCandidate(data);
            break;

          // case "media_state_update":
          //   setParticipants((prev) =>
          //     prev.map((p) =>
          //       p.id === data.participant_id ? { ...p, state: data.state } : p,
          //     ),
          //   );
          //   break;

          case "pong":
            // можно логировать latency при желании
            break;

          default:
            break;
        }
      },
    });

    socket.connect();
    socketRef.current = socket;
  }, [chatId, startHeartbeat]);

  const disconnect = useCallback(() => {
    manuallyClosedRef.current = true;
    stopHeartbeat();

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    socketRef.current?.disconnect();
  }, []);

  useEffect(() => {
    manuallyClosedRef.current = false;
    connect();

    return () => {
      disconnect();
    };
  }, [chatId]);

  return {
    participants,
    send: (data) => socketRef.current?.send(data),
    disconnect,
  };
};
