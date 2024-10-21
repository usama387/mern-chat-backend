import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

const getUserByToken = async (token) => {
  if (!token) {
    return {
      message: "token expired",
      logout: true,
    };
  } else {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        profilePic: true,
        // Exclude password from being returned
      },
    });
    
    return user;
  }
};

export default getUserByToken;
