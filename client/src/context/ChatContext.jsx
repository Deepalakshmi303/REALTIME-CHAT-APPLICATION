import { createContext, useContext, useEffect, useState } from "react";
import { useAuthStore } from "./AuthContext";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const ChatContext = createContext();

export const useChatStore = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [typingUsers, setTypingUsers] = useState([]);
    // unused for now but kept for compatibility
    const [unseenMessages, setUnseenMessages] = useState({});

    const { socket } = useAuthStore();

    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const sendMessage = async (messageData) => {
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if (data.success) {
                setMessages((prevMessages) => [...prevMessages, data.newMessage]);
            } else {
                toast.error(data.message || "Failed to send message");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    const deleteChat = async (userId) => {
        try {
            const { data } = await axios.delete(`/api/messages/delete/${userId}`);
            if (data.success) {
                setMessages([]);
                toast.success("Chat deleted");
            }
        } catch (error) {
            toast.error("Failed to delete chat");
        }
    };

    const deleteIndividualMessage = async (messageId, type) => {
        try {
            const { data } = await axios.delete(`/api/messages/message/${messageId}`, { data: { type } });
            if (data.success) {
                setMessages(prev => prev.filter(msg => msg._id !== messageId));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete message");
        }
    };

    useEffect(() => {
        if (!socket) return;

        const handler = (newMessage) => {
            // If the message is from the currently selected user, add it to chat
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                setMessages((prev) => [...prev, newMessage]);
                // Optional: Mark as seen instantly or when user interacts
                // axios.put(`/api/messages/mark/${newMessage._id}`); 
            } else {
                // Handle notification/unseen count
                toast("New message from " + newMessage.senderId); // Simple notification
            }
        };

        socket.on("newMessage", handler);

        const typingHandler = (userId) => {
            setTypingUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
        };
        const stopTypingHandler = (userId) => {
            setTypingUsers(prev => prev.filter(id => id !== userId));
        };

        socket.on("typing", typingHandler);
        socket.on("stopTyping", stopTypingHandler);

        socket.on("messageDeleted", (messageId) => {
            setMessages(prev => prev.filter(msg => msg._id !== messageId));
        });

        return () => {
            socket.off("newMessage", handler);
            socket.off("typing", typingHandler);
            socket.off("stopTyping", stopTypingHandler);
            socket.off("messageDeleted");
        };
    }, [socket, selectedUser]);

    const value = {
        messages,
        users,
        selectedUser,
        getUsers,
        getMessages,
        sendMessage,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
        typingUsers,
        deleteChat,
        deleteIndividualMessage,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};