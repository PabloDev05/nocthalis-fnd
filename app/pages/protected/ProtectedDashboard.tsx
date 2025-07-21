import { PrivateRoute } from "../../components/PrivateRoute";
import Dashboard from "../Dashboard";

const ProtectedDashboard = () => (
  <PrivateRoute requireClassChosen>
    <Dashboard />
  </PrivateRoute>
);

export default ProtectedDashboard;
