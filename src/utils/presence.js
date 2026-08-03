export const getPresencePatch = ({ status, last_seen: lastSeen }) => ({
  status,
  ...(lastSeen != null ? { last_online: lastSeen } : {}),
});
