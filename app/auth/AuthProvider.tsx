import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type User = { username: string };

type AuthContextType = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// helpers
const LS_TOKEN = "token";
const LS_USER = "user";

type JwtPayload = {
  exp?: number;
  iat?: number;
  id?: string;
  username?: string;
};
const decode = (t: string | null): JwtPayload | null => {
  if (!t) return null;
  try {
    const [, p] = t.split(".");
    return JSON.parse(atob(p));
  } catch {
    return null;
  }
};
const isExpired = (t: string | null) => {
  const p = decode(t);
  return p?.exp ? Date.now() >= p.exp * 1000 : false;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const logoutTimer = useRef<number | null>(null);

  const scheduleLogout = (tok: string | null) => {
    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current);
      logoutTimer.current = null;
    }
    const p = decode(tok);
    if (p?.exp) {
      const ms = Math.max(0, p.exp * 1000 - Date.now());
      logoutTimer.current = window.setTimeout(() => logout(), ms);
    }
  };

  // bootstrap desde localStorage
  useEffect(() => {
    const t = localStorage.getItem(LS_TOKEN);
    const uStr = localStorage.getItem(LS_USER);
    if (t && !isExpired(t) && uStr) {
      setToken(t);
      setUser(JSON.parse(uStr));
      scheduleLogout(t);
    } else {
      localStorage.removeItem(LS_TOKEN);
      localStorage.removeItem(LS_USER);
    }
    setAuthLoading(false);
    return () => {
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };
  }, []);

  // sync entre pestañas
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_TOKEN) {
        const t = e.newValue;
        if (!t || isExpired(t)) {
          setToken(null);
          setUser(null);
          if (logoutTimer.current) clearTimeout(logoutTimer.current);
        } else {
          setToken(t);
          scheduleLogout(t);
        }
      }
      if (e.key === LS_USER)
        setUser(e.newValue ? JSON.parse(e.newValue) : null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = (u: User, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem(LS_USER, JSON.stringify(u));
    localStorage.setItem(LS_TOKEN, t);
    scheduleLogout(t);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(LS_USER);
    localStorage.removeItem(LS_TOKEN);
    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current);
      logoutTimer.current = null;
    }
  };

  const isAuthenticated = useMemo(() => !!token && !isExpired(token), [token]);

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated, authLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
