import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("/", "./pages/ProtectedHome.tsx"),
  route("/login", "./pages/Login.tsx"),
  route("/register", "./pages/Register.tsx"),
  route("/dashboard", "./pages/ProtectedDashboard.tsx"),
] satisfies RouteConfig;