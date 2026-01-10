import React, { useState, useRef, useEffect } from "react";
import UserServices from "../../../services/UserService";
import UserAvatar from "../UserAvatar.jsx";
import classes from "./Search.module.css";

const Search = function ({ children, ...props }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isFocused, setIsFocused] = useState(false);

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
    <div className={classes.search_wrapper}>
      <input
        className={classes.search}
        type="text"
        {...props}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 100)}
      />

      {isFocused && results.length > 0 && (
        <div className={classes.search_results}>
          <div className={classes.serach_local}>
            <p className={classes.search_result_text}>Local results</p>
          </div>

          <p className={classes.search_result_text}>Global results</p>
          {results.map((user) => (
            <div key={user.id} className={classes.search_result_item}>
              <UserAvatar src={user.avatar} width="28px" height="28px" />

              <div className={classes.search_result_info}>
                <p className={classes.search_result_username}>
                  {user.username}
                </p>
                <p className={classes.search_result_login}>@{user.login}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;
