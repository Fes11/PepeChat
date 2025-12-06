import React, { useState, useRef, useEffect } from "react";
import "./SearchUser.css";
import UserServices from "../../services/UserService";

const SearchUser = ({ onSelectUser, participants }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!query.trim()) {
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
  }, [query]);

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
        <input
          ref={inputRef}
          className="search_user_input"
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 100)}
        />
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
              <img
                src={user.avatar || "/default.jpg"}
                alt="Avatar"
                className="search_result_avatar"
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
