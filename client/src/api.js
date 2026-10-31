import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

export const getNotes = (search = "", view = "active") =>
  api.get("/notes", { params: { ...(search ? { search } : {}), view } }).then((res) => res.data);

export const createNote = (note) => api.post("/notes", note).then((res) => res.data);

export const updateNote = (id, note) => api.put(`/notes/${id}`, note).then((res) => res.data);

export const deleteNote = (id) => api.delete(`/notes/${id}`).then((res) => res.data);

export const restoreNote = (note) =>
  api.post(`/notes/${note._id}/restore`, note).then((res) => res.data);

// Turn an Axios error into a friendly message
export function errorMessage(err) {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.request) return "Cannot reach the server. Is the backend running?";
  return "Something went wrong. Please try again.";
}
