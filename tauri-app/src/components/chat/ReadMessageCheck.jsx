import React, { useState } from "react";

const ReadMessageCheck = ({ isRead }) => {
  return (
    <img
      src={isRead ? "/message-read-f.svg" : "/message-read.svg"}
      className="message_read"
    />
  );
};

export default ReadMessageCheck;
