import firebaseDb from "../config/firebase.js";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import admin from "firebase-admin"; // Make sure firebase-admin is installed

export const sendMessage = async (req, res) => {
  const { senderId, receiverIds, content, imageUrl } = req.body;

  console.log("This is the request body:", req.body);

  try {
    const message = await Message.create({
      senderId,
      receiverIds,
      imageUrl,
      content,
      isRead: false,
    });

    // Create Firebase entries for each receiver
    for (const receiverId of receiverIds) {
      const countRef = firebaseDb.ref(
        `unread_messages/${receiverId}/${senderId}`
      );
      await countRef.transaction((currentCount) => {
        return (currentCount || 0) + 1;
      });

      await firebaseDb.ref(`chats/${receiverId}`).push().set({
        id: message._id.toString(),
        senderId,
        receiverIds,
        imageUrl,
        content,
        timestamp: Date.now(),
        isRead: false,
      });

      const userToken = await getUserFCMToken(receiverId);
      if (userToken) {
        //Get sender name for the notification
        const sender = await User.findById(senderId);
        const senderName = sender ? sender.name : "Someone";

        await admin.messaging().send({
          token: userToken,
          notification: {
            title: `New Suggestion from ${senderName}`,
            body: content || "You have a new suggestion",
          },
          data: {
            senderId: senderId,
            type: "suggestion",
            imageUrl: imageUrl || "",
          },
          android: {
            priority: "high",
          },
          apns: {
            payload: { aps: { contentAvailable: true } },
          },
        });
      }
    }

    res.status(200).json({ success: true, message });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ success: false, error: "Failed to send message" });
  }
};

async function getUserFCMToken(userId) {
  const user = await User.findById(userId);
  return user ? user.fcmToken : null;
}
