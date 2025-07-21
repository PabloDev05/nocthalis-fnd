import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type AuthContextType = {
  user: string | null;
  token: string | null;
  classChosen: boolean;
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (token: string, user: string, classChosen: boolean) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [classChosen, setClassChosen] = useState<boolean>(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedClassChosen = localStorage.getItem("classChosen");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
      setClassChosen(storedClassChosen === "true");
    }

    setAuthLoading(false);
  }, []);

  const login = (
    newToken: string,
    newUser: string,
    newClassChosen: boolean
  ) => {
    setToken(newToken);
    setUser(newUser);
    setClassChosen(newClassChosen);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", newUser);
    localStorage.setItem("classChosen", String(newClassChosen));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setClassChosen(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("classChosen");
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        classChosen,
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
