
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="p-8">Loading admin panel...</div>;
  }

  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return <Navigate to="/admin/login" replace />;
  }

  const linkClass = ({ isActive }) =>
    `block rounded-lg px-4 py-3 ${
      isActive
        ? "bg-indigo-600 text-white"
        : "text-slate-300 hover:bg-slate-800"
    }`;

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <aside className="w-full bg-slate-950 p-5 text-white md:min-h-screen md:w-64">
        <h1 className="text-2xl font-bold">ShopSphere</h1>
        <p className="mt-1 text-sm text-slate-400">Admin Panel</p>

        <nav className="mt-8 space-y-2">
          <NavLink to="/admin/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/products" className={linkClass}>
            Products
          </NavLink>
          <NavLink to="/admin/categories" className={linkClass}>
            Categories
          </NavLink>
          {/* <NavLink to="/admin/products">
            Products
          </NavLink> */}

          <NavLink to="/admin/brands" className={linkClass} >Brands</NavLink>
          <NavLink to="/admin/orders" className={linkClass}>
            Orders
          </NavLink>
        </nav>

        <button
          onClick={logout}
          className="mt-8 w-full rounded-lg border border-slate-700 px-4 py-3 text-left hover:bg-slate-800"
        >
          Logout
        </button>
      </aside>

      <main className="min-w-0 flex-1 p-5 md:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Admin Workspace
            </h2>
            <p className="text-sm text-slate-500">
              Signed in as {user.name}
            </p>
          </div>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
            {user.role}
          </span>
        </header>

        <Outlet />
      </main>
    </div>
  );
}