import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User, AuthState } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AUTH_STORAGE_KEY = "auth";

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  console.log('token', token)

  // Load auth state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
        const authState: AuthState = JSON.parse(saved);
        setUser(authState.user);
        setToken(authState.token);
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, []);

  const login = useCallback((user: User, token: string) => {
    setUser(user);
    setToken(token);
    const authState: AuthState = { user, token };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
        const authState: AuthState = JSON.parse(saved);
        authState.user = updatedUser;
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
      } catch {
        // TODO: ??
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const getStoredToken = (): string | null => {
  const saved = localStorage.getItem(AUTH_STORAGE_KEY);
  if (saved) {
    try {
      const authState: AuthState = JSON.parse(saved);
      return authState.token;
    } catch {
      return null;
    }
  }
  return null;
};

export const clearAuthState = (): void => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};
