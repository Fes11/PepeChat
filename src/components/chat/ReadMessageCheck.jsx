import React from "react";

const ReadMessageCheck = ({ isRead, deliveryStatus }) => {
  if (deliveryStatus === "pending") {
    return <span className="message_delivery_pending" title="Отправляется" aria-label="Отправляется" />;
  }

  if (deliveryStatus === "failed") {
    return <span className="message_delivery_failed" title="Не доставлено" aria-label="Не доставлено">!</span>;
  }

  if (isRead) {
    return (
      <div className="message_read_double">
        <img src="/message-read.svg" className="message_read_f" />
        <img src="/message-read.svg" className="message_read_f" />
      </div>
    );
  }

  return <img src="/message-read.svg" className="message_read" />;
};

export default ReadMessageCheck;
