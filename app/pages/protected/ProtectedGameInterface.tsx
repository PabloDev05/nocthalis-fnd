import { PrivateRoute } from "../../components/PrivateRoute";
import GameInterface from "../gameInterface/GameInterface";

const ProtectedGameInterface = () => (
  <PrivateRoute requireClassChosen>
    <GameInterface />
  </PrivateRoute>
);

export default ProtectedGameInterface;
