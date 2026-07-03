import React, { useEffect, useId, useRef, useState } from "react";
import classes from "./Search.module.css";
import ChatServices from "../../../services/ChatService.jsx";
import SearchUserElement from "../SearchUserElement.jsx";
import SearchChatElement from "../SearchChatElement.jsx";

const EMPTY_RESULTS = {
  my_chats: [],
  global: [],
};

const normalizeResults = (results) => ({
  my_chats: results?.my_chats || [],
  global: results?.global || [],
});

const Search = function (props) {
  const inputRef = useRef(null);
  const searchId = useId().replace(/:/g, "");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(EMPTY_RESULTS);
  const [isFocused, setIsFocused] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
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
    const trimmedQuery = query.trim();

    if (!isFocused || !trimmedQuery) {
      setResults(EMPTY_RESULTS);
      setHasSearched(false);
      return;
    }

    let isActive = true;
    setResults(EMPTY_RESULTS);
    setHasSearched(false);

    const timeout = setTimeout(async () => {
      try {
        const res = await ChatServices.globalSearch(trimmedQuery);

        if (isActive) {
          setResults(normalizeResults(res.data));
          setHasSearched(true);
        }
      } catch (err) {
        if (isActive) {
          setHasSearched(true);
          console.log("Search error:", err);
        }
      }
    }, 300);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [isFocused, query]);

  const hasLocalResults = results.my_chats.length > 0;
  const hasGlobalResults = results.global.length > 0;
  const hasResults = hasLocalResults || hasGlobalResults;
  const showResults = isFocused && Boolean(query.trim()) && (hasResults || hasSearched);

  return (
    <div className={classes.search_wrapper}>
      <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
        <input type="text" name="login" autoComplete="username" hidden />
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          hidden
        />
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

      {showResults && (
        <div className={classes.search_results}>
          {hasLocalResults && (
            <p className={classes.search_result_text}>Local results</p>
          )}

          {hasLocalResults &&
            results.my_chats.map((result) =>
              result?.type === "user" ? (
                <SearchUserElement key={result.id} user={result} />
              ) : (
                <SearchChatElement key={result.id} chat={result} />
              ),
            )}

          {hasGlobalResults && (
            <p className={classes.search_result_text}>Global results</p>
          )}

          {hasGlobalResults &&
            results.global.map((result) =>
              result?.type === "user" ? (
                <SearchUserElement key={result.id} user={result} />
              ) : (
                <SearchChatElement key={result.id} chat={result} requiresJoin />
              ),
            )}

          {!hasResults && (
            <p className={classes.search_result_text}>No results found</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
