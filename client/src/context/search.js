// Edited by Wen Han Tang A0340008W to resolve import issues
// Bug fix by Wen Han Tang A0340008W - added search context to manage search state across components
import React, { useState, useContext, createContext } from "react";

const defaultSearchState = { keyword: "", results: [] };
const SearchContext = createContext([defaultSearchState, () => {}]);
const SearchProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    keyword: "",
    results: [],
  });

  return (
    <SearchContext.Provider value={[auth, setAuth]}>
      {children}
    </SearchContext.Provider>
  );
};

// custom hook
const useSearch = () => useContext(SearchContext);

export { useSearch, SearchProvider };