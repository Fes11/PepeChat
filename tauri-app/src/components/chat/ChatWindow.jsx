import React from "react";
import Message from "./Message"

const ChatWindow = () => {
  const user = {
    avatar: "/test_avatar2.jpg",
    auth_user: true
  }

  const user2 = {
    avatar: "/test_avatar3.jpg",
  }

  return (
    <div className="chat">
      <div className="chat__header">
        <div className="chat__header_info">
          <p className="chat__header_name">Username</p>
          <p className="chat__header_description">online</p>
        </div>
      </div>

      <div className="chat__message_list">
        <Message user={user} />
        <Message user={user} />
        <Message user={user2} />
      </div>

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
