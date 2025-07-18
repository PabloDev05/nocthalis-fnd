import { JSX } from "react";
import { PrivateRoute } from "../components/PrivateRoute";
import Home from "./Home";

export default function ProtectedHome(): JSX.Element {
  return (
    <PrivateRoute>
      <Home />
    </PrivateRoute>
  );
}