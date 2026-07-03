import React, { useState, useEffect } from "react";
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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(EMPTY_RESULTS);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
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
  }, [query]);

  const hasLocalResults = results.my_chats.length > 0;
  const hasGlobalResults = results.global.length > 0;
  const hasResults = hasLocalResults || hasGlobalResults;
  const showResults = Boolean(query.trim()) && (hasResults || hasSearched);

  return (
    <div className={classes.search_wrapper}>
      <input
        className={classes.search}
        type="search"
        {...props}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

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
