import React, { useState, useEffect, useId, useRef } from "react";
import classes from "./Search.module.css";
import ChatServices from "../../../services/ChatService.jsx";
import SearchUserElement from "../SearchUserElement.jsx";
import SearchChatElement from "../SearchChatElement.jsx";

const Search = function ({ children, ...props }) {
  const inputRef = useRef(null);
  const searchId = useId().replace(/:/g, "");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({
    my_chats: [],
    global: [],
  });
  const [isFocused, setIsFocused] = useState(false);
  const searchName = `pepechat-search-${searchId}`;

  const clearBrowserAutofill = () => {
    setQuery("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  useEffect(() => {
    const timeout = setTimeout(clearBrowserAutofill, 0);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isFocused || !query.trim()) {
      setResults({
        my_chats: [],
        global: [],
      });
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await ChatServices.globalSearch(query);
        setResults(res.data);
      } catch (err) {
        console.log("Search error:", err);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [isFocused, query]);

  return (
    <div className={classes.search_wrapper}>
      <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
        <input type="text" name="login" autoComplete="username" hidden />
        <input type="password" name="password" autoComplete="current-password" hidden />
        <input
          ref={inputRef}
          className={classes.search}
          type="search"
          {...props}
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

      {isFocused &&
        query &&
        (results?.my_chats?.length > 0 || results?.global?.length > 0) && (
          <div className={classes.search_results}>
            {results.my_chats?.length > 0 && (
              <p className={classes.search_result_text}>Local results</p>
            )}

            {results?.my_chats.length > 0 &&
              results?.my_chats.map((result) =>
                result?.type === "user" ? (
                  <SearchUserElement key={result.id} user={result} />
                ) : (
                  <SearchChatElement key={result.id} chat={result} />
                ),
            )}

            {results.global?.length > 0 && (
              <p className={classes.search_result_text}>Global results</p>
            )}

            {results.global?.length > 0 &&
              results.global?.map((result) =>
                result?.type === "user" ? (
                  <SearchUserElement key={result.id} user={result} />
                ) : (
                  <SearchChatElement
                    key={result.id}
                    chat={result}
                    requiresJoin
                  />
                ),
              )}
          </div>
        )}
    </div>
  );
};

export default Search;
