import { PrivateRoute } from "../../components/PrivateRoute";
import Arena from "../Arena";

const ProtectedArena = () => (
  <PrivateRoute requireClassChosen>
    <Arena />
  </PrivateRoute>
);

export default ProtectedArena;
