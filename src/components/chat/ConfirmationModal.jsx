import Modal from "../UI/Modal/Modal.jsx";
import styles from "./ConfirmationModal.module.css";

const ConfirmationModal = ({
  isOpen,
  title,
  children,
  confirmLabel = "Подтвердить",
  cancelLabel = "Отмена",
  danger = false,
  isSubmitting = false,
  onConfirm,
  onClose,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size="small"
    closeDisabled={isSubmitting}
    closeOnOverlay={!isSubmitting}
  >
    <div className={styles.content}>{children}</div>
    <div className={styles.actions}>
      <button
        type="button"
        className={styles.cancelButton}
        onClick={onClose}
        disabled={isSubmitting}
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        className={`${styles.confirmButton} ${danger ? styles.dangerButton : ""}`}
        onClick={onConfirm}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Подождите…" : confirmLabel}
      </button>
    </div>
  </Modal>
);

export default ConfirmationModal;
