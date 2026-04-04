import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
        }

        const user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ success: false, message: "Email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
        });

        if (newUser) {
            // Clean generation of token
            await newUser.save();
            const token = generateToken(newUser._id); // Assume this utils returns a string token

            return res.status(201).json({
                success: true,
                user: {
                    _id: newUser._id,
                    fullName: newUser.fullName,
                    email: newUser.email,
                    profilePic: newUser.profilePic,
                },
                token,
                message: "Account created successfully"
            });
        } else {
            return res.status(400).json({ success: false, message: "Invalid user data" });
        }
    } catch (error) {
        console.log("Error in signup controller", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                profilePic: user.profilePic,
            },
            token,
            message: "Logged in successfully"
        });
    } catch (error) {
        console.log("Error in login controller", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const logout = (req, res) => {
    // Since we use headers (stateless on server side mostly), client just discards token.
    // But if we used cookies, we'd clear them here.
    res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const checkAuth = (req, res) => {
    try {
        res.status(200).json({ success: true, user: req.user });
    } catch (error) {
        console.log("Error in checkAuth controller", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body;
        const userId = req.user._id;

        if (!profilePic) {
            return res.status(400).json({ success: false, message: "Profile pic is required" });
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic); // Base64 supported
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: uploadResponse.secure_url },
            { new: true }
        ).select("-password");

        res.status(200).json({ success: true, user: updatedUser });
    } catch (error) {
        console.log("error in update profile:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and new password are required" });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ success: true, message: "Password reset successfully" });
    } catch (error) {
        console.log("Error in forgotPassword controller", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const userId = req.user._id;
        
        await Message.deleteMany({
            $or: [{ senderId: userId }, { receiverId: userId }]
        });

        await User.findByIdAndDelete(userId);

        res.status(200).json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
        console.log("Error in deleteUser controller", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
