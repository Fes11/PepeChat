import { useEffect, useMemo, useState } from "react";
import Modal from "../UI/Modal/Modal.jsx";
import Avatar from "../UI/Avatar/Avatar";
import styles from "./LeaveChatModal.module.css";

const displayName = (user) => user?.username || `@${user?.login}`;

const LeaveChatModal = ({
  isOpen,
  chat,
  participants = [],
  currentUserId,
  isCreator,
  isLoadingParticipants = false,
  isSubmitting = false,
  onConfirm,
  onClose,
}) => {
  const [newCreatorId, setNewCreatorId] = useState(null);

  useEffect(() => {
    if (isOpen) setNewCreatorId(null);
  }, [isOpen]);

  const successors = useMemo(
    () => participants.filter(
      (participant) => String(participant.user?.id) !== String(currentUserId),
    ),
    [currentUserId, participants],
  );

  const confirmLabel = isCreator && newCreatorId != null
    ? "Передать и покинуть"
    : "Покинуть чат";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Покинуть чат?"
      size="small"
      closeDisabled={isSubmitting}
      closeOnOverlay={!isSubmitting}
    >
      <div className={styles.content}>
        <p className={styles.description}>
          Вы действительно хотите покинуть чат <strong>«{chat?.name}»</strong>?
        </p>

        {isCreator && (
          <div className={styles.transferSection}>
            <div className={styles.transferHeader}>
              <strong>Передать права владельца</strong>
              <span>Можно оставить чат без владельца</span>
            </div>

            <div className={styles.participantsList} role="radiogroup">
              <label className={styles.participantOption}>
                <span className={styles.emptyAvatar}>—</span>
                <span className={styles.participantText}>
                  <strong>Не передавать никому</strong>
                  <small>После выхода у чата не будет владельца</small>
                </span>
                <input
                  type="radio"
                  name="new-chat-creator"
                  checked={newCreatorId == null}
                  onChange={() => setNewCreatorId(null)}
                />
              </label>

              {isLoadingParticipants && (
                <p className={styles.loadingParticipants}>Загружаем участников…</p>
              )}

              {!isLoadingParticipants && successors.map((participant) => (
                <label key={participant.id} className={styles.participantOption}>
                  <Avatar
                    src={participant.user?.avatar}
                    alt={`Аватар ${displayName(participant.user)}`}
                    size={36}
                  />
                  <span className={styles.participantText}>
                    <strong>{displayName(participant.user)}</strong>
                    <small>Станет новым владельцем чата</small>
                  </span>
                  <input
                    type="radio"
                    name="new-chat-creator"
                    value={participant.user?.id}
                    checked={String(newCreatorId) === String(participant.user?.id)}
                    onChange={() => setNewCreatorId(participant.user?.id)}
                  />
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onClose}
          disabled={isSubmitting}
        >
          Отмена
        </button>
        <button
          type="button"
          className={styles.leaveButton}
          onClick={() => onConfirm?.(newCreatorId)}
          disabled={isSubmitting || (isCreator && isLoadingParticipants)}
        >
          {isSubmitting ? "Выходим…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

export default LeaveChatModal;
