import React, {
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import cls from "./Room.module.css";
import RoomUser from "./RoomUser";
import { useVoiceRoom } from "../../hooks/useVoiceRoom";
import ContextMenu from "../UI/ContextMenu";
import { Context } from "../../main";
import Spinner from "../UI/Spiner";
import RoomActivityPanel from "./RoomActivityPanel";
import ScreenSharePickerModal from "./ScreenSharePickerModal";
import {
  isDesktopApp,
  screenShareService,
} from "../../services/ScreenShareService";
import { notifyInfo } from "../../notifications/notificationService";

const DEFAULT_USER_VOLUME = 1;
const DEFAULT_STREAM_VOLUME = 1;
const VOLUME_STEP = 5;

const getRoomGridClass = (participantsCount) => {
  if (participantsCount <= 1) return cls.room_users_list_single;
  if (participantsCount === 2) return cls.room_users_list_duo;
  if (participantsCount <= 4) return cls.room_users_list_grid_2;
  if (participantsCount <= 9) return cls.room_users_list_grid_3;
  if (participantsCount <= 16) return cls.room_users_list_grid_4;

  return cls.room_users_list_dense;
};

const Room = forwardRef(function Room(
  {
    onLeaveRoom,
    onHide,
    chatId,
    isOpen = true,
    preserveChatDescription = false,
    onControlsChange,
    onConnectionStateChange,
  },
  ref,
) {
  const { AuthStore, ChatStore } = useContext(Context);
  const {
    participants,
    isJoining,
    latencyMs,
    screenShareActive,
    setMicEnabled,
    setHeadphonesMuted: setRemoteHeadphonesMuted,
    setCameraEnabled,
    startScreenShare,
    stopScreenShare,
    disconnect,
  } = useVoiceRoom(chatId);
  const [micMuted, setMicMuted] = useState(false);
  const [headphonesMuted, setHeadphonesMuted] = useState(false);
  const [cameraEnabled, setCameraEnabledState] = useState(false);
  const [screenShareEnabled, setScreenShareEnabledState] = useState(false);
  const [screenPickerOpen, setScreenPickerOpen] = useState(false);
  const [participantVolumes, setParticipantVolumes] = useState({});
  const [participantStreamVolumes, setParticipantStreamVolumes] = useState({});
  const [mutedParticipantIds, setMutedParticipantIds] = useState(
    () => new Set(),
  );
  const [contextMenu, setContextMenu] = useState(null);
  const [isRoomHovered, setIsRoomHovered] = useState(false);
  const [focusedParticipantId, setFocusedParticipantId] = useState(null);
  const micMutedBeforeHeadphonesRef = useRef(false);
  const showRoomUi = isJoining || isRoomHovered || Boolean(contextMenu);
  const displayedParticipants = useMemo(() => {
    const next = [...participants];
    if (focusedParticipantId == null) return next;

    return next.sort((left, right) => {
      const leftFocused = String(left.id) === String(focusedParticipantId);
      const rightFocused = String(right.id) === String(focusedParticipantId);
      return Number(rightFocused) - Number(leftFocused);
    });
  }, [focusedParticipantId, participants]);
  const hasFocusedParticipant = displayedParticipants.some(
    (participant) =>
      String(participant.id) === String(focusedParticipantId),
  );
  const roomGridClass = getRoomGridClass(displayedParticipants.length);

  const selectedParticipant = useMemo(
    () =>
      displayedParticipants.find(
        (participant) =>
          String(participant.id) === String(contextMenu?.participantId),
      ),
    [contextMenu?.participantId, displayedParticipants],
  );

  const isCurrentUserParticipant = (participant) =>
    String(participant.user?.id) === String(AuthStore.user?.id);

  const getParticipantVolume = (participantId) =>
    participantVolumes[participantId] ?? DEFAULT_USER_VOLUME;

  const setParticipantVolume = (participantId, value) => {
    const nextVolume = Math.max(0, Math.min(1, Number(value) / 100));

    setParticipantVolumes((prev) => ({
      ...prev,
      [participantId]: nextVolume,
    }));
  };

  const toggleParticipantMute = (participantId) => {
    setMutedParticipantIds((prev) => {
      const next = new Set(prev);

      if (next.has(participantId)) {
        next.delete(participantId);
      } else {
        next.add(participantId);
      }

      return next;
    });
  };

  const openParticipantContextMenu = (event, participant) => {
    event.preventDefault();
    event.stopPropagation();

    if (isCurrentUserParticipant(participant)) {
      closeContextMenu();
      return;
    }

    setContextMenu({
      participantId: participant.id,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleRoomContextMenu = (event) => {
    event.preventDefault();
    closeContextMenu();
  };

  const contextMenuItems = useMemo(() => {
    if (!selectedParticipant) return [];

    const participantId = selectedParticipant.id;
    const isMuted = mutedParticipantIds.has(participantId);
    const volume = getParticipantVolume(participantId);
    const streamVolume = getParticipantStreamVolume(participantId);
    const hasActiveStream = Boolean(
      selectedParticipant.media?.screen?.track &&
        !selectedParticipant.media.screen.publication?.isMuted,
    );

    return [
      {
        id: "mute",
        label: isMuted ? "Размутить" : "Замутить",
        onSelect: () => toggleParticipantMute(participantId),
      },
      {
        id: "message",
        label: "Написать сообщение",
        onSelect: () => ChatStore.openPrivateChat(selectedParticipant.user),
      },
      { id: "volume-separator", type: "separator" },
      {
        id: "volume",
        type: "slider",
        label: "Громкость пользователя",
        min: 0,
        max: 100,
        step: VOLUME_STEP,
        value: Math.round(volume * 100),
        valueLabel: `${Math.round(volume * 100)}%`,
        onChange: (value) => setParticipantVolume(participantId, value),
      },
      ...(hasActiveStream
        ? [
            {
              id: "stream-volume",
              type: "slider",
              label: "Громкость стрима",
              min: 0,
              max: 100,
              step: VOLUME_STEP,
              value: Math.round(streamVolume * 100),
              valueLabel: `${Math.round(streamVolume * 100)}%`,
              onChange: (value) =>
                setParticipantStreamVolume(participantId, value),
            },
          ]
        : []),
    ];
  }, [
    ChatStore,
    mutedParticipantIds,
    participantStreamVolumes,
    participantVolumes,
    selectedParticipant,
  ]);

  const leaveRoom = () => {
    disconnect();
    onLeaveRoom();
  };

  const toggleMic = () => {
    if (headphonesMuted) {
      setMicMuted(true);
      setMicEnabled(false);
      return;
    }

    const next = !micMuted;
    setMicMuted(next);
    setMicEnabled(!next); // micMuted=true -> enabled=false
  };

  const toggleHeadphones = () => {
    const next = !headphonesMuted;
    setHeadphonesMuted(next);

    if (next) {
      micMutedBeforeHeadphonesRef.current = micMuted;
      setMicMuted(true);
      setMicEnabled(false);
      setRemoteHeadphonesMuted(true);
    } else {
      const restoreMicMuted = micMutedBeforeHeadphonesRef.current;
      setMicMuted(restoreMicMuted);
      setRemoteHeadphonesMuted(false);
      setMicEnabled(!restoreMicMuted);
    }
  };

  const toggleCamera = async () => {
    const next = !cameraEnabled;
    try {
      await setCameraEnabled(next);
      setCameraEnabledState(next);
    } catch (error) {
      console.warn("[VoiceRoom] Cannot toggle camera", error);
    }
  };

  const toggleScreenShare = async () => {
    if (!screenShareEnabled) {
      setScreenPickerOpen(true);
      return;
    }
    try {
      await stopScreenShare();
      setScreenShareEnabledState(false);
    } catch (error) {
      console.warn("[VoiceRoom] Cannot toggle screen share", error);
      setScreenShareEnabledState(false);
    }
  };

  const getParticipantStreamVolume = (participantId) =>
    participantStreamVolumes[participantId] ?? DEFAULT_STREAM_VOLUME;

  const setParticipantStreamVolume = (participantId, value) => {
    const nextVolume = Math.max(0, Math.min(1, Number(value) / 100));
    setParticipantStreamVolumes((prev) => ({
      ...prev,
      [participantId]: nextVolume,
    }));
  };

  const shareSelectedSource = async (source, withAudio, qualityId) => {
    const state = await startScreenShare(source?.id, withAudio, qualityId);
    setScreenShareEnabledState(Boolean(state?.active ?? true));
    if (withAudio && state?.audioAvailable === false) {
      notifyInfo("Системный звук недоступен. Трансляция продолжена без звука.");
    }
  };

  useEffect(() => {
    if (!isDesktopApp()) return undefined;
    let unlistenStopped;
    let unlistenError;
    screenShareService.onStopped(() => setScreenShareEnabledState(false)).then(
      (unlisten) => { unlistenStopped = unlisten; },
    );
    screenShareService.onError((event) => {
      console.warn("[VoiceRoom] Native screen share stopped", event.payload);
      setScreenShareEnabledState(false);
      screenShareService.stop().catch(() => {});
    }).then((unlisten) => { unlistenError = unlisten; });
    return () => {
      unlistenStopped?.();
      unlistenError?.();
    };
  }, []);

  useEffect(() => {
    if (!isDesktopApp()) setScreenShareEnabledState(screenShareActive);
  }, [screenShareActive]);

  useEffect(() => {
    onControlsChange?.({
      micMuted,
      headphonesMuted,
      cameraEnabled,
      screenShareEnabled,
    });
  }, [
    cameraEnabled,
    headphonesMuted,
    micMuted,
    onControlsChange,
    screenShareEnabled,
  ]);

  useEffect(() => {
    onConnectionStateChange?.({ isJoining, latencyMs });
  }, [isJoining, latencyMs, onConnectionStateChange]);

  useImperativeHandle(ref, () => ({
    leave: leaveRoom,
    toggleMic,
    toggleHeadphones,
    toggleCamera,
    toggleScreenShare,
  }));

  return (
    <div
      className={`${cls.room} ${
        preserveChatDescription ? cls.room_preserve_description : ""
      } ${isOpen ? "" : cls.room_hidden}`}
      onContextMenu={handleRoomContextMenu}
      onMouseEnter={() => setIsRoomHovered(true)}
      onMouseLeave={() => setIsRoomHovered(false)}
      onFocus={() => setIsRoomHovered(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsRoomHovered(false);
        }
      }}
    >
      <button
        className={`${cls.hide_btn} ${showRoomUi ? cls.hide_btn_visible : ""}`}
        type="button"
        onClick={onHide}
        title="Свернуть голосовую комнату"
      >
        <img src="/arrow.svg" />
      </button>

      <div className={cls.room_header}>
        <p></p>
      </div>

      <div
        className={`${cls.room_users_list} ${
          hasFocusedParticipant ? cls.room_users_list_focused : roomGridClass
        }`}
      >
        {displayedParticipants.map((participant) => (
          <RoomUser
            key={participant.id}
            participant={participant}
            soundMuted={headphonesMuted}
            userMuted={mutedParticipantIds.has(participant.id)}
            volume={getParticipantVolume(participant.id)}
            streamVolume={getParticipantStreamVolume(participant.id)}
            showDetails={showRoomUi}
            isFocused={
              String(participant.id) === String(focusedParticipantId)
            }
            isCompact={
              hasFocusedParticipant &&
              String(participant.id) !== String(focusedParticipantId)
            }
            onSelect={() =>
              setFocusedParticipantId((current) =>
                String(current) === String(participant.id)
                  ? null
                  : participant.id,
              )
            }
            onContextMenu={(event) =>
              openParticipantContextMenu(event, participant)
            }
          />
        ))}
      </div>

      {isJoining && (
        <div className={cls.room_loader} role="status" aria-label="Подключение">
          <Spinner />
        </div>
      )}

      <ContextMenu
        isOpen={Boolean(contextMenu && selectedParticipant)}
        x={contextMenu?.x}
        y={contextMenu?.y}
        items={contextMenuItems}
        onClose={closeContextMenu}
      />

      <RoomActivityPanel
        visible={showRoomUi}
        micMuted={micMuted}
        headphonesMuted={headphonesMuted}
        cameraEnabled={cameraEnabled}
        screenShareEnabled={screenShareEnabled}
        onToggleHeadphones={toggleHeadphones}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onToggleScreenShare={toggleScreenShare}
        onLeave={leaveRoom}
      />

      <ScreenSharePickerModal
        isOpen={screenPickerOpen}
        onClose={() => setScreenPickerOpen(false)}
        onShare={shareSelectedSource}
      />
    </div>
  );
});

export default Room;
