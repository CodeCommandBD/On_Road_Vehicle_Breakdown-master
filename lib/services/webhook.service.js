import WebhookSubscription from "@/lib/db/models/WebhookSubscription";
import crypto from "crypto";

export async function dispatchWebhook(event, payload) {
  try {
    // 1. Find subscribers
    const subscribers = await WebhookSubscription.find({
      events: event,
      isActive: true,
    });

    if (subscribers.length === 0) return;

    // 2. Prepare payload
    const timestamp = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({
      id: crypto.randomUUID(),
      timestamp,
      event,
      data: payload,
    });

    // 3. Dispatch to all (Async - Fire and Forget)
    subscribers.forEach(async (sub) => {
      try {
        // Sign payload
        const signature = crypto
          .createHmac("sha256", sub.secret)
          .update(body)
          .digest("hex");

        await fetch(sub.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Timestamp": timestamp.toString(),
          },
          body,
        });
        console.log(`Webhook sent to ${sub.url} for event ${event}`);
      } catch (err) {
        console.error(`Webhook failed for ${sub.url}:`, err.message);
      }
    });
  } catch (error) {
    console.error("Webhook dispatch error:", error);
  }
}
