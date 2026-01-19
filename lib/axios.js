import axios from "axios";
import { store } from "@/store";
import { logout } from "@/store/slices/authSlice";

const axiosInstance = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // You can add logic here to add auth headers if needed
    // For this project, we primarily use cookies, so nothing specific needed here for now
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Clear Redux state if the session is expired
      if (store.getState().auth.isAuthenticated) {
        store.dispatch(logout());

        // Log to console for debugging
        console.warn("Session expired or unauthorized. Logging out...");

        // Redirect to login if not already there and not on a public route
        const currentPath = window.location.pathname;
        const isPublicRoute = ["/login", "/signup", "/about"].some((route) =>
          currentPath.includes(route),
        );

        if (
          !isPublicRoute &&
          currentPath !== "/" &&
          !currentPath.includes("/login")
        ) {
          // We can use window.location or handle it via a hook in the UI
          // For interceptors, window.location is a safe bet for a hard reset if needed
          // but often it's better to let the UI react to the state change.
        }
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
