import {
  AudioPresets,
  ConnectionQuality,
  Room,
  RoomEvent,
  ScreenSharePresets,
  Track,
  VideoPresets,
} from "livekit-client";
import {
  DEFAULT_SCREEN_SHARE_QUALITY,
  getScreenShareQuality,
} from "../constants/screenShareQuality";

// LiveKit can briefly remove a participant from ActiveSpeakersChanged between
// words. Keep the indicator active through natural speech pauses while still
// showing the start of speech immediately.
const SPEAKING_RELEASE_DELAY = 300;
const DIAGNOSTIC_STORAGE_KEY = "pepechat:livekit-diagnostics";
const DIAGNOSTIC_BUFFER_LIMIT = 200;
const DIAGNOSTIC_MEDIA_INTERVAL = 5_000;

const diagnosticsEnabled = () => {
  if (import.meta.env.VITE_LIVEKIT_DIAGNOSTICS === "true") return true;
  try {
    return localStorage.getItem(DIAGNOSTIC_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

const diagnosticLog = (event, details = {}) => {
  if (!diagnosticsEnabled()) return;
  const record = {
    timestamp: new Date().toISOString(),
    event,
    ...details,
  };
  const buffer = window.__PEPECHAT_LIVEKIT_DIAGNOSTICS__ ?? [];
  buffer.push(record);
  if (buffer.length > DIAGNOSTIC_BUFFER_LIMIT) buffer.shift();
  window.__PEPECHAT_LIVEKIT_DIAGNOSTICS__ = buffer;
  console.info("[LiveKit diagnostics]", record);
};

export const recordLiveKitDiagnostic = diagnosticLog;

const candidateDetails = (candidate) =>
  candidate
    ? {
        type: candidate.candidateType,
        protocol: candidate.protocol,
        relayProtocol: candidate.relayProtocol,
        address: candidate.address ?? candidate.ip,
        port: candidate.port,
        url: candidate.url,
      }
    : null;

const transportSnapshot = async (transport, name) => {
  if (!transport) return { name, available: false };

  const stats = await transport.getStats();
  let selectedPairId;
  const pairs = new Map();
  const candidates = new Map();
  stats.forEach((report) => {
    if (report.type === "transport" && report.selectedCandidatePairId) {
      selectedPairId = report.selectedCandidatePairId;
    } else if (report.type === "candidate-pair") {
      pairs.set(report.id, report);
      if (!selectedPairId && (report.nominated || report.selected)) {
        selectedPairId = report.id;
      }
    } else if (
      report.type === "local-candidate" ||
      report.type === "remote-candidate"
    ) {
      candidates.set(report.id, report);
    }
  });

  const pair = pairs.get(selectedPairId);
  return {
    name,
    available: true,
    connectionState: transport.getConnectionState(),
    iceConnectionState: transport.getICEConnectionState(),
    signalingState: transport.getSignallingState(),
    selectedPair: pair
      ? {
          state: pair.state,
          nominated: pair.nominated,
          currentRoundTripTime: pair.currentRoundTripTime,
          bytesSent: pair.bytesSent,
          bytesReceived: pair.bytesReceived,
          local: candidateDetails(candidates.get(pair.localCandidateId)),
          remote: candidateDetails(candidates.get(pair.remoteCandidateId)),
        }
      : null,
  };
};

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
      adaptiveStream: { pixelDensity: "screen" },
      dynacast: true,
      disconnectOnPageLeave: true,
      videoCaptureDefaults: {
        resolution: VideoPresets.h720.resolution,
      },
      publishDefaults: {
        audioPreset: AudioPresets.music,
        forceStereo: false,
        simulcast: true,
        videoSimulcastLayers: [VideoPresets.h180, VideoPresets.h360],
      },
    });
    this.microphoneStream = null;
    this.microphoneUpdateQueue = Promise.resolve();
    this.activeSpeakerIdentities = new Set();
    this.speakerReleaseTimers = new Map();
    this.diagnosticMediaTimer = null;
    this.diagnosticStatsHistory = new Map();
    this.diagnosticStatsInProgress = false;
    this.bindEvents();
    this.bindDiagnostics();
  }

  bindDiagnostics() {
    if (!diagnosticsEnabled()) return;

    this.room
      .on(RoomEvent.SignalConnected, () => {
        diagnosticLog("signal-connected");
        const manager = this.room.engine?.pcManager;
        [manager?.publisher, manager?.subscriber].forEach((transport) => {
          if (!transport) return;
          transport.onIceCandidateError = (error) => {
            diagnosticLog("ice-candidate-error", {
              errorCode: error.errorCode,
              errorText: error.errorText,
              address: error.address,
              port: error.port,
              url: error.url,
            });
          };
        });
      })
      .on(RoomEvent.ConnectionStateChanged, (state) => {
        diagnosticLog("connection-state", { state });
        this.logDiagnostics(`connection-state:${state}`);
      })
      .on(RoomEvent.TrackSubscriptionFailed, (trackSid, participant) => {
        diagnosticLog("track-subscription-failed", {
          trackSid,
          participantIdentity: participant?.identity,
        });
      });
  }

  async logDiagnostics(reason) {
    if (!diagnosticsEnabled()) return;
    try {
      const manager = this.room.engine?.pcManager;
      const transports = await Promise.all([
        transportSnapshot(manager?.publisher, "publisher"),
        transportSnapshot(manager?.subscriber, "subscriber"),
      ]);
      const media = await this.mediaStatsSnapshot();
      diagnosticLog("transport-snapshot", {
        reason,
        roomState: this.room.state,
        transports,
        media,
      });
    } catch (error) {
      diagnosticLog("transport-snapshot-error", {
        reason,
        message: error?.message ?? String(error),
      });
    }
  }

  mediaRate(key, stats, counterName) {
    const current = {
      bytes: stats[counterName] ?? 0,
      frames: stats.framesDecoded ?? stats.framesSent ?? 0,
      timestamp: stats.timestamp,
    };
    const previous = this.diagnosticStatsHistory.get(key);
    this.diagnosticStatsHistory.set(key, current);
    const elapsedMs = current.timestamp - (previous?.timestamp ?? current.timestamp);
    if (!previous || elapsedMs <= 0) return {};
    return {
      bitrate: Math.max(
        0,
        Math.round(((current.bytes - previous.bytes) * 8 * 1000) / elapsedMs),
      ),
      measuredFps: Math.max(
        0,
        Math.round(((current.frames - previous.frames) * 1000) / elapsedMs),
      ),
    };
  }

  async mediaStatsSnapshot() {
    if (!diagnosticsEnabled() || this.diagnosticStatsInProgress) return [];
    this.diagnosticStatsInProgress = true;
    try {
      const samples = [];
      const collect = async (participant, direction) => {
        for (const publication of participant.videoTrackPublications.values()) {
          if (
            publication.source !== Track.Source.ScreenShare &&
            publication.source !== Track.Source.Camera
          ) {
            continue;
          }
          const track = publication.track;
          if (!track) continue;

          if (direction === "send" && track.getSenderStats) {
            const trackStats = await track.getSenderStats();
            trackStats.forEach((stats) => {
              const key = `${direction}:${participant.identity}:${publication.trackSid}:${stats.rid}`;
              samples.push({
                direction,
                participantIdentity: participant.identity,
                source: publication.source,
                layer: stats.rid,
                width: stats.frameWidth,
                height: stats.frameHeight,
                fps: stats.framesPerSecond,
                targetBitrate: stats.targetBitrate,
                packetsLost: stats.packetsLost,
                rtt: stats.roundTripTime,
                nack: stats.nackCount,
                pli: stats.pliCount,
                qualityLimitation: stats.qualityLimitationReason,
                ...this.mediaRate(key, stats, "bytesSent"),
              });
            });
          } else if (direction === "receive" && track.getReceiverStats) {
            const stats = await track.getReceiverStats();
            if (!stats) continue;
            const key = `${direction}:${participant.identity}:${publication.trackSid}:${stats.streamId}`;
            samples.push({
              direction,
              participantIdentity: participant.identity,
              source: publication.source,
              width: stats.frameWidth,
              height: stats.frameHeight,
              packetsLost: stats.packetsLost,
              jitter: stats.jitter,
              framesDropped: stats.framesDropped,
              decoder: stats.decoderImplementation,
              codec: stats.mimeType,
              nack: stats.nackCount,
              pli: stats.pliCount,
              ...this.mediaRate(key, stats, "bytesReceived"),
            });
          }
        }
      };

      await collect(this.room.localParticipant, "send");
      for (const participant of this.room.remoteParticipants.values()) {
        await collect(participant, "receive");
      }
      return samples;
    } finally {
      this.diagnosticStatsInProgress = false;
    }
  }

  startDiagnosticMonitor() {
    if (!diagnosticsEnabled() || this.diagnosticMediaTimer) return;
    this.diagnosticMediaTimer = window.setInterval(() => {
      void this.logDiagnostics("periodic-media");
    }, DIAGNOSTIC_MEDIA_INTERVAL);
  }

  stopDiagnosticMonitor() {
    if (this.diagnosticMediaTimer) {
      window.clearInterval(this.diagnosticMediaTimer);
      this.diagnosticMediaTimer = null;
    }
    this.diagnosticStatsHistory.clear();
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
      .on(RoomEvent.LocalTrackPublished, (publication) => {
        changed(this.room.localParticipant);
        if (publication.source === Track.Source.ScreenShare) {
          this.callbacks.onLocalScreenShareChanged?.(true);
        }
      })
      .on(RoomEvent.LocalTrackUnpublished, (publication) => {
        this.emitParticipant(this.room.localParticipant, publication.source);
        if (publication.source === Track.Source.ScreenShare) {
          this.callbacks.onLocalScreenShareChanged?.(false);
        }
      })
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
      .on(RoomEvent.ConnectionQualityChanged, (_quality, participant) =>
        changed(participant),
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
      hasNetworkIssues:
        owner.connectionQuality === ConnectionQuality.Poor ||
        owner.connectionQuality === ConnectionQuality.Lost,
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
    diagnosticLog("connect-start", { url });
    try {
      await this.room.connect(url, token, { autoSubscribe: true });
    } catch (error) {
      diagnosticLog("connect-failed", {
        name: error?.name,
        message: error?.message ?? String(error),
      });
      await this.logDiagnostics("connect-failed");
      throw error;
    }
    await this.logDiagnostics("connected");
    this.startDiagnosticMonitor();
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
            audioPreset: AudioPresets.music,
            forceStereo: false,
          });
        }

        this.microphoneStream = stream;
        if (previousStream && previousStream !== stream) {
          this.cleanupMicrophoneStream(previousStream);
        }
        this.emitParticipant(this.room.localParticipant);
        await this.logDiagnostics("microphone-published");
      } catch (error) {
        diagnosticLog("microphone-publication-failed", {
          name: error?.name,
          message: error?.message ?? String(error),
        });
        await this.logDiagnostics("microphone-publication-failed");
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

  updateMicrophoneSettings(settings, changedKeys) {
    return Boolean(
      this.microphoneStream?.__updateAudioSettings?.(settings, changedKeys),
    );
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

  async setScreenShareEnabled(
    enabled,
    {
      withAudio = false,
      qualityId = DEFAULT_SCREEN_SHARE_QUALITY,
    } = {},
  ) {
    if (!enabled) {
      await this.room.localParticipant.setScreenShareEnabled(false);
      return { active: false, audioAvailable: false };
    }

    const quality = getScreenShareQuality(qualityId);
    const lowLayer =
      quality.id === "economy"
        ? ScreenSharePresets.h360fps15
        : ScreenSharePresets.h720fps15;
    const publication = await this.room.localParticipant.setScreenShareEnabled(
      true,
      {
        audio: withAudio,
        systemAudio: withAudio ? "include" : "exclude",
        resolution: {
          width: quality.width,
          height: quality.height,
          frameRate: quality.frameRate,
        },
        contentHint: quality.contentHint,
      },
      {
        simulcast: true,
        videoCodec: "vp8",
        degradationPreference: "maintain-resolution",
        screenShareEncoding: {
          maxBitrate: quality.maxBitrate,
          maxFramerate: quality.frameRate,
          priority: "high",
        },
        screenShareSimulcastLayers: [lowLayer],
      },
    );
    const audioPublication = this.room.localParticipant.getTrackPublication(
      Track.Source.ScreenShareAudio,
    );
    diagnosticLog("screen-share-started", {
      quality: quality.id,
      width: quality.width,
      height: quality.height,
      frameRate: quality.frameRate,
      maxBitrate: quality.maxBitrate,
      audioRequested: withAudio,
      audioAvailable: Boolean(audioPublication?.track),
    });
    return {
      active: Boolean(publication),
      audioAvailable: Boolean(audioPublication?.track),
    };
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
    this.stopDiagnosticMonitor();
    this.clearActiveSpeakers();
    this.stopMicrophoneStream();
    await this.room.disconnect();
  }
}
