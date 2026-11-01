import { useCallback, useEffect, useRef, useState } from "react";
import { createNote, updateNote, errorMessage } from "../api";

const SAVE_DELAY_MS = 800; // wait this long after the last change before saving

// status is one of:
//   idle        nothing to save yet (new, empty note)
//   unsaved     changes made, waiting for the delay to finish
//   saving      request in progress
//   saved       everything is stored in MongoDB
//   error       the last save failed
//   needs-title the note has content but no title (the server requires one)
//
// How it avoids duplicates:
//  * Saves run one at a time (each waits for the previous one to finish).
//  * The first save is a POST. When it returns we remember the new _id, so
//    every later save is a PUT to that same note.
export default function useAutosave(note, onSaved) {
  const [status, setStatus] = useState(note ? "saved" : "idle");
  const [errorText, setErrorText] = useState("");

  const idRef = useRef(note ? note._id : null);
  const savedNoteRef = useRef(note || null); // newest copy returned by the server
  const latestRef = useRef(null); // newest data waiting to be saved
  const lastJsonRef = useRef(null); // JSON of the data last stored successfully
  const timerRef = useRef(null);
  const chainRef = useRef(null); // promise of the most recent save in the queue
  const busyRef = useRef(0); // number of saves queued or running
  const mountedRef = useRef(true);
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  const safeSetStatus = useCallback((value) => {
    if (mountedRef.current) setStatus(value);
  }, []);

  // Performs one save. It never throws; it returns a result string.
  const doSave = useCallback(async () => {
    const payload = latestRef.current;
    if (!payload) return "nothing";

    const json = JSON.stringify(payload);
    if (json === lastJsonRef.current) {
      latestRef.current = null;
      safeSetStatus(idRef.current ? "saved" : "idle");
      return "nothing";
    }

    if (!String(payload.title || "").trim()) {
      const hasBody =
        Boolean(payload.content) ||
        (payload.checklistItems || []).length > 0 ||
        (payload.tags || []).length > 0;
      if (!idRef.current && !hasBody) {
        safeSetStatus("idle");
        return "nothing";
      }
      safeSetStatus("needs-title");
      return "blocked";
    }

    safeSetStatus("saving");
    try {
      const body = { ...payload };
      const saved = savedNoteRef.current;
      // Only send the reminder when it actually changed. The server treats a
      // reminder it receives as "new", which would re-arm an alert that
      // already fired.
      if (saved && (saved.reminderAt || null) === (payload.reminderAt || null)) {
        delete body.reminderAt;
      }

      const result = idRef.current
        ? await updateNote(idRef.current, body)
        : await createNote(body);

      idRef.current = result._id;
      savedNoteRef.current = result;
      lastJsonRef.current = json;
      if (latestRef.current === payload) latestRef.current = null;

      if (mountedRef.current) setErrorText("");
      // If the user kept typing while we were saving, more is waiting
      safeSetStatus(latestRef.current ? "unsaved" : "saved");
      if (onSavedRef.current) onSavedRef.current(result);
      return "saved";
    } catch (err) {
      if (mountedRef.current) setErrorText(errorMessage(err));
      safeSetStatus("error");
      return "failed";
    }
  }, [safeSetStatus]);

  // Queue a save after any save that is already running
  const flush = useCallback(() => {
    clearTimeout(timerRef.current);
    busyRef.current += 1;
    const previous = chainRef.current || Promise.resolve();
    const run = previous.then(doSave).finally(() => {
      busyRef.current -= 1;
    });
    chainRef.current = run;
    return run;
  }, [doSave]);

  // Called by the editor every time the note changes
  const queueSave = useCallback(
    (payload) => {
      latestRef.current = payload;
      clearTimeout(timerRef.current);

      const busy = busyRef.current > 0;
      if (!busy && JSON.stringify(payload) === lastJsonRef.current) {
        // The user undid their change, so there is nothing to save
        latestRef.current = null;
        setStatus(idRef.current ? "saved" : "idle");
        return;
      }

      if (!busy) setStatus("unsaved");
      timerRef.current = setTimeout(flush, SAVE_DELAY_MS);
    },
    [flush]
  );

  // Tell the hook what an existing note looked like when it was opened
  const setBaseline = useCallback((payload) => {
    lastJsonRef.current = JSON.stringify(payload);
  }, []);

  // Save right now (used when closing the editor).
  // Resolves to: "saved" | "nothing" | "blocked" | "failed"
  const flushNow = useCallback(() => {
    clearTimeout(timerRef.current);
    if (!latestRef.current && busyRef.current === 0) return Promise.resolve("nothing");
    return flush();
  }, [flush]);

  // Try again when the internet connection comes back
  useEffect(() => {
    const retryWhenOnline = () => {
      if (latestRef.current && busyRef.current === 0) flush();
    };
    window.addEventListener("online", retryWhenOnline);
    return () => window.removeEventListener("online", retryWhenOnline);
  }, [flush]);

  // Warn before the tab is closed while changes are not stored yet
  useEffect(() => {
    if (!["unsaved", "saving", "error", "needs-title"].includes(status)) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);
    };
  }, []);

  return { status, errorText, queueSave, flushNow, retry: flush, setBaseline };
}