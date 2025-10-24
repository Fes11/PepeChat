import React from "react";

const ChatWindow = () => {
  return (
    <div className="chat">
      <div className="chat__header">
        <div className="chat__header_info">
          <p className="chat__header_name">Username</p>
          <p className="chat__header_description">online</p>
        </div>
      </div>

      <div className="chat__message_list"></div>

     <div className="chat__bottom">
       <input className="chat__input" type="text" placeholder="Write a message..."/>
       <button className="chat__send_btn">
        <img src="/paperplane.svg" alt="Send" />
       </button>
     </div>
    </div>
  );
};

export default ChatWindow;
