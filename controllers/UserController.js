import prisma from "../lib/prisma.js";
import { asyncHandler } from "../middlewares/middleware.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import sendToken from "../utils/sendToken.js";

// function to generate jwt token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

// controller for user register
export const registerUser = asyncHandler(async (req, res) => {

    // destructuring required data form request body
    const { name, email, password, profilePic } = req.body;

    // verify email if it already exists
    const verifyEmail = await prisma.user.findUnique({
        where: {
            email
        }
    })

    if (verifyEmail) {
        return res.status(400).json({
            message: "User already exists",
            error: true,
        })
    }

    // now hashing the password
    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(password, salt);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashPassword,
            profilePic,
        }
    })

    // Generate JWT token
    const token = generateToken(user.id);

    return res.status(201).json({
        message: "User Registered successfully",
        user,
        token,
        success: true,
    })
})


// controller for user login
export const login = asyncHandler(async (req, res) => {

    // destructure user credentials from req body
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user) {
        return res.status(400).json({
            message: 'User does not exist',
            error: true,
        });
    }

    // else verify the password
    const verifyPassword = await bcryptjs.compare(password, user.password);

    if (!verifyPassword) {
        return res.status(400).json({
            message: "Incorrect Password",
            error: true,
        })
    }

    sendToken(user, 201, res)
})

// controller for user logout
export const logout = asyncHandler(async (req, res) => {

    const cookieOptions = {
        http: true,
        secure: true,
        samesite: "None",
    };

    return res.cookie("token", "", cookieOptions).status(200).json({
        message: "logged out successfully",
        success: true,
    })
})

// controller to get user details using its token
export const getUserDetails = asyncHandler(async (req, res) => {
    return res.status(200).json({
        message: "User details",
        user: req.user,
        success: true,
    })
})

// controller to update user
export const updateUser = asyncHandler(async (req, res) => {

    const { userId, name, profilePic } = req.body;

    const updateUserNow = await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            name,
            profilePic,
        }
    })

    if (updateUserNow) {

        // fetch updated user details
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            }
        })
        return res.status(200).json({
            message: "User updated successfully",
            success: true,
            user,
        })
    } else {
        return res.status(400).json({
            message: "User not updated",
            error: true,
        })
    }
})


// controller to search the user with name or email
export const searchUser = asyncHandler(async (req, res) => {
    const { search } = req.body;

    // Build search conditions based on `search` input
    const searchConditions = search?.trim()
        ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ]
        }
        : {}; // Empty conditions return all users

    try {
        const users = await prisma.user.findMany({
            where: searchConditions,
            select: {
                password: false,
                id: true,
                name: true,
                email: true,
                profilePic: true,
            }
        });

        res.status(200).json({
            message: "Users fetched successfully",
            users,
            success: true,
        });
    } catch (error) {
        res.status(500).json({
            message: "An error occurred while searching for users",
            success: false,
            error: error.message
        });
    }
});
