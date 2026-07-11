import React, { useContext, useMemo, useRef, useState } from "react";
import cls from "./Room.module.css";
import RoomUser from "./RoomUser";
import { useVoiceRoom } from "../../hooks/useVoiceRoom";
import ContextMenu from "../UI/ContextMenu";
import { Context } from "../../main";
import Spinner from "../UI/Spiner";

const DEFAULT_USER_VOLUME = 1;
const VOLUME_STEP = 5;

const getRoomGridClass = (participantsCount) => {
  if (participantsCount <= 1) return cls.room_users_list_single;
  if (participantsCount === 2) return cls.room_users_list_duo;
  if (participantsCount <= 4) return cls.room_users_list_grid_2;
  if (participantsCount <= 9) return cls.room_users_list_grid_3;
  if (participantsCount <= 16) return cls.room_users_list_grid_4;

  return cls.room_users_list_dense;
};

const Room = function ({
  onLeaveRoom,
  onHide,
  chatId,
  isOpen = true,
  preserveChatDescription = false,
}) {
  const { AuthStore, ChatStore } = useContext(Context);
  const {
    participants,
    isJoining,
    setMicEnabled,
    setHeadphonesMuted: setRemoteHeadphonesMuted,
    disconnect,
  } = useVoiceRoom(chatId);
  const [micMuted, setMicMuted] = useState(false);
  const [headphonesMuted, setHeadphonesMuted] = useState(false);
  const [participantVolumes, setParticipantVolumes] = useState({});
  const [mutedParticipantIds, setMutedParticipantIds] = useState(
    () => new Set(),
  );
  const [contextMenu, setContextMenu] = useState(null);
  const [isRoomHovered, setIsRoomHovered] = useState(false);
  const micMutedBeforeHeadphonesRef = useRef(false);
  const showRoomUi = isJoining || isRoomHovered || Boolean(contextMenu);
  const roomGridClass = getRoomGridClass(participants.length);

  const selectedParticipant = useMemo(
    () =>
      participants.find(
        (participant) =>
          String(participant.id) === String(contextMenu?.participantId),
      ),
    [contextMenu?.participantId, participants],
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
    ];
  }, [ChatStore, mutedParticipantIds, participantVolumes, selectedParticipant]);

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
        className={cls.hide_btn}
        type="button"
        onClick={onHide}
        title="Свернуть голосовую комнату"
      >
        <img src="/arrow.svg" />
      </button>

      <div className={cls.room_header}>
        <p></p>
      </div>

      <div className={`${cls.room_users_list} ${roomGridClass}`}>
        {participants.map((participant) => (
          <RoomUser
            key={participant.id}
            participant={participant}
            soundMuted={headphonesMuted}
            userMuted={mutedParticipantIds.has(participant.id)}
            volume={getParticipantVolume(participant.id)}
            showDetails={showRoomUi}
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

      <div
        className={`${cls.room_activity_panel} ${
          showRoomUi ? cls.room_activity_panel_visible : ""
        }`}
      >
        <button
          className={`${cls.room_activity_btn} ${cls.headphones} ${
            headphonesMuted ? cls.muted : ""
          }`}
          onClick={toggleHeadphones}
          title={headphonesMuted ? "Включить наушники" : "Выключить наушники"}
        >
          <img
            src={headphonesMuted ? "/headphones-off.svg" : "/headphones.svg"}
            alt="headphones"
          />
        </button>

        <button
          className={`${cls.room_activity_btn} ${cls.mic} ${
            micMuted ? cls.muted : ""
          }`}
          onClick={toggleMic}
          title={
            headphonesMuted
              ? "Включите наушники, чтобы включить микрофон"
              : micMuted
                ? "Включить микрофон"
                : "Выключить микрофон"
          }
          aria-disabled={headphonesMuted}
        >
          <img src={micMuted ? "/mic-off.svg" : "/mic.svg"} alt="mic" />
        </button>

        <button
          className={`${cls.room_activity_btn} ${cls.leave}`}
          onClick={leaveRoom}
        >
          <img src="/leave.svg" alt="leave" />
        </button>
      </div>
    </div>
  );
};

export default Room;
