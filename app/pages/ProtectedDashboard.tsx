import { JSX } from "react";
import { PrivateRoute } from "../components/PrivateRoute";
import Dashboard from "./Dashboard";

export default function ProtectedDashboard(): JSX.Element {
  return (
    <PrivateRoute>
      <Dashboard />
    </PrivateRoute>
  );
}