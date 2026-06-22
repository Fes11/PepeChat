import React, { useState } from "react";
import Spinner from "../UI/Spiner";

const ReadMessageCheck = ({ isRead, load }) => {
  if (load) {
    return <Spinner />;
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
