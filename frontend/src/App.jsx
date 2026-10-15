import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { StoreProvider } from "./context/StoreContext";

// Layouts
import CustomerLayout from "./layouts/CustomerLayout";
import AdminLayout from "./layouts/AdminLayout";

// Customer & Public Pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/customer/Cart";
import Wishlist from "./pages/customer/Wishlist";
import Checkout from "./pages/customer/Checkout";
import OrderSuccess from "./pages/customer/OrderSuccess";
import MyOrders from "./pages/customer/MyOrders";
import OrderDetails from "./pages/customer/OrderDetails";
import Profile from "./pages/customer/Profile";
import CustomerLogin from "./pages/customer/CustomerLogin";
import CustomerRegister from "./pages/customer/CustomerRegister";
import ForgotPassword from "./pages/customer/ForgotPassword";
import ResetPassword from "./pages/customer/ResetPassword";
import VerifyEmail from "./pages/customer/VerifyEmail";
import CustomerProtectedRoute from "./components/CustomerProtectedRoute";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CategoryManagement from "./pages/admin/CategoryManagement";
import ProductManagement from "./pages/admin/ProductManagement";
import BrandManagement from "./pages/admin/BrandManagement";
import OrderManagement from "./pages/admin/OrderManagement";

function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-sm">
        <h1 className="text-6xl font-black text-indigo-600">404</h1>
        <h2 className="mt-4 text-xl font-bold text-slate-900">Page Not Found</h2>
        <p className="mt-2 text-xs text-slate-500">
          The page you are looking for might have been moved or doesn't exist.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <a
            href="/"
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700"
          >
            Go to Homepage
          </a>
          <a
            href="/shop"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Browse Products
          </a>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <Routes>
            {/* Customer storefront with unified layout (Navbar, Toast, Footer) */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/wishlist" element={<Wishlist />} />

              {/* Protected Customer Routes */}
              <Route element={<CustomerProtectedRoute />}>
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-success" element={<OrderSuccess />} />
                <Route path="/orders" element={<MyOrders />} />
                <Route path="/orders/:id" element={<OrderDetails />} />
                <Route path="/profile" element={<Profile />} />
              </Route>

              {/* 404 Page inside customer layout */}
              <Route path="/404" element={<NotFound />} />
            </Route>

            {/* Customer Auth Pages */}
            <Route path="/login" element={<CustomerLogin />} />
            <Route path="/register" element={<CustomerRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Admin Portal */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="categories" element={<CategoryManagement />} />
              <Route path="products" element={<ProductManagement />} />
              <Route path="brands" element={<BrandManagement />} />
              <Route path="orders" element={<OrderManagement />} />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
