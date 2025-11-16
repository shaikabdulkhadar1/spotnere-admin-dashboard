import { Navigate, Outlet } from "react-router-dom";

export function ProtectedRoute() {
  // Check if user is authenticated (stored in localStorage)
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
