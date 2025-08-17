import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  // públicas
  route("/login", "./pages/Login.tsx"),
  route("/register", "./pages/Register.tsx"),

  // flujo inicial automático
  route("/", "./pages/StartupRedirect.tsx"),

  // selección de clase (pública pero redirige si ya tenés clase)
  route("/select-class", "./pages/protected/ClassSelectionRoute.tsx"),

  // protegidas
  route("/arena", "./pages/protected/ProtectedArena.tsx"),
  route("/game", "./pages/protected/ProtectedGameInterface.tsx"),

  // utilidades / pruebas
  route("/class-diagram", "./pages/ClassDiagram.tsx"),

  // 404
  route("*", "./pages/NotFound.tsx"),
] satisfies RouteConfig;
