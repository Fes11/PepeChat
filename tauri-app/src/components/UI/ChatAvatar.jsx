import React, { useState } from "react";

const ChatAvatar = function ({ src }) {
  return (
    <img src={src || "/default_chat_icon.png"} className="chat_avatar"></img>
  );
};

export default ChatAvatar;
