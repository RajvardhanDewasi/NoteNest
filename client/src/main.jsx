import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import AuthGate from "./components/AuthGate.jsx";

import "./index.css";
import "./editor.css";
import "./dashboard.css";
import "./auth/auth.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <AuthGate>
        <App />
      </AuthGate>
    </AuthProvider>
  </React.StrictMode>
);