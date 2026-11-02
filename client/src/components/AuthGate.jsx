import { useAuth } from "../auth/AuthContext";
import AuthPage from "./AuthPage";

export default function AuthGate({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="auth-loading">
        <div className="auth-loading-mark">N</div>
        <p>Opening your personal workspace...</p>
      </main>
    );
  }

  return user ? children : <AuthPage />;
}