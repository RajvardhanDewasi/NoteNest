
import axios from "axios";

export const TOKEN_KEY = "notenest_token";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",
  timeout: 15000,
});

// Automatically attach the current JWT token.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle expired sessions.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isAuthRequest = url.startsWith("/auth/");

    if (status === 401 && !isAuthRequest) {
      localStorage.removeItem(TOKEN_KEY);

      window.dispatchEvent(
        new Event("notenest:auth-expired")
      );
    }

    return Promise.reject(error);
  }
);

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// Authentication APIs
export const registerAccount = (details) =>
  api.post("/auth/register", details).then((res) => res.data);

export const loginAccount = (credentials) =>
  api.post("/auth/login", credentials).then((res) => res.data);

export const getCurrentUser = () =>
  api.get("/auth/me").then((res) => res.data.user);

// Notes APIs
export const getNotes = (options = {}) => {
  const params =
    typeof options === "string"
      ? { search: options }
      : options;

  const clean = {};

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== "" &&
      value !== undefined &&
      value !== null &&
      value !== false
    ) {
      clean[key] = value;
    }
  });

  return api.get("/notes", { params: clean }).then((res) => res.data);
};

export const getNote = (id) =>
  api.get(`/notes/${id}`).then((res) => res.data);

export const createNote = (note) =>
  api.post("/notes", note).then((res) => res.data);

export const updateNote = (id, note) =>
  api.put(`/notes/${id}`, note).then((res) => res.data);

export const toggleChecklistItem = (id, index) =>
  api.patch(`/notes/${id}/checklist/${index}`).then((res) => res.data);

export const deleteNote = (id) =>
  api.delete(`/notes/${id}`).then((res) => res.data);

export const pinNote = (id, pinned) =>
  api.patch(
    `/notes/${id}/pin`,
    typeof pinned === "boolean" ? { pinned } : {}
  ).then((res) => res.data);

export const archiveNote = (id) =>
  api.patch(`/notes/${id}/archive`).then((res) => res.data);

export const unarchiveNote = (id) =>
  api.patch(`/notes/${id}/unarchive`).then((res) => res.data);

export const restoreNote = (id) =>
  api.patch(`/notes/${id}/restore`).then((res) => res.data);

export const permanentDeleteNote = (id) =>
  api.delete(`/notes/${id}/permanent`).then((res) => res.data);

export const markViewed = (id) =>
  api.post(`/notes/${id}/view`).then((res) => res.data);

export const getCounts = () =>
  api.get("/notes/meta/counts").then((res) => res.data);

export const getTags = () =>
  api.get("/notes/meta/tags").then((res) => res.data);

export function errorMessage(err) {
  if (err.response?.data?.message) {
    return err.response.data.message;
  }

  if (err.request) {
    return "Cannot reach the server. Is the backend running?";
  }

  return "Something went wrong. Please try again.";
}
