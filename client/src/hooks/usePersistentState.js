import { useEffect, useState } from "react";

// Works like useState, but the value is also kept in localStorage so it
// survives a page refresh. If localStorage is unavailable it still works,
// it just forgets the value on refresh.
export default function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored === null ? initialValue : JSON.parse(stored);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore (private browsing, storage full...)
    }
  }, [key, value]);

  return [value, setValue];
}