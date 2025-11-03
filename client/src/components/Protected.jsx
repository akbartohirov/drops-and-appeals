import { Navigate } from "react-router-dom";
import { isAuthed } from "../auth";

export default function Protected({ children }) {
  if (!isAuthed()) return <Navigate to="/login" replace />;
  return children;
}
