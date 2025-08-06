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

  // Test de diagrama de clases e info.
  route("/class-diagram", "./pages/ClassDiagram.tsx"),

  route("*", "./pages/NotFound.tsx"),
] satisfies RouteConfig;
