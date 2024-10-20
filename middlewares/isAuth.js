import jwt from "jsonwebtoken";
import { asyncHandler } from "./middleware.js";
import prisma from "../lib/prisma.js";
import ErrorHandler from "../utils/ErrorHandler.js";

export const isAuth = asyncHandler(async (req, res, next) => {

    // destructure token from request
    const { token } = req.cookies;

    if (!token) {
        return next(new ErrorHandler('Please login to access this resource', 401))
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Use Prisma ORM to fetch the user where this token exists
    req.user = await prisma.user.findUnique({
        where: {
            id: decodedData.id,
        },
    });

    if (!req.user) {
        return next(new ErrorHandler('User not found', 404));
    }

    next();
})

