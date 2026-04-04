import { createContext, useContext, useEffect, useState } from "react";
// import { axiosInstance } from "../lib/axios"; // Removed invalid import
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// Ensure axios is default export in ../lib/axios.js, or change here. 
// I wrote it as default export.
import axios from "../lib/axios";

export const AuthContext = createContext();

export const useAuthStore = () => {
    return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);

    const checkAuth = async () => {
        try {
            const res = await axios.get("/api/auth/check");
            setAuthUser(res.data.user);
            connectSocket(res.data.user._id);
        } catch (error) {
            console.log("Error in checkAuth:", error);
            setAuthUser(null);
        } finally {
            setIsCheckingAuth(false);
        }
    };

    const signup = async (data) => {
        try {
            const res = await axios.post("/api/auth/signup", data);
            setAuthUser(res.data.user);
            localStorage.setItem("token", res.data.token); // Store token
            axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`; // update global instance too just in case
            toast.success("Account created successfully");
            connectSocket(res.data.user._id);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const login = async (data) => {
        try {
            const res = await axios.post("/api/auth/login", data);
            setAuthUser(res.data.user);
            localStorage.setItem("token", res.data.token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
            toast.success("Logged in successfully");
            connectSocket(res.data.user._id);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const logout = async () => {
        try {
            await axios.post("/api/auth/logout");
            setAuthUser(null);
            localStorage.removeItem("token");
            delete axios.defaults.headers.common['Authorization'];
            toast.success("Logged out successfully");
            disconnectSocket();
        } catch (error) {
            toast.error(error.response?.data?.message || "Error logging out");
        }
    };

    const deleteAccount = async () => {
        try {
            await axios.delete("/api/auth/delete");
            setAuthUser(null);
            localStorage.removeItem("token");
            delete axios.defaults.headers.common['Authorization'];
            toast.success("Account deleted successfully");
            disconnectSocket();
        } catch (error) {
            toast.error(error.response?.data?.message || "Error deleting account");
        }
    };

    const updateProfile = async (data) => {
        try {
            const res = await axios.put("/api/auth/update-profile", data);
            setAuthUser(res.data.user);
            toast.success("Profile updated successfully");
        } catch (error) {
            console.log("error in update profile:", error);
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const connectSocket = (userId) => {
        if (!userId || socket?.connected) return;

        const newSocket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:5001", {
            query: { userId },
        });

        newSocket.connect();
        setSocket(newSocket);

        newSocket.on("getOnlineUsers", (users) => {
            setOnlineUsers(users);
        });
    };

    const disconnectSocket = () => {
        if (socket?.connected) socket.disconnect();
        setSocket(null);
    };

    // Set token on load
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                authUser,
                isCheckingAuth,
                onlineUsers,
                socket,
                checkAuth,
                signup,
                login,
                logout,
                deleteAccount,
                updateProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
