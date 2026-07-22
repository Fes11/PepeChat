import {
  AudioPresets,
  Room,
  RoomEvent,
  Track,
  VideoPresets,
} from "livekit-client";

const mediaFor = (participant, excludedSource = null) => {
  const getTrack = (source) => {
    if (source === excludedSource) return null;
    const publication = participant.getTrackPublication(source);
    const track = publication?.track;
    if (!publication) return null;
    return {
      publication,
      track: track ?? null,
      stream: track ? new MediaStream([track.mediaStreamTrack]) : null,
    };
  };

  return {
    audio: getTrack(Track.Source.Microphone),
    camera: getTrack(Track.Source.Camera),
    screen: getTrack(Track.Source.ScreenShare),
  };
};

export class LiveKitVoiceTransport {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
      disconnectOnPageLeave: true,
      videoCaptureDefaults: {
        resolution: VideoPresets.h720.resolution,
      },
      publishDefaults: {
        audioPreset: AudioPresets.musicStereo,
        simulcast: true,
        videoSimulcastLayers: [
          VideoPresets.h180,
          VideoPresets.h360,
        ],
      },
    });
    this.microphoneStream = null;
    this.microphoneUpdateQueue = Promise.resolve();
    this.bindEvents();
  }

  bindEvents() {
    const changed = (participant) => this.emitParticipant(participant);
    this.room
      .on(RoomEvent.ParticipantConnected, changed)
      .on(RoomEvent.ParticipantDisconnected, (participant) =>
        this.callbacks.onParticipantLeft?.(participant.identity),
      )
      .on(RoomEvent.TrackSubscribed, (_track, _publication, participant) =>
        changed(participant),
      )
      .on(RoomEvent.TrackPublished, (_publication, participant) =>
        changed(participant),
      )
      .on(RoomEvent.TrackUnpublished, (publication, participant) =>
        this.emitParticipant(participant, publication.source),
      )
      .on(RoomEvent.TrackUnsubscribed, (_track, _publication, participant) =>
        changed(participant),
      )
      .on(RoomEvent.LocalTrackPublished, () =>
        changed(this.room.localParticipant),
      )
      .on(RoomEvent.LocalTrackUnpublished, (publication) =>
        this.emitParticipant(this.room.localParticipant, publication.source),
      )
      .on(RoomEvent.TrackMuted, (_publication, participant) => changed(participant))
      .on(RoomEvent.TrackUnmuted, (_publication, participant) => changed(participant))
      .on(RoomEvent.ActiveSpeakersChanged, (speakers) =>
        this.callbacks.onActiveSpeakers?.(speakers.map((item) => item.identity)),
      )
      .on(RoomEvent.Reconnecting, () => this.callbacks.onReconnecting?.())
      .on(RoomEvent.Reconnected, () => this.callbacks.onReconnected?.())
      .on(RoomEvent.Disconnected, (reason) => this.callbacks.onDisconnected?.(reason));
  }

  emitParticipant(participant, excludedSource = null) {
    this.callbacks.onParticipantChanged?.({
      identity: participant.identity,
      isLocal: participant === this.room.localParticipant,
      isSpeaking: participant.isSpeaking,
      media: mediaFor(participant, excludedSource),
    });
  }

  async connect(url, token) {
    await this.room.connect(url, token, { autoSubscribe: true });
    this.emitParticipant(this.room.localParticipant);
    this.room.remoteParticipants.forEach((participant) => this.emitParticipant(participant));
  }

  refreshParticipants() {
    this.emitParticipant(this.room.localParticipant);
    this.room.remoteParticipants.forEach((participant) => this.emitParticipant(participant));
  }

  async publishMicrophone(stream) {
    const update = async () => {
      const track = stream?.getAudioTracks?.()[0];
      if (!track || track.readyState === "ended") {
        this.cleanupMicrophoneStream(stream);
        return;
      }

      const publication = this.room.localParticipant.getTrackPublication(
        Track.Source.Microphone,
      );
      const previousStream = this.microphoneStream;

      try {
        if (publication?.track) {
          // Keep the same LiveKit publication/RTCRtpSender. Unpublishing during
          // settings changes creates a gap and races with rapid UI updates.
          await publication.track.replaceTrack(track, { userProvidedTrack: true });
        } else {
          await this.room.localParticipant.publishTrack(track, {
            source: Track.Source.Microphone,
            name: "microphone",
            dtx: true,
            red: true,
            audioPreset: AudioPresets.musicStereo,
          });
        }

        this.microphoneStream = stream;
        if (previousStream && previousStream !== stream) {
          this.cleanupMicrophoneStream(previousStream);
        }
        this.emitParticipant(this.room.localParticipant);
      } catch (error) {
        this.cleanupMicrophoneStream(stream);
        throw error;
      }
    };

    const result = this.microphoneUpdateQueue.then(update, update);
    this.microphoneUpdateQueue = result.catch(() => {});
    return result;
  }

  async setMicrophoneEnabled(enabled) {
    const publication = this.room.localParticipant.getTrackPublication(
      Track.Source.Microphone,
    );
    if (!publication) return;
    if (enabled) await publication.unmute();
    else await publication.mute();
  }

  async setCameraEnabled(enabled, deviceId) {
    await this.room.localParticipant.setCameraEnabled(enabled, {
      ...(deviceId ? { deviceId } : {}),
      resolution: VideoPresets.h720.resolution,
    });
  }

  async switchCamera(deviceId) {
    const publication = this.room.localParticipant.getTrackPublication(
      Track.Source.Camera,
    );
    if (!publication || publication.isMuted) return;
    await this.setCameraEnabled(true, deviceId);
  }

  async setScreenShareEnabled(enabled) {
    await this.room.localParticipant.setScreenShareEnabled(enabled, {
      audio: false,
      contentHint: "detail",
    });
  }

  setDeafened(deafened) {
    this.room.remoteParticipants.forEach((participant) => {
      const publication = participant.getTrackPublication(Track.Source.Microphone);
      publication?.setSubscribed(!deafened);
    });
  }

  stopMicrophoneStream() {
    if (!this.microphoneStream) return;
    this.cleanupMicrophoneStream(this.microphoneStream);
    this.microphoneStream = null;
  }

  cleanupMicrophoneStream(stream) {
    if (!stream) return;
    if (stream.__audioCleanup) stream.__audioCleanup();
    else stream.getTracks().forEach((track) => track.stop());
  }

  async disconnect() {
    this.stopMicrophoneStream();
    await this.room.disconnect();
  }
}
