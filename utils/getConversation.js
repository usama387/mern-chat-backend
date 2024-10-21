import prisma from "../lib/prisma.js";

// this function fetches all user conversations taking userId either sender or receiver as parameter
export const getConversation = async (userId) => {
    if (!userId) {
        return [];
    }

    //   getting all conversations
    const userConv = await prisma.conversation.findMany({
        where: {
            OR: [
                { senderId: userId },
                { receiverId: userId }
            ],
        },
        include: {
            messages: true,   // Includes the related messages
            sender: true,     // Includes sender details
            receiver: true,   // Includes receiver details
        },
        orderBy: {
            updatedAt: 'desc',  // Sorting by the latest updated
        },
    });

    //   now mapping over conversations to find unseen messages by adding up with reduce method
    const conversation = userConv.map((conv) => {
        const countUnseenMsg = conv.messages.reduce((prev, msg) => {

            // if message is seen 0 is returned otherwise 
            if (msg.msgByUserId !== userId) {
                return prev + (msg.seen ? 0 : 1);
            }
            return prev;
        }, 0);

        // this data will be returned
        return {
            id: conv.id,  // Using 'id' instead of '_id' in Prisma
            sender: conv.sender,
            receiver: conv.receiver,
            unseenMsg: countUnseenMsg,
        };
    });

    return conversation;
};
