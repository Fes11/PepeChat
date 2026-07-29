import {
  AudioPresets,
  Room,
  RoomEvent,
  Track,
  VideoPresets,
} from "livekit-client";

// LiveKit can briefly remove a participant from ActiveSpeakersChanged between
// words. Keep the indicator active through natural speech pauses while still
// showing the start of speech immediately.
const SPEAKING_RELEASE_DELAY = 300;

// LiveKit emits participant updates for unrelated media changes too (for
// example, muting the microphone while screen sharing). Keep one MediaStream
// per underlying track so React does not detach and reattach the same video
// source on every participant update, which briefly reveals the avatar.
const streamsByTrack = new WeakMap();

const streamForTrack = (track) => {
  const mediaStreamTrack = track?.mediaStreamTrack;
  if (!mediaStreamTrack) return null;

  let stream = streamsByTrack.get(mediaStreamTrack);
  if (!stream) {
    stream = new MediaStream([mediaStreamTrack]);
    streamsByTrack.set(mediaStreamTrack, stream);
  }

  return stream;
};

const mediaFor = (participant, excludedSource = null) => {
  const getTrack = (source) => {
    if (source === excludedSource) return null;
    const publication = participant.getTrackPublication(source);
    const track = publication?.track;
    if (!publication) return null;
    return {
      publication,
      track: track ?? null,
      stream: streamForTrack(track),
    };
  };

  return {
    audio: getTrack(Track.Source.Microphone),
    camera: getTrack(Track.Source.Camera),
    screen: getTrack(Track.Source.ScreenShare),
    screenAudio: getTrack(Track.Source.ScreenShareAudio),
  };
};

const participantMetadata = (participant) => {
  try {
    return JSON.parse(participant?.metadata || "{}");
  } catch {
    return {};
  }
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
        videoSimulcastLayers: [VideoPresets.h180, VideoPresets.h360],
      },
    });
    this.microphoneStream = null;
    this.microphoneUpdateQueue = Promise.resolve();
    this.activeSpeakerIdentities = new Set();
    this.speakerReleaseTimers = new Map();
    this.bindEvents();
  }

  emitActiveSpeakers() {
    this.callbacks.onActiveSpeakers?.([...this.activeSpeakerIdentities]);
  }

  updateActiveSpeakers(speakers) {
    const nextIdentities = new Set(
      speakers.map((item) => String(item.identity)),
    );
    let changed = false;

    nextIdentities.forEach((identity) => {
      const releaseTimer = this.speakerReleaseTimers.get(identity);
      if (releaseTimer) {
        clearTimeout(releaseTimer);
        this.speakerReleaseTimers.delete(identity);
      }
      if (!this.activeSpeakerIdentities.has(identity)) {
        this.activeSpeakerIdentities.add(identity);
        changed = true;
      }
    });

    this.activeSpeakerIdentities.forEach((identity) => {
      if (
        nextIdentities.has(identity) ||
        this.speakerReleaseTimers.has(identity)
      ) {
        return;
      }

      const releaseTimer = setTimeout(() => {
        this.speakerReleaseTimers.delete(identity);
        if (this.activeSpeakerIdentities.delete(identity)) {
          this.emitActiveSpeakers();
        }
      }, SPEAKING_RELEASE_DELAY);
      this.speakerReleaseTimers.set(identity, releaseTimer);
    });

    if (changed) this.emitActiveSpeakers();
  }

  removeActiveSpeaker(identity) {
    const normalizedIdentity = String(identity);
    const releaseTimer = this.speakerReleaseTimers.get(normalizedIdentity);
    if (releaseTimer) clearTimeout(releaseTimer);
    this.speakerReleaseTimers.delete(normalizedIdentity);
    if (this.activeSpeakerIdentities.delete(normalizedIdentity)) {
      this.emitActiveSpeakers();
    }
  }

  clearActiveSpeakers() {
    this.speakerReleaseTimers.forEach((timer) => clearTimeout(timer));
    this.speakerReleaseTimers.clear();
    this.activeSpeakerIdentities.clear();
  }

  bindEvents() {
    const changed = (participant) => this.emitParticipant(participant);
    this.room
      .on(RoomEvent.ParticipantConnected, changed)
      .on(RoomEvent.ParticipantDisconnected, (participant) => {
        const metadata = participantMetadata(participant);
        if (metadata.connection_role === "screen") {
          const owner = this.findParticipant(metadata.owner_identity);
          if (owner) this.emitParticipant(owner);
          return;
        }
        this.removeActiveSpeaker(participant.identity);
        this.callbacks.onParticipantLeft?.(participant.identity);
      })
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
      .on(RoomEvent.TrackMuted, (_publication, participant) => {
        this.removeActiveSpeaker(participant.identity);
        changed(participant);
      })
      .on(RoomEvent.TrackUnmuted, (_publication, participant) =>
        changed(participant),
      )
      .on(RoomEvent.ActiveSpeakersChanged, (speakers) =>
        this.updateActiveSpeakers(speakers),
      )
      .on(RoomEvent.Reconnecting, () => this.callbacks.onReconnecting?.())
      .on(RoomEvent.Reconnected, () => this.callbacks.onReconnected?.())
      .on(RoomEvent.Disconnected, (reason) =>
        this.callbacks.onDisconnected?.(reason),
      );
  }

  emitParticipant(participant, excludedSource = null) {
    const metadata = participantMetadata(participant);
    const ownerIdentity =
      metadata.connection_role === "screen"
        ? String(metadata.owner_identity)
        : String(participant.identity);
    const owner = this.findParticipant(ownerIdentity) ?? participant;
    const screenParticipant = this.findScreenParticipant(ownerIdentity);
    const ownerMedia = mediaFor(owner, excludedSource);
    const screenMedia = screenParticipant
      ? mediaFor(screenParticipant, excludedSource)
      : null;
    this.callbacks.onParticipantChanged?.({
      identity: ownerIdentity,
      isLocal: owner === this.room.localParticipant,
      isSpeaking: owner.isSpeaking,
      media: {
        ...ownerMedia,
        screen: screenMedia?.screen ?? ownerMedia.screen,
        screenAudio: screenMedia?.screenAudio ?? ownerMedia.screenAudio,
      },
    });
  }

  findParticipant(identity) {
    if (String(this.room.localParticipant.identity) === String(identity)) {
      return this.room.localParticipant;
    }
    return this.room.remoteParticipants.get(String(identity));
  }

  findScreenParticipant(ownerIdentity) {
    return [...this.room.remoteParticipants.values()].find((participant) => {
      const metadata = participantMetadata(participant);
      return (
        metadata.connection_role === "screen" &&
        String(metadata.owner_identity) === String(ownerIdentity)
      );
    });
  }

  async connect(url, token) {
    await this.room.connect(url, token, { autoSubscribe: true });
    this.emitParticipant(this.room.localParticipant);
    this.room.remoteParticipants.forEach((participant) =>
      this.emitParticipant(participant),
    );
  }

  refreshParticipants() {
    this.emitParticipant(this.room.localParticipant);
    this.room.remoteParticipants.forEach((participant) =>
      this.emitParticipant(participant),
    );
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
          await publication.track.replaceTrack(track, {
            userProvidedTrack: true,
          });
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
      const publication = participant.getTrackPublication(
        Track.Source.Microphone,
      );
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
    this.clearActiveSpeakers();
    this.stopMicrophoneStream();
    await this.room.disconnect();
  }
}
