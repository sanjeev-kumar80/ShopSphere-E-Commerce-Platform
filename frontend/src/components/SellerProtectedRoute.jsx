import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SellerProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-400">Verifying seller access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/seller/login" replace />;
  }

  // Strictly allow only SELLER role. Customers, Admins, and Super Admins should not access seller workspace directly.
  if (user.role !== "SELLER") {
    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
