import axios, { type AxiosInstance, type AxiosError } from "axios"

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/v1` || "http://localhost:3002/v1"

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        delete apiClient.defaults.headers.common["Authorization"];
        sessionStorage.clear();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);


// Request interceptor: Add access token from localStorage to all API requests
apiClient.interceptors.request.use(
  (config) => {
    // Only run in browser environment
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default apiClient
