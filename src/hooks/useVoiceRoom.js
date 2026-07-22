import { useLiveKitVoiceRoom } from "./useLiveKitVoiceRoom";
import { useP2PVoiceRoom } from "./useP2PVoiceRoom";

export const useVoiceRoom =
  import.meta.env.VITE_VOICE_TRANSPORT === "p2p"
    ? useP2PVoiceRoom
    : useLiveKitVoiceRoom;
