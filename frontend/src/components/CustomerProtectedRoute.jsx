
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function CustomerProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Checking your session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname + location.search,
        }}
      />
    );
  }

  // Admin accounts should use the separate admin area.
  if (user.role !== "USER") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}

export default CustomerProtectedRoute;

