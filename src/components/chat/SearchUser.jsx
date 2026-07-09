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
          + Добавить участника
        </button>
      ) : (
        <div className="search_user_field">
          <input type="text" name="login" autoComplete="username" hidden />
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            hidden
          />
          <input
            ref={inputRef}
            className="search_user_input"
            type="text"
            name={searchName}
            placeholder="Поиск по имени или логину"
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
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
              }
            }}
            onFocus={() => {
              setIsFocused(true);
              clearBrowserAutofill();
            }}
            onBlur={() => setTimeout(() => setIsFocused(false), 100)}
          />
        </div>
      )}

      {isFocused && results.length > 0 && (
        <div className="search_results">
          {results.map((user) => {
            const isSelected = participants.some((p) => p.id === user.id);

            return (
              <button
                key={user.id}
                type="button"
                className={`search_result_item ${
                  isSelected ? "selected_user" : ""
                }`}
                disabled={isSelected}
                aria-disabled={isSelected}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (isSelected) return;
                  onSelectUser(user);
                  setQuery("");
                  setIsEditing(false);
                }}
              >
                <UserAvatar
                  src={user.avatar}
                  status={user.status}
                  width="30px"
                  height="30px"
                />
                <div className="search_result_text">
                  <p className="search_result_username">{user.username}</p>
                  <p className="search_result_login">@{user.login}</p>
                </div>

                {isSelected ? (
                  <span className="search_result_badge">Добавлен</span>
                ) : (
                  <span className="search_result_add">Добавить</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchUser;
