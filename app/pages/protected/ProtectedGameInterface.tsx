import { PrivateRoute } from "../../components/PrivateRoute";
import GameInterface from "../GameInterface";

const ProtectedGameInterface = () => (
  <PrivateRoute requireClassChosen>
    <GameInterface />
  </PrivateRoute>
);

export default ProtectedGameInterface;
