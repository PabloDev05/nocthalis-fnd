import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("/", "./pages/Home.tsx"),
  route("/login", "./pages/Login.tsx"),
  route("/dashboard", "./pages/Dashboard.tsx"),
] satisfies RouteConfig;