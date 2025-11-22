import React, { useState, useRef, useEffect } from "react";
import "./SearchUser.css";
import UserServices from "../../services/UserService";

const SearchUser = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
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
        />
      )}

      {results.length > 0 && (
        <div className="search_results">
          {results.map((user) => (
            <div key={user.id} className="search_result_item">
              <img
                src={user.avatar || "/default.jpg"}
                alt="Avatar"
                className="search_result_avatar"
              />
              <div>
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
