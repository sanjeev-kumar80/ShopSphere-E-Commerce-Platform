import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

// Request interceptor: attach accessToken from sessionStorage
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Concurrency queue for simultaneous requests during token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: automatically refresh expired access token and retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If network error or no request config, reject immediately
    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response.status;
    const requestUrl = originalRequest.url || "";

    // Never attempt token refresh on login, register, or refresh endpoints
    const isAuthEndpoint =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/refresh");

    // Handle 401 Unauthorized for non-auth endpoints
    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      // If a refresh is already in-flight, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use clean axios call with credentials (cookies) to avoid interceptor recursion
        const refreshResponse = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data?.data?.accessToken;

        if (!newAccessToken) {
          throw new Error("No access token returned from refresh endpoint");
        }

        // Store new access token
        sessionStorage.setItem("accessToken", newAccessToken);

        // Notify application components of updated token
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("auth:token-refreshed", {
              detail: { token: newAccessToken },
            })
          );
        }

        // Flush queued requests with the new token
        processQueue(null, newAccessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed/expired: clear session and notify
        processQueue(refreshError, null);

        sessionStorage.removeItem("accessToken");

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth:logout"));

          // Redirect to login if on private customer route
          const currentPath = window.location.pathname;
          const publicPaths = [
            "/login",
            "/register",
            "/forgot-password",
            "/reset-password",
            "/verify-email",
            "/",
            "/shop",
          ];
          const isPublic =
            publicPaths.includes(currentPath) ||
            currentPath.startsWith("/products/") ||
            currentPath.startsWith("/reset-password/") ||
            currentPath.startsWith("/verify-email/");

          if (!isPublic) {
            window.location.href = "/login";
          }
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;