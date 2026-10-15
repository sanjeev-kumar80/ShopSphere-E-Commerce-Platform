
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [token, setToken] = useState(
    () => sessionStorage.getItem("accessToken")
  );

 
useEffect(() => {
  let cancelled = false;

  const restoreSession = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");

      console.log("AUTH ME RESPONSE:", response.data);

      if (!cancelled) {
        setUser(response.data.data.user);
      }
    } catch (error) {
      console.error(
        "Session restore failed:",
        error.response?.data || error.message
      );

      if (!cancelled) {
        sessionStorage.removeItem("accessToken");
        setToken(null);
        setUser(null);
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  restoreSession();

  return () => {
    cancelled = true;
  };
}, [token]);

  useEffect(() => {
    const handleTokenRefreshed = (e) => {
      const newToken = e.detail?.token;
      if (newToken) {
        setToken(newToken);
      }
    };

    const handleAuthLogout = () => {
      sessionStorage.removeItem("accessToken");
      setToken(null);
      setUser(null);
    };

    window.addEventListener("auth:token-refreshed", handleTokenRefreshed);
    window.addEventListener("auth:logout", handleAuthLogout);

    return () => {
      window.removeEventListener("auth:token-refreshed", handleTokenRefreshed);
      window.removeEventListener("auth:logout", handleAuthLogout);
    };
  }, []);

  const login = (accessToken, userData) => {
    sessionStorage.setItem("accessToken", accessToken);
    setToken(accessToken);
    setUser(userData);
  };

  // const logout = async () => {
  //   try {
  //     await api.post("/auth/logout");
  //   } catch (error) {
  //     console.error("Logout request failed:", error.message);
  //   } finally {
  //     sessionStorage.removeItem("accessToken");
  //     setToken(null);
  //     setUser(null);
  //   }
  // };

    const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout request failed:", error.message);
    } finally {
      sessionStorage.removeItem("accessToken");
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser((prev) => ({
      ...prev,
      ...updatedUser,
    }));
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}