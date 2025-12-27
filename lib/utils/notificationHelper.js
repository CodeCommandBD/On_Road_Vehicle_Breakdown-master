import Notification from "@/lib/db/models/Notification";
import { pusherServer } from "@/lib/pusher";

/**
 * Creates a notification in DB and broadcasts it via Pusher
 * @param {Object} params
 * @param {string} params.recipientId - User ID of the recipient
 * @param {string} params.senderId - User ID of the sender (optional)
 * @param {string} params.type - Type of notification (e.g., 'info', 'success')
 * @param {string} params.title - Title of the notification
 * @param {string} params.message - Body of the notification
 * @param {string} params.link - Detailed link (optional)
 */
export const sendNotification = async ({
  recipientId,
  senderId = null,
  type = "info",
  title,
  message,
  link = null,
}) => {
  try {
    // 1. Create in Database
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      link,
      isRead: false,
    });

    // 2. Broadcast via Pusher (Real-time)
    if (pusherServer) {
      await pusherServer.trigger(`user-${recipientId}`, "notification", {
        message: message, // Toast expects 'message'
        title: title,
        type: type,
        link: link,
        createdAt: notification.createdAt,
      });
    }

    return notification;
  } catch (error) {
    console.error("Notification Send Error:", error);
    return null; // Silent fail to not block main flow
  }
};
