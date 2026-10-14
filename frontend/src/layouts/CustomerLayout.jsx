import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useStore } from "../context/StoreContext";
import { CheckIcon, CloseIcon } from "../components/Icons";

export default function CustomerLayout() {
  const { toast } = useStore();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Global Toast Pill Notification */}
      {toast && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-slate-900/95 px-4 py-3 text-xs font-semibold text-white shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-4"
        >
          {toast.type === "success" && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
              <CheckIcon className="w-3.5 h-3.5" />
            </span>
          )}
          {toast.type === "error" && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white">
              <CloseIcon className="w-3.5 h-3.5" />
            </span>
          )}
          {toast.type === "info" && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white text-[11px]">
              ℹ
            </span>
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar />

      {/* Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Main Footer */}
      <Footer />
    </div>
  );
}
