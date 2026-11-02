
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCurrentUser,
  loginAccount,
  registerAccount,
  setAuthToken,
  TOKEN_KEY,
} from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  // Restore an existing login after refreshing the page.
  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        if (active) setLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();

        if (active) {
          setUser(currentUser);
        }
      } catch {
        setAuthToken(null);

        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    const handleExpired = () => {
      if (active) {
        setUser(null);
      }
    };

    window.addEventListener(
      "notenest:auth-expired",
      handleExpired
    );

    restoreSession();

    return () => {
      active = false;

      window.removeEventListener(
        "notenest:auth-expired",
        handleExpired
      );
    };
  }, []);

  async function login(credentials) {
    const result = await loginAccount(credentials);

    setAuthToken(result.token);
    setUser(result.user);

    return result.user;
  }

  async function register(details) {
    const result = await registerAccount(details);

    setAuthToken(result.token);
    setUser(result.user);

    return result.user;
  }

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
    }),
    [user, loading, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
