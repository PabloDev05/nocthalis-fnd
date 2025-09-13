import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/** ----------------------------- Tipos públicos ----------------------------- */
type AuthContextType = {
  user: string | null;
  token: string | null;
  classChosen: boolean;
  characterClassName: string | null;
  characterClassId: string | null;
  /** Stamina centralizada (se actualiza desde backend en cada pantalla) */
  staminaCurrent: number;
  staminaMax: number;
  setStamina: (current: number, max: number) => void;

  isAuthenticated: boolean;
  authLoading: boolean;
  login: (
    token: string,
    user: string,
    classChosen: boolean,
    characterClassName: string | null,
    characterClassId: string | null
  ) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** ------------------------------- Helpers LS ------------------------------- */
const LS = {
  token: "token",
  user: "user",
  classChosen: "classChosen",
  className: "characterClassName",
  classId: "characterClassId",
} as const;

/** --------------------------- Helpers de JWT ------------------------------- */
type JwtPayload = {
  id?: string;
  username?: string;
  exp?: number; // seconds since epoch
  iat?: number;
};

function b64urlDecode(input: string): string {
  let str = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4;
  if (pad === 2) str += "==";
  else if (pad === 3) str += "=";
  else if (pad !== 0) {
    throw new Error("Invalid base64url padding");
  }
  return atob(str);
}

function decodeJwt(token: string | null): JwtPayload | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(b64urlDecode(parts[1]));
    return payload ?? null;
  } catch {
    return null;
  }
}

const EXP_SKEW_MS = 5_000;
function isExpired(token: string | null): boolean {
  const p = decodeJwt(token);
  if (!p?.exp) return false;
  return Date.now() >= p.exp * 1000 - EXP_SKEW_MS;
}

/** ------------------------------ Provider ---------------------------------- */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const [classChosen, setClassChosen] = useState<boolean>(false);
  const [characterClassName, setCharacterClassName] = useState<string | null>(
    null
  );
  const [characterClassId, setCharacterClassId] = useState<string | null>(null);

  // Stamina (centralizada en memoria, no se persiste en LS)
  const [staminaCurrent, _setStaminaCurrent] = useState<number>(0);
  const [staminaMax, _setStaminaMax] = useState<number>(10);
  const setStamina = (current: number, max: number) => {
    _setStaminaCurrent(Math.max(0, current | 0));
    _setStaminaMax(Math.max(1, max | 0));
  };

  const logoutTimerRef = useRef<number | null>(null);

  const scheduleAutoLogout = (tok: string | null) => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    const p = decodeJwt(tok);
    if (p?.exp) {
      const ms = Math.max(0, p.exp * 1000 - Date.now() - EXP_SKEW_MS);
      logoutTimerRef.current = window.setTimeout(() => {
        logout();
      }, ms);
    }
  };

  const hardClear = () => {
    setToken(null);
    setUser(null);
    setClassChosen(false);
    setCharacterClassName(null);
    setCharacterClassId(null);

    _setStaminaCurrent(0);
    _setStaminaMax(10);

    localStorage.removeItem(LS.token);
    localStorage.removeItem(LS.user);
    localStorage.removeItem(LS.classChosen);
    localStorage.removeItem(LS.className);
    localStorage.removeItem(LS.classId);

    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem(LS.token);
    const storedUser = localStorage.getItem(LS.user);
    const storedClassChosen = localStorage.getItem(LS.classChosen);
    const storedClassName = localStorage.getItem(LS.className);
    const storedClassId = localStorage.getItem(LS.classId);

    if (storedToken && !isExpired(storedToken) && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
      setClassChosen(storedClassChosen === "true");
      setCharacterClassName(storedClassName || null);
      setCharacterClassId(storedClassId || null);
      scheduleAutoLogout(storedToken);
    } else {
      hardClear();
    }

    setAuthLoading(false);
    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== localStorage) return;

      if (e.key === LS.token) {
        const newToken = e.newValue;
        if (!newToken || isExpired(newToken)) {
          hardClear();
        } else {
          setToken(newToken);
          scheduleAutoLogout(newToken);
        }
      }
      if (e.key === LS.user) setUser(e.newValue);
      if (e.key === LS.classChosen) setClassChosen(e.newValue === "true");
      if (e.key === LS.className) setCharacterClassName(e.newValue ?? null);
      if (e.key === LS.classId) setCharacterClassId(e.newValue ?? null);
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onFocus = () => {
      if (isExpired(localStorage.getItem(LS.token))) {
        hardClear();
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const login = (
    newToken: string,
    newUser: string,
    newClassChosen: boolean,
    newCharacterClassName: string | null,
    newCharacterClassId: string | null
  ) => {
    setToken(newToken);
    setUser(newUser);
    setClassChosen(!!newClassChosen);
    setCharacterClassName(newCharacterClassName ?? null);
    setCharacterClassId(newCharacterClassId ?? null);

    localStorage.setItem(LS.token, newToken);
    localStorage.setItem(LS.user, newUser);
    localStorage.setItem(LS.classChosen, String(!!newClassChosen));

    if (newCharacterClassName)
      localStorage.setItem(LS.className, newCharacterClassName);
    else localStorage.removeItem(LS.className);

    if (newCharacterClassId)
      localStorage.setItem(LS.classId, newCharacterClassId);
    else localStorage.removeItem(LS.classId);

    scheduleAutoLogout(newToken);
  };

  const logout = () => {
    hardClear();
  };

  const isAuthenticated = useMemo(() => !!token && !isExpired(token), [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        classChosen,
        characterClassName,
        characterClassId,
        staminaCurrent,
        staminaMax,
        setStamina,
        authLoading,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/** Hook público */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
