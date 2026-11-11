import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Loading from "./Loading.jsx";
import { roleHome } from "../utils/roles.js";

/** Restricts a route group to one or more roles. */
export default function RoleRoute({ roles = [] }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <Loading label="Checking your permissions..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles.length && !roles.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />;
  }
  return <Outlet />;
}