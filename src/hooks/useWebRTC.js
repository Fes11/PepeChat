import { useRef, useContext, useCallback } from "react";
import { mediaService } from "../services/MediaService";
import { Context } from "../main";

const DEFAULT_ICE_SERVERS = [
  {
    urls: [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302",
      "stun:openrelay.metered.ca:80",
    ],
  },
  {
    urls: [
      "turn:openrelay.metered.ca:80",
      "turn:openrelay.metered.ca:443",
      "turn:openrelay.metered.ca:443?transport=tcp",
      "turns:openrelay.metered.ca:443?transport=tcp",
    ],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

const getIceServersConfig = () => {
  const envConfig = import.meta.env.VITE_ICE_SERVERS_JSON;

  if (!envConfig) {
    return { iceServers: DEFAULT_ICE_SERVERS };
  }

  try {
    const parsedConfig = JSON.parse(envConfig);
    const iceServers = Array.isArray(parsedConfig)
      ? parsedConfig
      : parsedConfig?.iceServers;

    if (Array.isArray(iceServers) && iceServers.length > 0) {
      return { iceServers };
    }

    console.warn(
      "[VoiceRoom] VITE_ICE_SERVERS_JSON must be an array or an object with iceServers.",
    );
  } catch (err) {
    console.warn("[VoiceRoom] Failed to parse VITE_ICE_SERVERS_JSON", err);
  }

  return { iceServers: DEFAULT_ICE_SERVERS };
};

const ICE_SERVERS = getIceServersConfig();
const MAX_PENDING_ICE_CANDIDATES = 32;
const PENDING_ICE_TTL = 30_000;
const AUDIO_MAX_BITRATE = 64_000;
const CONNECTION_STATS_INTERVAL = 5_000;
const HIGH_JITTER_SECONDS = 0.08;
const HIGH_ROUND_TRIP_TIME_SECONDS = 0.5;
const HIGH_PACKET_LOSS = 20;

const useWebRTC = (setParticipants, setLocalStreamReady) => {
  const { MediaStore } = useContext(Context);

  // Хранятся здесь и пробрасываются наружу через геттер
  const peerConnections = useRef({});
  const pendingIceCandidates = useRef({});
  const localMediaStream = useRef(null);
  const connectionStatsIntervals = useRef({});

  const stopConnectionStats = useCallback((participantId) => {
    const peerKey = String(participantId);
    const intervalId = connectionStatsIntervals.current[peerKey];

    if (intervalId) {
      clearInterval(intervalId);
      delete connectionStatsIntervals.current[peerKey];
    }
  }, []);

  const startConnectionStats = useCallback((participantId, pc) => {
    const peerKey = String(participantId);
    stopConnectionStats(peerKey);

    connectionStatsIntervals.current[peerKey] = setInterval(async () => {
      if (pc.connectionState === "closed") {
        stopConnectionStats(peerKey);
        return;
      }

      try {
        const stats = await pc.getStats();
        const snapshot = {
          inboundAudio: null,
          outboundAudio: null,
          candidatePair: null,
        };

        stats.forEach((report) => {
          if (report.type === "inbound-rtp" && report.kind === "audio") {
            snapshot.inboundAudio = {
              jitter: report.jitter ?? 0,
              packetsLost: report.packetsLost ?? 0,
              packetsReceived: report.packetsReceived ?? 0,
              concealedSamples: report.concealedSamples ?? 0,
            };
          }

          if (report.type === "outbound-rtp" && report.kind === "audio") {
            snapshot.outboundAudio = {
              packetsSent: report.packetsSent ?? 0,
              bytesSent: report.bytesSent ?? 0,
              retransmittedPacketsSent: report.retransmittedPacketsSent ?? 0,
            };
          }

          if (
            report.type === "candidate-pair" &&
            (report.nominated || report.state === "succeeded") &&
            report.currentRoundTripTime !== undefined
          ) {
            snapshot.candidatePair = {
              currentRoundTripTime: report.currentRoundTripTime,
              availableOutgoingBitrate: report.availableOutgoingBitrate,
            };
          }
        });

        const inboundAudio = snapshot.inboundAudio;
        const candidatePair = snapshot.candidatePair;
        const hasPoorInboundAudio =
          inboundAudio &&
          (inboundAudio.jitter > HIGH_JITTER_SECONDS ||
            inboundAudio.packetsLost > HIGH_PACKET_LOSS);
        const hasHighRoundTripTime =
          candidatePair?.currentRoundTripTime > HIGH_ROUND_TRIP_TIME_SECONDS;

        if (hasPoorInboundAudio || hasHighRoundTripTime) {
          console.warn("[VoiceRoom] Poor WebRTC audio stats", {
            participantId,
            ...snapshot,
          });
        } else {
          console.debug("[VoiceRoom] WebRTC audio stats", {
            participantId,
            ...snapshot,
          });
        }
      } catch (err) {
        console.warn("[VoiceRoom] Failed to read WebRTC stats", err);
      }
    }, CONNECTION_STATS_INTERVAL);
  }, [stopConnectionStats]);

  const configureAudioSender = useCallback(async (sender) => {
    if (!sender?.track || sender.track.kind !== "audio") return;

    try {
      const params = sender.getParameters();
      params.encodings = params.encodings?.length ? params.encodings : [{}];
      params.encodings[0].maxBitrate = AUDIO_MAX_BITRATE;

      await sender.setParameters(params);
    } catch (err) {
      console.warn("[VoiceRoom] Failed to configure audio sender", err);
    }
  }, []);

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
        {
          volume: MediaStore.volume,
          audioSettings: MediaStore.getAudioSettings(),
        },
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
  }, [
    MediaStore,
    MediaStore.selectedMicrophone,
    MediaStore.volume,
    setLocalStreamReady,
  ]);

  const switchLocalMicrophone = useCallback(
    async (deviceId) => {
      const previousStream = localMediaStream.current;
      const wasEnabled =
        previousStream?.getAudioTracks?.()[0]?.enabled ?? true;
      const nextStream = await mediaService.getMicrophone(deviceId, {
        volume: MediaStore.volume,
        audioSettings: MediaStore.getAudioSettings(),
      });
      const nextTrack = nextStream.getAudioTracks()[0];

      if (nextTrack) {
        nextTrack.enabled = wasEnabled;
      }

      await Promise.all(
        Object.values(peerConnections.current).map(async (pc) => {
          const sender = pc
            .getSenders()
            .find((item) => item.track?.kind === "audio");

          if (!sender || !nextTrack) return;
          await sender.replaceTrack(nextTrack);
          await configureAudioSender(sender);
        }),
      );

      localMediaStream.current = nextStream;

      if (previousStream) {
        mediaService.stopStream(previousStream);
      }

      setLocalStreamReady(true);
      return nextStream;
    },
    [MediaStore, MediaStore.volume, configureAudioSender, setLocalStreamReady],
  );

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
          const sender = pc.addTrack(track, stream);
          configureAudioSender(sender);
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
      startConnectionStats(participantId, pc);
      return pc;
    },
    [configureAudioSender, setParticipants, startConnectionStats, startLocalStream],
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
    stopConnectionStats(peerKey);
  }, [stopConnectionStats]);

  // Закрыть все соединения и остановить поток
  const cleanup = useCallback(() => {
    Object.values(peerConnections.current).forEach((pc) => pc.close());
    peerConnections.current = {};
    pendingIceCandidates.current = {};
    Object.values(connectionStatsIntervals.current).forEach(clearInterval);
    connectionStatsIntervals.current = {};

    if (localMediaStream.current) {
      mediaService.stopStream(localMediaStream.current);
      localMediaStream.current = null;
    }

    setLocalStreamReady(false);
  }, [setLocalStreamReady]);

  return {
    peerConnections,       // ref — пробрасываем наружу для useVoiceRoom
    localMediaStream,      // ref — пробрасываем наружу для useVoiceRoom
    startLocalStream,
    switchLocalMicrophone,
    createPeerConnection,
    closePeerConnection,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    cleanup,
  };
};

export default useWebRTC;
