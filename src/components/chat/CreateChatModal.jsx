import React, { useState } from "react";
import classes from "./CreateChatModal.module.css";
import SearchUser from "./SearchUser.jsx";
import AvatarPicker from "./AvatarPicker.jsx";
import Participant from "./Participant.jsx";
import ChatService from "../../services/ChatService";

const CreateChatModal = ({ onChatCreated, onClose }) => {
  const [title, setTitle] = useState("");
  const [participants, setParticipants] = useState([]);
  const [isPrivate, setPrivate] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const isCreateDisabled = participants.length === 0;

  const isGroup = true;

  const addSelectUser = (user) => {
    const exists = participants.some((p) => p.id === user.id);
    if (exists) return;
    setParticipants((prev) => [...prev, user]);
  };

  const createChat = async (e) => {
    e.preventDefault();

    const participantIds = participants.map((p) => p.id);
    const formData = new FormData();

    formData.append("name", title);
    if (avatar) formData.append("avatar", avatar);
    formData.append("is_private", isPrivate);
    formData.append("is_group", isGroup);

    participantIds.forEach((id) => {
      formData.append("participants", id);
    });

    try {
      const response = await ChatService.createChat(formData);

      const newChat = response.data;

      onChatCreated(newChat);

      setTitle("");
      setParticipants([]);
      setAvatar(null);
      setPrivate(false);

      onClose();
    } catch (error) {
      console.error("Ошибка при создании чата:", error);
    }
  };

  const removeParticipant = (userId) => {
    setParticipants((prev) => prev.filter((p) => p.id !== userId));
  };

  return (
    <form className={classes.content}>
      <div className={classes.header}>
        <p className={classes.title}>Create new chat</p>
        <button className={classes.close} type="button" onClick={onClose}>
          X
        </button>
      </div>

      <div className={classes.description}>
        <AvatarPicker avatar={avatar} onSelectAvatar={setAvatar} />

        <div className={classes.input_box}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            type="text"
            placeholder="Chat name"
            className={classes.input}
          />

          <SearchUser
            onSelectUser={addSelectUser}
            participants={participants}
          />
        </div>
      </div>

      <p className={classes.partchipants__list_title}>Participants chat: </p>
      <div className={classes.partchipants__list}>
        {participants.map((user) => (
          <Participant
            key={user.id}
            user={user}
            onRemove={() => removeParticipant(user.id)}
          />
        ))}
      </div>

      <div className={classes.create_chat_private}>
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setPrivate(e.target.checked)}
        />
        Is private chat
      </div>

      <button
        className={classes.create_chat_btn}
        onClick={createChat}
        disabled={isCreateDisabled}
      >
        Create chat
      </button>
    </form>
  );
};

export default CreateChatModal;
