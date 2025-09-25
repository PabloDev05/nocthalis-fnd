import { PrivateRoute } from "../../components/PrivateRoute";
import Arena from "../arena/index";

const ProtectedArena = () => (
  <PrivateRoute requireClassChosen>
    <Arena />
  </PrivateRoute>
);

export default ProtectedArena;
