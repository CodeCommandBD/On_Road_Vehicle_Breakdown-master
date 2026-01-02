import PusherServer from "pusher";
import PusherClient from "pusher-js";

// Validate Pusher configuration
const PUSHER_APP_ID = process.env.PUSHER_APP_ID;
const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
const PUSHER_SECRET = process.env.PUSHER_SECRET;
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2";

// Check if Pusher is configured
const isPusherConfigured = PUSHER_APP_ID && PUSHER_KEY && PUSHER_SECRET;

if (!isPusherConfigured) {
  console.warn(
    "⚠️ Pusher is not configured. Real-time features will be disabled. " +
      "Set PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY, and PUSHER_SECRET in .env.local"
  );
}

export const pusherServer = isPusherConfigured
  ? new PusherServer({
      appId: PUSHER_APP_ID,
      key: PUSHER_KEY,
      secret: PUSHER_SECRET,
      cluster: PUSHER_CLUSTER,
      useTLS: true,
    })
  : null;

export const pusherClient =
  typeof window !== "undefined" && isPusherConfigured
    ? new PusherClient(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
      })
    : null;
