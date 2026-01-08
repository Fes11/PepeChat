import React, { useState } from "react";
import UserAvatar from "../UI/UserAvatar.jsx";

const Participant = ({ user, onClick, onRemove }) => {
  return (
    <div className="participant" onClick={onClick}>
      <UserAvatar src={user.avatar} width="28px" height="28px" />

      <div className="participant__description">
        <p>{user.username}</p>
        <p className="participant__description_login">@{user.login}</p>
      </div>

      {onRemove && (
        <button
          type="button"
          className="participant__remove"
          onClick={onRemove}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default Participant;
