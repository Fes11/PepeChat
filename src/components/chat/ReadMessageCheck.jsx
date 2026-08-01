import styles from "./ReadMessageCheck.module.css";

const ReadMessageCheck = ({ isRead, deliveryStatus }) => {
  if (deliveryStatus === "pending") {
    return <span className={styles.pending} title="Отправляется" aria-label="Отправляется" />;
  }

  if (deliveryStatus === "failed") {
    return <span className={styles.failed} title="Не доставлено" aria-label="Не доставлено">!</span>;
  }

  if (isRead) {
    return (
      <div className={styles.readDouble}>
        <img src="/message-read.svg" className={styles.readOverlay} />
        <img src="/message-read.svg" className={styles.readOverlay} />
      </div>
    );
  }

  return <img src="/message-read.svg" className={styles.read} />;
};

export default ReadMessageCheck;
