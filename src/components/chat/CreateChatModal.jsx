import React, { useState } from "react";
import classes from "./CreateChatModal.module.css";
import SearchUser from "./SearchUser.jsx";
import AvatarPicker from "./AvatarPicker.jsx";
import Participant from "./Participant.jsx";
import ChatService from "../../services/ChatService";
import { notifySuccess } from "../../notifications/notificationService";

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
      notifySuccess("Чат создан");
    } catch (error) {
      console.error("Ошибка при создании чата:", error);
    }
  };

  const removeParticipant = (userId) => {
    setParticipants((prev) => prev.filter((p) => p.id !== userId));
  };

  return (
    <form className={classes.content} onSubmit={createChat}>
      <div className={classes.header}>
        <div>
          <p className={classes.eyebrow}>Group chat</p>
          <h2 className={classes.title}>Create new chat</h2>
        </div>
        <button className={classes.close} type="button" onClick={onClose}>
          X
        </button>
      </div>

      <div className={classes.description}>
        <AvatarPicker avatar={avatar} onSelectAvatar={setAvatar} />

        <div className={classes.input_box}>
          <label className={classes.field_label} htmlFor="chat-title">
            Chat name
          </label>
          <input
            id="chat-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            type="text"
            placeholder="Design crew, Project room..."
            className={classes.input}
          />

          <div className={classes.search_box}>
            <label className={classes.field_label}>Participants</label>
            <SearchUser
              onSelectUser={addSelectUser}
              participants={participants}
            />
          </div>
        </div>
      </div>

      <div className={classes.partchipants__list_header}>
        <p className={classes.partchipants__list_title}>Participants</p>
        <span>{participants.length}</span>
      </div>
      <div className={classes.partchipants__list}>
        {participants.length > 0 ? (
          participants.map((user) => (
            <Participant
              key={user.id}
              user={user}
              onRemove={() => removeParticipant(user.id)}
            />
          ))
        ) : (
          <div className={classes.empty_participants}>
            <span>+</span>
            <p>Add at least one person to create a chat</p>
          </div>
        )}
      </div>

      <label className={classes.create_chat_private}>
        <span>
          <strong>Private chat</strong>
          <small>Only invited participants can find it</small>
        </span>
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setPrivate(e.target.checked)}
        />
      </label>

      <button
        className={classes.create_chat_btn}
        type="submit"
        disabled={isCreateDisabled}
      >
        Create chat
      </button>
    </form>
  );
};

export default CreateChatModal;
