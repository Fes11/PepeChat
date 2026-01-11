import React, { useState, useEffect } from "react";
import classes from "./Search.module.css";
import ChatServices from "../../../services/ChatService.jsx";
import SearchUserElement from "../SearchUserElement.jsx";
import SearchChatElement from "../SearchChatElement.jsx";

const Search = function ({ children, ...props }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({
    my_chats: [],
    global: [],
  });
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await ChatServices.globalSearch(query);
        setResults(res.data);
        console.log("Search results:", res.data);
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

      {isFocused &&
        (results?.my_chats?.length > 0 || results?.global?.length > 0) && (
          <div className={classes.search_results}>
            <p className={classes.search_result_text}>Local results</p>

            {results?.my_chats?.map((result) =>
              result?.type === "user" ? (
                <SearchUserElement key={result.id} user={result} />
              ) : (
                <SearchChatElement key={result.id} chat={result} />
              )
            )}

            <p className={classes.search_result_text}>Global results</p>

            {results.global?.length > 0 &&
              results.global?.map((result) =>
                result?.type === "user" ? (
                  <SearchUserElement key={result.id} user={result} />
                ) : (
                  <SearchChatElement key={result.id} chat={result} />
                )
              )}
          </div>
        )}
    </div>
  );
};

export default Search;
