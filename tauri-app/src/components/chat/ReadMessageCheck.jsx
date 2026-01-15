import React, { useState } from "react";

const ReadMessageCheck = function () {
  const read = false;

  return (
    <div className="read_message_check">
      {!read ? (
        <img src="./message-read.svg" className="message_read" />
      ) : (
        <img src="./message-read-f.png" className="message_read" />
      )}
      {/* <img src="./message-read.svg" className="message_read"></img> */}
    </div>
  );
};

export default ReadMessageCheck;
