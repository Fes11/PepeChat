const identityOf = (participant) => String(participant.user?.id);

const withMedia = (participant, mediaParticipant) => ({
  ...participant,
  media: mediaParticipant.media,
  isLocalMedia: mediaParticipant.isLocal,
  stream: mediaParticipant.media.audio?.stream ?? null,
  state: {
    ...participant.state,
    muted: Boolean(mediaParticipant.media.audio?.publication?.isMuted),
    networkIssue: Boolean(mediaParticipant.hasNetworkIssues),
  },
});

export const mergeMediaParticipant = (
  participants,
  directory,
  mediaParticipant,
) => {
  const identity = String(mediaParticipant.identity);
  const index = participants.findIndex(
    (participant) => identityOf(participant) === identity,
  );
  const participant =
    index >= 0 ? participants[index] : directory.get(identity);

  // A LiveKit event can arrive before the control-plane room_state. Once the
  // directory arrives, refreshParticipants() replays the current media state.
  if (!participant) return participants;

  const merged = withMedia(participant, mediaParticipant);
  if (index < 0) return [...participants, merged];

  const next = [...participants];
  next[index] = merged;
  return next;
};

export const clearMediaParticipant = (participants, identity) => {
  const normalizedIdentity = String(identity);

  return participants.map((participant) =>
    identityOf(participant) === normalizedIdentity
      ? {
          ...participant,
          media: null,
          isLocalMedia: false,
          stream: null,
          state: { ...participant.state, speaking: false },
        }
      : participant,
  );
};

export const replaceRoomParticipants = (participants, roomParticipants) =>
  roomParticipants.map((participant) => {
    const existing = participants.find(
      (entry) => identityOf(entry) === identityOf(participant),
    );
    if (!existing) return participant;

    return {
      ...participant,
      media: existing.media,
      isLocalMedia: existing.isLocalMedia,
      stream: existing.stream,
      state: { ...participant.state, ...existing.state },
    };
  });

export const setParticipantNetworkIssue = (
  participants,
  identity,
  networkIssue,
) => {
  const normalizedIdentity = String(identity);

  return participants.map((participant) =>
    identityOf(participant) === normalizedIdentity
      ? {
          ...participant,
          state: { ...participant.state, networkIssue: Boolean(networkIssue) },
        }
      : participant,
  );
};
