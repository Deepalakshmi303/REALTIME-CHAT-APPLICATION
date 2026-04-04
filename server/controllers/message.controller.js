import User from "../models/User.js";
import Message from "../models/Message.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
        res.status(200).json({ success: true, users: filteredUsers });
    } catch (error) {
        console.error("Error in getUsersForSidebar: ", error.message);
        res.status(500).json({ success: false, message: "Internal server error"});
    }
};
export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ],
        }).sort({ createdAt: 1 });
        
        const filteredMessages = messages.filter(msg => !msg.deletedBy.includes(myId));
        
        res.status(200).json({ success: true, messages: filteredMessages });
    } catch (error) {
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image, audio } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }
        
        let audioUrl;
        if (audio) {
            const uploadResponse = await cloudinary.uploader.upload(audio, { resource_type: "auto" });
            audioUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
            audio: audioUrl,
        });

        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json({ success: true, newMessage });
    } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        const message = await Message.findByIdAndUpdate(id, { seen: true }, { new: true });
        res.status(200).json({ success: true, message });
    } catch (error) {
        console.log("Error in markMessageAsSeen", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const deleteChat = async (req, res) => {
    try {
        const myId = req.user._id;
        const { id: userToChatId } = req.params;
        await Message.deleteMany({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ]
        });
        res.status(200).json({ success: true, message: "Chat deleted for both users" });
    } catch(error) {
        console.log("Error deleting chat", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const myId = req.user._id;
        const { messageId } = req.params;
        const { type } = req.body; 

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ success: false, message: "Message not found" });

        if (type === "everyone") {
            if (message.senderId.toString() !== myId.toString()) {
                return res.status(403).json({ success: false, message: "Unauthorized to delete for everyone" });
            }
            await Message.findByIdAndDelete(messageId);
            
            const receiverId = message.senderId.toString() === myId.toString() ? message.receiverId.toString() : message.senderId.toString();
            const receiverSocketId = getReceiverSocketId(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("messageDeleted", messageId);
            }
        } else if (type === "me") {
            if (!message.deletedBy.includes(myId)) {
                message.deletedBy.push(myId);
                await message.save();
            }
        } else {
            return res.status(400).json({ success: false, message: "Invalid delete type" });
        }

        res.status(200).json({ success: true, messageId, type });
    } catch(error) {
        console.log("Error deleting individual message", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
