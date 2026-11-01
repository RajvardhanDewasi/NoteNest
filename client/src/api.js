import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 15000,
});

// Accepts either a search string (old style) or an options object:
// { view, search, category, tag, pinned, updatedWithin, sort, limit }
export const getNotes = (options = {}) => {
  const params = typeof options === "string" ? { search: options } : options;
  const clean = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== undefined && value !== null && value !== false) {
      clean[key] = value;
    }
  });
  return api.get("/notes", { params: clean }).then((res) => res.data);
};

export const getNote = (id) => api.get(`/notes/${id}`).then((res) => res.data);

export const createNote = (note) => api.post("/notes", note).then((res) => res.data);

export const updateNote = (id, note) => api.put(`/notes/${id}`, note).then((res) => res.data);

// Moves the note to Trash
export const deleteNote = (id) => api.delete(`/notes/${id}`).then((res) => res.data);

// The functions below are used in later phases
export const pinNote = (id, pinned) =>
  api.patch(`/notes/${id}/pin`, typeof pinned === "boolean" ? { pinned } : {}).then((res) => res.data);

export const archiveNote = (id) => api.patch(`/notes/${id}/archive`).then((res) => res.data);

export const unarchiveNote = (id) => api.patch(`/notes/${id}/unarchive`).then((res) => res.data);

export const restoreNote = (id) => api.patch(`/notes/${id}/restore`).then((res) => res.data);

export const permanentDeleteNote = (id) =>
  api.delete(`/notes/${id}/permanent`).then((res) => res.data);

export const markViewed = (id) => api.post(`/notes/${id}/view`).then((res) => res.data);

export const getCounts = () => api.get("/notes/meta/counts").then((res) => res.data);

export const getTags = () => api.get("/notes/meta/tags").then((res) => res.data);

// Turn an Axios error into a friendly message
export function errorMessage(err) {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.request) return "Cannot reach the server. Is the backend running?";
  return "Something went wrong. Please try again.";
}