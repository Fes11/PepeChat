import React, { useState } from "react";
import Spinner from "../UI/Spiner";

const ReadMessageCheck = ({ isRead, load }) => {
  if (load) {
    <Spinner />;
  } else {
    if (isRead) {
      return (
        <div className="message_read_double">
          <img src="/message-read.svg" className="message_read_f" />
          <img src="/message-read.svg" className="message_read_f" />
        </div>
      );
    } else {
      return <img src="/message-read.svg" className="message_read" />;
    }
  }
};

export default ReadMessageCheck;
