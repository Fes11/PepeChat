import styles from "./ReadMessageCheck.module.css";

const ReadMessageCheck = ({ isRead, deliveryStatus }) => {
  if (deliveryStatus === "pending") {
    return (
      <span
        className={styles.pending}
        title="Отправляется"
        aria-label="Отправляется"
      />
    );
  }

  if (deliveryStatus === "failed") {
    return (
      <span
        className={styles.failed}
        title="Не доставлено"
        aria-label="Не доставлено"
      >
        !
      </span>
    );
  }

  if (isRead) {
    return (
      <span
        className={styles.readDouble}
        title="Прочитано"
        aria-label="Прочитано"
      >
        <img src="/check.svg" className={styles.readOverlay} alt="" />
        <img src="/check.svg" className={styles.readOverlay} alt="" />
      </span>
    );
  }

  return (
    <img
      src="/check.svg"
      className={styles.read}
      title="Доставлено, не прочитано"
      aria-label="Доставлено, не прочитано"
      alt=""
    />
  );
};

export default ReadMessageCheck;
