import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import cookieParser from "cookie-parser";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js"; // Import from socket.js

const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json({ limit: "4mb" }));
app.use(cookieParser()); // Use cookie parser if we switch to cookies, but for now helpful to have.
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"] // Standard headers
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

app.use("/api/status", (req, res) => {
    res.status(200).json({ status: "Server is live", uptime: process.uptime() });
});

// Default Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: "Internal Server Error" });
});

// Start Server
const startServer = async () => {
    try {
        await connectDB();
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Socket.IO server running`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();
