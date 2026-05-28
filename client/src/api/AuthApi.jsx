// api/AuthApi.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API || "http://localhost:5000/api",
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve();
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // if caller explicitly said skip — just reject, no refresh no redirect
    if (original._skipRefresh) {
      return Promise.reject(err);
    }

    // also always skip the refresh endpoint itself
    if (original.url?.includes("/auth/refresh")) {
      return Promise.reject(err);
    }

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => API(original))
          .catch((e) => Promise.reject(e));
      }

      isRefreshing = true;

      try {
        await API.post("/auth/refresh");
        processQueue(null);
        return API(original);
      } catch (refreshErr) {
        processQueue(refreshErr);
        localStorage.removeItem("uno_user");
        window.location.href = "/auth";
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);
export default API;
 