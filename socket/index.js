import express from "express";
import { Server } from "socket.io";
import http from "http";
import prisma from "../lib/prisma.js";
import getUserByToken from "../utils/getUserByToken.js";
import { getConversation } from "../utils/getConversation.js";

// storing express in app to implement socket
const app = express();

// lets create socket connection
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
        credentials: true,
    }
})

// identify online users means a user will not be added again
const onlineUsers = new Set();

// turn on connection from from frontend
io.on("connection", async (socket) => {

    // token is required to identify user
    const token = socket.handshake.auth.token;
    console.log(token, "token");

    const user = await getUserByToken(token);

    // now join room created by socket to add onlineUsers
    socket.join(user?.id?.toString());
    onlineUsers.add(user?.id?.toString())

    // pass the array of online-users to frontend
    io.emit("onlineUser", Array.from(onlineUsers))

    // Message Page when a user is opened from frontend userId is received from frontend with socket.on and based on it user details and messages conversation is sent back to frontend with socket emit
    socket.on("messagePage", async (userId) => {
        const userDetails = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                profilePic: true,
            }
        })

        // now pass all above data in onlineUsers array to see if its online or not
        const data = {
            id: userDetails?.id,
            name: userDetails?.name,
            email: userDetails?.email,
            profilePic: userDetails?.profilePic,
            online: onlineUsers.has(userId),
        };

        // pass this data to backend to check if user is online
        socket.emit("messageUser", data);

        // now we know user is either offline or online, lets load the old chat now
        //  using sender and receiver id
        const getConversationMessages = await prisma.conversation.findFirst({
            where: {
                OR: [
                    { senderId: user?.id, receiverId: userId },
                    { senderId: userId, receiverId: user?.id },
                ],
            },
            include: {
                messages: true,
            },
            orderBy: {
                updatedAt: "desc",
            }
        })

        // now pass these conversation messages to frontend
        socket.emit("message", getConversationMessages?.messages || [])
    })

    // Now send a new message with socket.on and data
    socket.on("newMessage", async (data) => {
        let conversation = await prisma.conversation.findFirst({
            where: {
                OR: [
                    { senderId: data?.sender, receiverId: data?.receiver },
                    { senderId: data?.receiver, receiverId: data?.sender }
                ]
            }
        })

        // if conversation does not exist then create a new
        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    senderId: data?.sender,
                    receiverId: data?.receiver,
                }

            })

        }

        // now let's create the message from the conversation data
        const message = await prisma.message.create({
            data: {
                text: data?.text,
                imageUrl: data?.imageUrl,
                videoUrl: data?.videoUrl,
                msgByUserId: data?.msgByUserId,
                conversationId: data?.conversationId,
            }
        })

        // when message is created update conversation table
        if (message) {
            const updatedConversation = await prisma.conversation.update({
                where: {
                    id: conversation.id
                },
                // pass the message relation in data to add message in conversation table
                data: {
                    messages: {
                        connect: { id: message.id }
                    }
                },
                include: { messages: true },
                orderBy: { updatedAt: "desc" },
            })

            // conversation will be visible to both sender and receiver
            io.to(data?.sender).emit("message", updatedConversation?.messages || []);
            io.to(data?.receiver).emit("message", updatedConversation?.messages || []);

            // Send conversation to frontend
            const sendConv = await getConversation(data?.sender);
            const receiverConv = await getConversation(data?.receiver);

            io.to(data?.sender).emit("conversation", sendConv || []);
            io.to(data?.receiver).emit("conversation", receiverConv || []);
        }
    })

    // Sidebar conversation fetch passing userId as parameter
    socket.on("sidebar", async (userId) => {
        console.log("userId", userId)
        const conversation = await getConversation(userId);
        socket.emit("conversation", conversation);
    });

    // seen messages
    socket.on("seen", async (msgByUser) => {
        const conversation = await prisma.conversation.findFirst({
            where: {
                OR: [
                    { senderId: user?.id, receiverId: msgByUser },
                    { senderId: msgByUser, receiverId: user?.id },
                ],
            },
        })

        const getMessages = conversation?.messages.map(msg => msg.id) || [];

        await prisma.message.updateMany({
            where: {
                id: { in: getMessages },
                msgByUserId: msgByUser,
            },
            data: { seen: true },
        })

        // send conversation to frontend in sidebar
        const sendConv = await getConversation(user?.id?.toString());
        const receiverConv = await getConversation(msgByUser);

        io.to(user?.id?.toString()).emit("conversation", sendConv || []);
        io.to(msgByUser).emit("conversation", receiverConv || []);
    })

    socket.on("disconnect", () => {
        onlineUsers.delete(user?.id?.toString());
    });
})

export { app, server }




