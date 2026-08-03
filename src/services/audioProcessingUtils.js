export const MIN_GATE_SENSITIVITY = 0.005;
export const MAX_GATE_SENSITIVITY = 0.08;
export const DEFAULT_NOISE_FLOOR = 0.0015;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const normalizeGateSensitivity = (value) => {
  const safeValue = Number.isFinite(value) ? value : 0.04;
  return (
    (clamp(safeValue, MIN_GATE_SENSITIVITY, MAX_GATE_SENSITIVITY) -
      MIN_GATE_SENSITIVITY) /
    (MAX_GATE_SENSITIVITY - MIN_GATE_SENSITIVITY)
  );
};

export const getAdaptiveGateThresholds = (noiseFloor, sensitivity) => {
  const normalized = normalizeGateSensitivity(sensitivity);
  // Higher UI sensitivity means that quieter speech can open the gate.
  // Keep the default threshold near -46 dBFS. The previous -42 dBFS floor
  // regularly removed quiet consonants before either VAD could see them.
  const minimumOpenRms = 0.008 - normalized * 0.006;
  const requiredSnrDb = 10 - normalized * 5;
  const noiseMultiplier = 10 ** (requiredSnrDb / 20);
  const open = Math.max(
    minimumOpenRms,
    clamp(noiseFloor, DEFAULT_NOISE_FLOOR, 0.08) * noiseMultiplier,
  );

  return {
    open: Math.min(open, minimumOpenRms * 3),
    close: Math.min(open, minimumOpenRms * 3) * 0.58,
  };
};

export const calculateRms = (samples) => {
  if (!samples?.length) return 0;

  let sum = 0;
  for (let index = 0; index < samples.length; index += 1) {
    sum += samples[index] * samples[index];
  }
  return Math.sqrt(sum / samples.length);
};

export const updateNoiseFloor = (currentNoiseFloor, rms, gateOpen) => {
  const current = clamp(
    Number.isFinite(currentNoiseFloor)
      ? currentNoiseFloor
      : DEFAULT_NOISE_FLOOR,
    DEFAULT_NOISE_FLOOR,
    0.08,
  );
  const sample = clamp(rms, DEFAULT_NOISE_FLOOR, 0.08);

  // Do not learn speech as noise. A lower level is still accepted quickly so
  // the gate can recover when a loud appliance is switched off.
  if (gateOpen && sample >= current) return current;

  const adaptation = sample < current ? 0.18 : 0.015;
  return current + (sample - current) * adaptation;
};

export const createSoftLimiterCurve = (length = 4096) => {
  const safeLength = Math.max(256, Math.floor(length));
  const curve = new Float32Array(safeLength);
  const linearLimit = 0.9;
  const remaining = 1 - linearLimit;
  const normalization = Math.tanh(1);

  for (let index = 0; index < safeLength; index += 1) {
    const input = (index / (safeLength - 1)) * 2 - 1;
    const magnitude = Math.abs(input);
    if (magnitude <= linearLimit) {
      curve[index] = input;
      continue;
    }

    const limited =
      linearLimit +
      remaining *
        (Math.tanh((magnitude - linearLimit) / remaining) / normalization);
    curve[index] = Math.sign(input) * Math.min(1, limited);
  }

  return curve;
};
