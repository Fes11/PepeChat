import { useEffect, useMemo, useState } from "react";
import Avatar from "../UI/Avatar/Avatar";
import AvatarPicker from "../UI/AvatarPicker/AvatarPicker.jsx";
import Modal from "../UI/Modal/Modal.jsx";
import ChatService from "../../services/ChatService.jsx";
import { CHAT_NAME_MAX_LENGTH } from "../../constants/limits.js";
import {
  notifyError,
  notifySuccess,
} from "../../notifications/notificationService.js";
import {
  getFieldError,
  normalizeApiErrors,
} from "../../utils/errors.js";
import ConfirmationModal from "./ConfirmationModal.jsx";
import styles from "./EditChatModal.module.css";

const displayName = (user) => user?.username || `@${user?.login}`;

const EditChatModal = ({
  isOpen,
  chat,
  participants = [],
  onUpdated,
  onParticipantKicked,
  onClose,
}) => {
  const [name, setName] = useState(chat?.name || "");
  const [avatar, setAvatar] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [participantToKick, setParticipantToKick] = useState(null);
  const [isKicking, setIsKicking] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setName(chat?.name || "");
    setAvatar(null);
    setRemoveAvatar(false);
    setErrors({});
    setParticipantToKick(null);
  }, [chat?.id, chat?.name, isOpen]);

  const sortedParticipants = useMemo(
    () => [...participants].sort((left, right) => {
      if (left.is_creator !== right.is_creator) return left.is_creator ? -1 : 1;
      return displayName(left.user).localeCompare(displayName(right.user), "ru");
    }),
    [participants],
  );

  const trimmedName = name.trim();
  const nameError = getFieldError(errors, "name");
  const avatarError = getFieldError(errors, "avatar");
  const formError = getFieldError(errors, "non_field_errors");
  const hasChanges = trimmedName !== chat?.name || Boolean(avatar) || removeAvatar;
  const canSubmit = Boolean(trimmedName) && hasChanges && !isSaving;

  const selectAvatar = (file) => {
    setAvatar(file);
    setRemoveAvatar(false);
    setErrors((current) => ({ ...current, avatar: undefined }));
  };

  const deleteAvatar = () => {
    setAvatar(null);
    setRemoveAvatar(true);
    setErrors((current) => ({ ...current, avatar: undefined }));
  };

  const saveChat = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSaving(true);
    setErrors({});
    try {
      let payload;
      if (avatar) {
        payload = new FormData();
        payload.append("name", trimmedName);
        payload.append("avatar", avatar);
      } else {
        payload = {
          name: trimmedName,
          ...(removeAvatar ? { avatar: null } : {}),
        };
      }

      const { data } = await ChatService.updateChat(chat.id, payload);
      onUpdated?.(data);
      notifySuccess("Изменения чата сохранены");
      onClose?.();
    } catch (error) {
      setErrors(normalizeApiErrors(error, "Не удалось сохранить изменения чата."));
    } finally {
      setIsSaving(false);
    }
  };

  const kickParticipant = async () => {
    if (!participantToKick || isKicking) return;

    setIsKicking(true);
    try {
      await ChatService.kickParticipant(chat.id, participantToKick.id);
      onParticipantKicked?.(participantToKick);
      notifySuccess(`${displayName(participantToKick.user)} исключён из чата`);
      setParticipantToKick(null);
    } catch (error) {
      notifyError(error, "Не удалось исключить участника из чата");
    } finally {
      setIsKicking(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Редактирование чата"
        size="medium"
        closeDisabled={isSaving || isKicking}
        closeOnOverlay={!isSaving && !isKicking}
      >
        <form className={styles.form} onSubmit={saveChat}>
          <div className={styles.chatFields}>
            <div className={styles.avatarColumn}>
              <AvatarPicker
                avatar={avatar}
                onSelectAvatar={selectAvatar}
                previewSrc={removeAvatar ? null : chat?.avatar}
                className={styles.avatarPicker}
                disabled={isSaving}
                ariaLabel="Выбрать новую аватарку чата"
              />
              {(chat?.avatar || avatar) && !removeAvatar && (
                <button
                  type="button"
                  className={styles.removeAvatarButton}
                  onClick={deleteAvatar}
                  disabled={isSaving}
                >
                  Удалить аватарку
                </button>
              )}
              {removeAvatar && (
                <span className={styles.avatarRemoved}>Будет стандартная</span>
              )}
            </div>

            <div className={styles.nameField}>
              <label htmlFor="edited-chat-name">Название чата</label>
              <input
                id="edited-chat-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setErrors((current) => ({ ...current, name: undefined }));
                }}
                type="text"
                maxLength={CHAT_NAME_MAX_LENGTH}
                disabled={isSaving}
                aria-invalid={Boolean(nameError)}
              />
              <span className={styles.nameCounter}>
                {name.length}/{CHAT_NAME_MAX_LENGTH}
              </span>
              {nameError && <p className={styles.fieldError}>{nameError}</p>}
              {avatarError && <p className={styles.fieldError}>{avatarError}</p>}
            </div>
          </div>

          <section className={styles.participantsSection}>
            <div className={styles.sectionHeader}>
              <div>
                <h3>Участники</h3>
                <p>Создателя чата исключить нельзя</p>
              </div>
              <span>{participants.length}</span>
            </div>

            <div className={styles.participantsList}>
              {sortedParticipants.map((participant) => (
                <div key={participant.id} className={styles.participant}>
                  <Avatar
                    src={participant.user?.avatar}
                    alt={`Аватар ${displayName(participant.user)}`}
                    size={38}
                  />
                  <div className={styles.participantInfo}>
                    <strong>{displayName(participant.user)}</strong>
                    {participant.is_creator && <span>Создатель</span>}
                  </div>
                  {!participant.is_creator && (
                    <button
                      type="button"
                      className={styles.kickButton}
                      onClick={() => setParticipantToKick(participant)}
                      disabled={isSaving || isKicking}
                    >
                      Исключить
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {formError && <p className={styles.formError}>{formError}</p>}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isSaving || isKicking}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={!canSubmit || isKicking}
            >
              {isSaving ? "Сохраняем…" : "Сохранить"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(participantToKick)}
        title="Исключить участника?"
        confirmLabel="Исключить"
        danger
        isSubmitting={isKicking}
        onConfirm={kickParticipant}
        onClose={() => setParticipantToKick(null)}
      >
        Пользователь <strong>{displayName(participantToKick?.user)}</strong> потеряет
        доступ к чату и его голосовой комнате.
      </ConfirmationModal>
    </>
  );
};

export default EditChatModal;
