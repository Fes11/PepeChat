import { useRef, useContext, useCallback } from "react";
import { mediaService } from "../services/MediaService";
import { Context } from "../main";

const ICE_SERVERS = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
    },
  ],
};

const useWebRTC = (setParticipants, setLocalStreamReady) => {
  const { MediaStore } = useContext(Context);

  // Хранятся здесь и пробрасываются наружу через геттер
  const peerConnections = useRef({});
  const localMediaStream = useRef(null);

  const startLocalStream = useCallback(async () => {
    try {
      const stream = await mediaService.getMicrophone(
        MediaStore.selectedMicrophone,
      );

      if (localMediaStream.current) {
        mediaService.stopStream(localMediaStream.current);
      }

      localMediaStream.current = stream;
      setLocalStreamReady(true);
      return stream;
    } catch (err) {
      console.error("Failed to get microphone access:", err);
      throw err;
    }
  }, [MediaStore.selectedMicrophone, setLocalStreamReady]);

  const createPeerConnection = useCallback(
    async (participantId, sendSignal) => {
      if (peerConnections.current[participantId]) {
        peerConnections.current[participantId].close();
      }

      const stream =
        localMediaStream.current || await startLocalStream();

      if (!stream) {
        throw new Error("Failed to initialize local stream");
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal({
            type: "ice_candidate",
            target: participantId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === participantId ? { ...p, stream: remoteStream } : p,
          ),
        );
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          console.warn(
            `PeerConnection [${participantId}] state: ${pc.connectionState}`,
          );
        }
      };

      peerConnections.current[participantId] = pc;
      return pc;
    },
    [setParticipants],
  );

  const handleOffer = useCallback(
    async (data, sendSignal) => {
      const { sender, offer } = data;

      // Если уже есть соединение — закрываем (пересоздаём)
      const pc = await createPeerConnection(sender, sendSignal);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignal({
        type: "answer",
        target: sender,
        answer,
      });
    },
    [createPeerConnection],
  );

  const handleAnswer = useCallback(async (data) => {
    const { sender, answer } = data;
    const pc = peerConnections.current[sender];

    if (!pc) {
      console.warn(`No peer connection for sender: ${sender}`);
      return;
    }

    if (pc.signalingState === "have-local-offer") {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } else {
      console.warn(
        `Cannot set remote answer — signalingState: ${pc.signalingState}`,
      );
    }
  }, []);

  const handleIceCandidate = useCallback(async (data) => {
    const { sender, candidate } = data;
    const pc = peerConnections.current[sender];

    if (!pc) return;

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("Failed to add ICE candidate:", err);
    }
  }, []);

  // Закрыть конкретное соединение
  const closePeerConnection = useCallback((participantId) => {
    const pc = peerConnections.current[participantId];
    if (pc) {
      pc.close();
      delete peerConnections.current[participantId];
    }
  }, []);

  // Закрыть все соединения и остановить поток
  const cleanup = useCallback(() => {
    Object.values(peerConnections.current).forEach((pc) => pc.close());
    peerConnections.current = {};

    if (localMediaStream.current) {
      localMediaStream.current.getTracks().forEach((t) => t.stop());
      localMediaStream.current = null;
    }

    setLocalStreamReady(false);
  }, [setLocalStreamReady]);

  return {
    peerConnections,       // ref — пробрасываем наружу для useVoiceRoom
    localMediaStream,      // ref — пробрасываем наружу для useVoiceRoom
    startLocalStream,
    createPeerConnection,
    closePeerConnection,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    cleanup,
  };
};

export default useWebRTC;
