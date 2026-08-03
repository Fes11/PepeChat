import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_NOISE_FLOOR,
  calculateRms,
  createSoftLimiterCurve,
  getAdaptiveGateThresholds,
  updateNoiseFloor,
} from "./audioProcessingUtils.js";
import {
  DEFAULT_MICROPHONE_SETTINGS,
  isHotAudioSettingsChange,
} from "../constants/audioSettings.js";

test("microphone defaults enable RNNoise with sensitivity 40", () => {
  assert.deepEqual(DEFAULT_MICROPHONE_SETTINGS, {
    volume: 1,
    autoGainControl: false,
    noiseSuppressionMode: "strong",
    noiseGateEnabled: true,
    noiseGateThreshold: 0.04,
  });
});

test("only graph parameters are treated as hot audio settings", () => {
  assert.equal(
    isHotAudioSettingsChange(["volume", "noiseGateThreshold"]),
    true,
  );
  assert.equal(isHotAudioSettingsChange(["noiseSuppressionMode"]), false);
  assert.equal(isHotAudioSettingsChange([]), false);
});

test("higher gate sensitivity opens for quieter speech", () => {
  const lowSensitivity = getAdaptiveGateThresholds(0.002, 0.005);
  const highSensitivity = getAdaptiveGateThresholds(0.002, 0.08);

  assert.ok(highSensitivity.open < lowSensitivity.open);
  assert.ok(highSensitivity.close < highSensitivity.open);
});

test("default gate keeps quiet close-microphone speech", () => {
  const thresholds = getAdaptiveGateThresholds(
    DEFAULT_NOISE_FLOOR,
    DEFAULT_MICROPHONE_SETTINGS.noiseGateThreshold,
  );

  assert.ok(thresholds.open <= 0.0055);
  assert.ok(thresholds.close < thresholds.open);
});

test("noise floor does not learn a louder open-gate signal as noise", () => {
  assert.equal(updateNoiseFloor(0.004, 0.02, true), 0.004);
  assert.ok(updateNoiseFloor(0.004, 0.002, true) < 0.004);
  assert.ok(updateNoiseFloor(DEFAULT_NOISE_FLOOR, 0.01, false) > DEFAULT_NOISE_FLOOR);
});

test("RMS and soft limiter curve remain bounded", () => {
  assert.equal(calculateRms(new Float32Array([1, -1, 1, -1])), 1);

  const curve = createSoftLimiterCurve(512);
  assert.equal(curve.length, 512);
  assert.ok(curve[0] >= -1);
  assert.ok(curve.at(-1) <= 1);
  for (let index = 1; index < curve.length; index += 1) {
    assert.ok(curve[index] >= curve[index - 1]);
  }
});
