import { Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Appeals from "./pages/Appeals";
import Drops from "./pages/Drops";
import Users from "./pages/Users";

export default function App() {
  return (
    <>
      <NavBar />
      <div className="py-3">
        <Routes>
          <Route path="/" element={<Navigate to="/appeals" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/appeals"
            element={
              <ProtectedRoute>
                <Appeals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drops"
            element={
              <ProtectedRoute>
                <Drops />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={<div className="container container-narrow py-4">404</div>}
          />
        </Routes>
      </div>
    </>
  );
}
