import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5001",
    withCredentials: true, // If we strictly used cookies, but harmless if using headers
});

export default axiosInstance;
