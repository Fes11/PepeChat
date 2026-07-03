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
const MAX_PENDING_ICE_CANDIDATES = 32;
const PENDING_ICE_TTL = 30_000;

const useWebRTC = (setParticipants, setLocalStreamReady) => {
  const { MediaStore } = useContext(Context);

  // Хранятся здесь и пробрасываются наружу через геттер
  const peerConnections = useRef({});
  const pendingIceCandidates = useRef({});
  const localMediaStream = useRef(null);

  const flushPendingIceCandidates = useCallback(async (participantId) => {
    const key = String(participantId);
    const pc = peerConnections.current[key];
    const now = Date.now();
    const candidates = (pendingIceCandidates.current[key] || []).filter(
      (item) => now - item.receivedAt <= PENDING_ICE_TTL,
    );

    if (!pc || !pc.remoteDescription || candidates.length === 0) return;

    pendingIceCandidates.current[key] = [];

    await Promise.all(
      candidates.map((item) =>
        pc
          .addIceCandidate(new RTCIceCandidate(item.candidate))
          .catch((err) => {
            console.error("Failed to add queued ICE candidate:", err);
          }),
      ),
    );
  }, []);

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
      const peerKey = String(participantId);

      if (peerConnections.current[peerKey]) {
        peerConnections.current[peerKey].close();
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      let stream = localMediaStream.current;

      if (!stream) {
        try {
          stream = await startLocalStream();
        } catch (err) {
          console.warn(
            "PeerConnection will be created without local microphone:",
            err,
          );
        }
      }

      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      } else {
        pc.addTransceiver("audio", { direction: "recvonly" });
      }

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
        const remoteStream = event.streams[0] || new MediaStream([event.track]);
        setParticipants((prev) =>
          prev.map((p) =>
            String(p.id) === String(participantId)
              ? { ...p, stream: remoteStream }
              : p,
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

      peerConnections.current[peerKey] = pc;
      return pc;
    },
    [setParticipants, startLocalStream],
  );

  const handleOffer = useCallback(
    async (data, sendSignal) => {
      const { sender, offer } = data;

      // Если уже есть соединение — закрываем (пересоздаём)
      const pc = await createPeerConnection(sender, sendSignal);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await flushPendingIceCandidates(sender);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignal({
        type: "answer",
        target: sender,
        answer,
      });
    },
    [createPeerConnection, flushPendingIceCandidates],
  );

  const handleAnswer = useCallback(async (data) => {
    const { sender, answer } = data;
    const pc = peerConnections.current[String(sender)];

    if (!pc) {
      console.warn(`No peer connection for sender: ${sender}`);
      return;
    }

    if (pc.signalingState === "have-local-offer") {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      await flushPendingIceCandidates(sender);
    } else {
      console.warn(
        `Cannot set remote answer — signalingState: ${pc.signalingState}`,
      );
    }
  }, [flushPendingIceCandidates]);

  const handleIceCandidate = useCallback(async (data) => {
    const { sender, candidate } = data;
    const peerKey = String(sender);
    const pc = peerConnections.current[peerKey];

    if (!pc || !pc.remoteDescription) {
      pendingIceCandidates.current[peerKey] = [
        ...(pendingIceCandidates.current[peerKey] || []),
        { candidate, receivedAt: Date.now() },
      ].slice(-MAX_PENDING_ICE_CANDIDATES);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("Failed to add ICE candidate:", err);
    }
  }, []);

  // Закрыть конкретное соединение
  const closePeerConnection = useCallback((participantId) => {
    const peerKey = String(participantId);
    const pc = peerConnections.current[peerKey];
    if (pc) {
      pc.close();
      delete peerConnections.current[peerKey];
    }
    delete pendingIceCandidates.current[peerKey];
  }, []);

  // Закрыть все соединения и остановить поток
  const cleanup = useCallback(() => {
    Object.values(peerConnections.current).forEach((pc) => pc.close());
    peerConnections.current = {};
    pendingIceCandidates.current = {};

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
