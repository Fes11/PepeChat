import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_SCREEN_SHARE_QUALITY,
  getScreenShareQuality,
  normalizeScreenShareQuality,
  SCREEN_SHARE_QUALITY_OPTIONS,
} from "./screenShareQuality.js";

test("screen share quality ids are unique and contain valid media limits", () => {
  assert.equal(
    new Set(SCREEN_SHARE_QUALITY_OPTIONS.map(({ id }) => id)).size,
    SCREEN_SHARE_QUALITY_OPTIONS.length,
  );

  SCREEN_SHARE_QUALITY_OPTIONS.forEach((profile) => {
    assert.ok(profile.width >= 1280);
    assert.ok(profile.height >= 720);
    assert.ok(profile.frameRate > 0 && profile.frameRate <= 60);
    assert.ok(profile.maxBitrate >= 1_000_000);
    assert.ok(["detail", "motion"].includes(profile.contentHint));
  });
});

test("unknown screen share quality falls back to standard", () => {
  assert.equal(normalizeScreenShareQuality("unknown"), DEFAULT_SCREEN_SHARE_QUALITY);
  assert.equal(getScreenShareQuality(null).id, DEFAULT_SCREEN_SHARE_QUALITY);
});
