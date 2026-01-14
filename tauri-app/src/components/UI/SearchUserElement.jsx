import React, { useContext } from "react";
import UserAvatar from "./UserAvatar.jsx";
import classes from "./Input/Search.module.css";
import { Context } from "../../main.jsx";

const SearchUserElement = function ({ user }) {
  const { chatStore } = useContext(Context);

  return (
    <div
      key={user.id}
      className={classes.search_result_item}
      onClick={() => chatStore.openPrivateChat(user)}
    >
      <UserAvatar user={user} width="28px" height="28px" />

      <div className={classes.search_result_info}>
        <p className={classes.search_result_username}>{user.username}</p>
        <p className={classes.search_result_login}>@{user.login}</p>
      </div>
    </div>
  );
};

export default SearchUserElement;
