import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("/", "./pages/ClassSelection.tsx"), // pública
  route("/login", "./pages/Login.tsx"), // pública
  route("/register", "./pages/Register.tsx"), // pública

  // protegidas
  route("/dashboard", "./pages/protected/ProtectedDashboard.tsx"),
  route("/game", "./pages/protected/ProtectedGameInterface.tsx"),

  route("*", "./pages/NotFound.tsx"),
] satisfies RouteConfig;
