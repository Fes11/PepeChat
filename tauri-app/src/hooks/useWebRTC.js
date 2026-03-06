import React, { useState, useRef } from "react";

const useWebRTC = () => {
  const [clients, setClient] = useState([]);

  const peerConnections = useRef({});
  const localMediaStream = useRef(null);

  const startLocalStream = async () => {
    localMediaStream.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
  };

  const createPeerConnection = (userId, sendSignal) => {
    if (!localMediaStream.current) {
      throw new Error("Local media stream not initialized yet");
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Добавляем локальный аудио поток
    localMediaStream.current.getTracks().forEach((track) => {
      pc.addTrack(track, localMediaStream.current);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: "ice_candidate",
          target: userId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];

      setClient((clients) => {
        if (clients.find((c) => c.id === userId)) return clients;

        return [...clients, { id: userId, stream: remoteStream }];
      });
    };

    peerConnections.current[userId] = pc;

    return pc;
  };

  const handleOffer = async (data, sendSignal) => {
    const { sender, offer } = data;

    const pc = createPeerConnection(sender, sendSignal);

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    sendSignal({
      type: "answer",
      target: sender,
      answer,
    });
  };

  const handleAnswer = async (data) => {
    const { sender, answer } = data;

    const pc = peerConnections.current[sender];
    if (!pc) return;

    // Проверяем, что текущее состояние позволяет setRemoteDescription
    if (pc.signalingState === "have-local-offer") {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } else {
      console.warn(
        `Cannot set remote answer, peerConnection state: ${pc.signalingState}`,
      );
    }
  };

  const handleIceCandidate = async (data) => {
    const { sender, candidate } = data;

    const pc = peerConnections.current[sender];
    if (!pc) return;

    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  };

  // const startVoiceDetection = (onVoiceActivity) => {
  //   if (!localMediaStream.current) return;

  //   const audioContext = new AudioContext();
  //   const source = audioContext.createMediaStreamSource(
  //     localMediaStream.current,
  //   );
  //   const analyser = audioContext.createAnalyser();
  //   analyser.fftSize = 512;
  //   source.connect(analyser);

  //   const dataArray = new Uint8Array(analyser.frequencyBinCount);

  //   const checkVolume = () => {
  //     analyser.getByteFrequencyData(dataArray);
  //     const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
  //     // console.log("Volume: ", volume);

  //     // считаем, что пользователь говорит если volume > threshold
  //     if (volume > 10) {
  //       onVoiceActivity(true);
  //     } else {
  //       onVoiceActivity(false);
  //     }

  //     requestAnimationFrame(checkVolume);
  //   };

  //   checkVolume();
  // };

  return {
    startLocalStream,
    createPeerConnection,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    // startVoiceDetection,
  };
};

export default useWebRTC;
