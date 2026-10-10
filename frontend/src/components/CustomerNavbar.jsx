
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CustomerNavbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <Link to="/" className="text-2xl font-bold text-gray-900">
          Shop<span className="text-indigo-600">Sphere</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="hidden text-sm font-medium text-gray-700 hover:text-indigo-600 sm:block"
          >
            Home
          </Link>

          <Link
            to="/shop"
            className="text-sm font-medium text-gray-700 hover:text-indigo-600"
          >
            Shop
          </Link>

          {user?.role === "USER" && (
            <>
              <Link
                to="/cart"
                className="text-sm font-medium text-gray-700 hover:text-indigo-600"
              >
                Cart
              </Link>

              <Link
                to="/orders"
                className="hidden text-sm font-medium text-gray-700 hover:text-indigo-600 sm:block"
              >
                My Orders
              </Link>
            </>
          )}

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((previous) => !previous)}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                aria-expanded={menuOpen}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
                  {(user.name || "U").charAt(0).toUpperCase()}
                </span>

                <span className="max-w-28 truncate">
                  {user.name || "My Account"}
                </span>

                <span aria-hidden="true">⌄</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-white py-2 shadow-lg">
                  <div className="border-b px-4 py-2">
                    <p className="truncate font-semibold">
                      {user.name || "Customer"}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {user.email}
                    </p>
                  </div>

                  <Link
                    to="/orders"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    My Orders
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}