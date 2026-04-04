import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage, markMessageAsSeen, deleteChat, deleteMessage } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.put("/mark/:id", protectRoute, markMessageAsSeen);
router.delete("/delete/:id", protectRoute, deleteChat);
router.delete("/message/:messageId", protectRoute, deleteMessage);

export default router;
