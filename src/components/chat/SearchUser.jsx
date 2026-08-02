import React, { useState, useRef, useEffect, useId } from "react";
import styles from "./SearchUser.module.css";
import UserServices from "../../services/UserService";
import Avatar from "../UI/Avatar/Avatar";
import { SEARCH_QUERY_MAX_LENGTH } from "../../constants/limits.js";

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
    <div className={styles.wrapper}>
      {!isEditing ? (
        <button
          className={styles.addButton}
          type="button"
          onClick={() => setIsEditing(true)}
        >
          + Добавить участника
        </button>
      ) : (
        <div>
          <input type="text" name="login" autoComplete="username" hidden />
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            hidden
          />
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            name={searchName}
            placeholder="Поиск по имени или логину"
            maxLength={SEARCH_QUERY_MAX_LENGTH}
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
        <div className={styles.results}>
          {results.map((user) => {
            const isSelected = participants.some((p) => p.id === user.id);

            return (
              <button
                key={user.id}
                type="button"
                className={`${styles.resultItem} ${
                  isSelected ? styles.selected : ""
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
                <Avatar
                  src={user.avatar}
                  status={user.status}
                  alt={`Аватар пользователя ${user.username || user.login}`}
                  size={30}
                />
                <div className={styles.resultText}>
                  <p className={styles.resultUsername}>{user.username}</p>
                  <p className={styles.resultLogin}>@{user.login}</p>
                </div>

                {isSelected ? (
                  <span className={styles.selectedBadge}>Добавлен</span>
                ) : (
                  <span className={styles.addLabel}>Добавить</span>
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
