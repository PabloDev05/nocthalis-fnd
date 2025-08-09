import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type AuthContextType = {
  user: string | null;
  token: string | null;
  classChosen: boolean;
  characterClassName: string | null; // para UI (p. ej. "Guerrero")
  characterClassId: string | null; // ObjectId real
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [classChosen, setClassChosen] = useState<boolean>(false);
  const [characterClassName, setCharacterClassName] = useState<string | null>(
    null
  );
  const [characterClassId, setCharacterClassId] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedClassChosen = localStorage.getItem("classChosen");
    const storedClassName = localStorage.getItem("characterClassName");
    const storedClassId = localStorage.getItem("characterClassId");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
      setClassChosen(storedClassChosen === "true");
      setCharacterClassName(storedClassName || null);
      setCharacterClassId(storedClassId || null);
    }

    setAuthLoading(false);
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
    setClassChosen(newClassChosen);
    setCharacterClassName(newCharacterClassName);
    setCharacterClassId(newCharacterClassId);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", newUser);
    localStorage.setItem("classChosen", String(newClassChosen)); // ← esto debe quedar "true"
    if (newCharacterClassName) {
      localStorage.setItem("characterClassName", newCharacterClassName);
    } else {
      localStorage.removeItem("characterClassName");
    }
    if (newCharacterClassId) {
      localStorage.setItem("characterClassId", newCharacterClassId);
    } else {
      localStorage.removeItem("characterClassId");
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setClassChosen(false);
    setCharacterClassName(null);
    setCharacterClassId(null);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("classChosen");
    localStorage.removeItem("characterClassName");
    localStorage.removeItem("characterClassId");
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        classChosen,
        characterClassName,
        characterClassId,
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

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
