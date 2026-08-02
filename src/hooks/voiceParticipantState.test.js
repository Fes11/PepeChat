import test from "node:test";
import assert from "node:assert/strict";

import {
  clearMediaParticipant,
  mergeMediaParticipant,
  replaceRoomParticipants,
  setParticipantNetworkIssue,
} from "./voiceParticipantState.js";

const participant = (id) => ({ id: id * 10, user: { id, login: `user-${id}` } });
const media = (identity, stream = {}) => ({
  identity: String(identity),
  isLocal: false,
  media: {
    audio: {
      stream,
      publication: { isMuted: false },
    },
  },
});

test("a LiveKit full reconnect does not permanently remove remote users", () => {
  const first = participant(1);
  const second = participant(2);
  const directory = new Map([
    ["1", first],
    ["2", second],
  ]);
  const initialStream = {};
  const restoredStream = {};

  let state = mergeMediaParticipant(
    [first, second],
    directory,
    media(2, initialStream),
  );
  state = clearMediaParticipant(state, 2);

  assert.equal(state.length, 2);
  assert.equal(state[1].stream, null);

  state = mergeMediaParticipant(state, directory, media(2, restoredStream));

  assert.equal(state.length, 2);
  assert.equal(state[1].stream, restoredStream);
});

test("ParticipantConnected upserts a directory entry removed by stale state", () => {
  const second = participant(2);
  const stream = {};
  const state = mergeMediaParticipant(
    [],
    new Map([["2", second]]),
    media(2, stream),
  );

  assert.equal(state.length, 1);
  assert.equal(state[0].id, second.id);
  assert.equal(state[0].stream, stream);
});

test("authoritative room_state preserves media for users still in the room", () => {
  const oldParticipant = {
    ...participant(2),
    stream: {},
    media: { audio: {} },
    state: { speaking: true },
  };
  const refreshedParticipant = {
    ...participant(2),
    user: { id: 2, login: "updated" },
  };

  const state = replaceRoomParticipants(
    [oldParticipant],
    [refreshedParticipant],
  );

  assert.equal(state[0].user.login, "updated");
  assert.equal(state[0].stream, oldParticipant.stream);
  assert.equal(state[0].state.speaking, true);
});

test("network issue state follows LiveKit quality and local reconnects", () => {
  const second = participant(2);
  const directory = new Map([["2", second]]);
  let state = mergeMediaParticipant(
    [second],
    directory,
    { ...media(2), hasNetworkIssues: true },
  );

  assert.equal(state[0].state.networkIssue, true);

  state = setParticipantNetworkIssue(state, 2, false);

  assert.equal(state[0].state.networkIssue, false);
});
