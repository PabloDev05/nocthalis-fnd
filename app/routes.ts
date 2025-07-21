import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  // públicas
  route("/login", "./pages/Login.tsx"),
  route("/register", "./pages/Register.tsx"),

  // flujo inicial automático
  route("/", "./pages/StartupRedirect.tsx"),

  // selección de clase
  route("/select-class", "./pages/protected/ClassSelectionRoute.tsx"),

  // protegidas
  route("/dashboard", "./pages/protected/ProtectedDashboard.tsx"),
  route("/game", "./pages/protected/ProtectedGameInterface.tsx"),

  route("*", "./pages/NotFound.tsx"),
] satisfies RouteConfig;
