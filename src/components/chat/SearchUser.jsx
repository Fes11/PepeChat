import React, { useState, useRef, useEffect, useId } from "react";
import "./SearchUser.css";
import UserServices from "../../services/UserService";
import UserAvatar from "../UI/UserAvatar.jsx";

const SearchUser = ({ onSelectUser, participants }) => {
  const searchId = useId().replace(/:/g, "");
  const [isEditing, setIsEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const searchName = `pepechat-user-search-${searchId}`;

  const clearBrowserAutofill = () => {
    setQuery("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      clearBrowserAutofill();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isFocused || !query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await UserServices.searchUser(query);
        setResults(res.data);
      } catch (err) {
        console.log("Search error:", err);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [isFocused, query]);

  return (
    <div className="search_user_wrapper">
      {!isEditing ? (
        <button
          className="search_user_btn"
          type="button"
          onClick={() => setIsEditing(true)}
        >
          + Add user
        </button>
      ) : (
        <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
          <input type="text" name="login" autoComplete="username" hidden />
          <input type="password" name="password" autoComplete="current-password" hidden />
          <input
            ref={inputRef}
            className="search_user_input"
            type="text"
            name={searchName}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            readOnly={!isFocused}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onInput={(e) => setQuery(e.currentTarget.value)}
            onFocus={() => {
              setIsFocused(true);
              clearBrowserAutofill();
            }}
            onBlur={() => setTimeout(() => setIsFocused(false), 100)}
          />
        </form>
      )}

      {isFocused && results.length > 0 && (
        <div className="search_results">
          {results.map((user) => (
            <div
              key={user.id}
              className={`search_result_item ${
                participants.some((p) => p.id === user.id)
                  ? "selected_user"
                  : ""
              }`}
              onClick={() => {
                onSelectUser(user);
                setQuery("");
                setIsEditing(false);
              }}
            >
              <div className="selected_user_check_mark">
                <span>&#10003;</span>
              </div>

              <UserAvatar
                src={user.avatar}
                status={user.status}
                width="28px"
                height="28px"
              />
              <div className="search_result_text">
                <p className="search_result_username">{user.username}</p>
                <p className="search_result_login">@{user.login}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchUser;
