import React, { useContext } from "react";
import UserAvatar from "./UserAvatar.jsx";
import classes from "./Input/Search.module.css";
import { Context } from "../../main.jsx";
import { useNavigate } from "react-router-dom";

const SearchUserElement = function ({ user }) {
  const { ChatStore } = useContext(Context);
  const navigate = useNavigate();

  const handleOpenPrivateChat = async () => {
    const chat = await ChatStore.openPrivateChat(user);
    if (chat?.id) {
      navigate(`/chat/${chat.id}`);
    }
  };

  return (
    <div
      key={user.id}
      className={classes.search_result_item}
      onClick={handleOpenPrivateChat}
    >
      <UserAvatar
        src={user.avatar}
        status={user.status}
        width="28px"
        height="28px"
      />

      <div className={classes.search_result_info}>
        <p className={classes.search_result_username}>{user.username}</p>
        <p className={classes.search_result_login}>@{user.login}</p>
      </div>
    </div>
  );
};

export default SearchUserElement;
