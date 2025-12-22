import axios from "axios";
import Integration from "@/lib/db/models/Integration";
import { connectDB } from "@/lib/db/connect";
import crypto from "crypto";

/**
 * Triggers a webhook for a given user or garage
 * @param {string} event - The event name (e.g., 'sos.created')
 * @param {object} payload - The data to send
 * @param {string} userId - ID of the user (if applicable)
 * @param {string} garageId - ID of the garage (if applicable)
 */
export async function triggerWebhook(
  event,
  payload,
  userId = null,
  garageId = null
) {
  try {
    await connectDB();

    const query = {};
    if (userId) query.user = userId;
    if (garageId) query.garage = garageId;

    if (!userId && !garageId) return;

    const integration = await Integration.findOne({ ...query, isActive: true });

    if (!integration || !integration.webhookUrl) return;

    // Check if the event is enabled
    if (!integration.events.includes(event)) return;

    const timestamp = new Date().toISOString();
    const body = JSON.stringify({
      id: crypto.randomUUID(),
      event,
      timestamp,
      data: payload,
    });

    // Create signature for security
    const signature = crypto
      .createHmac("sha256", integration.secret)
      .update(body)
      .digest("hex");

    // Fire and forget (don't await to avoid slowing down main flow)
    axios
      .post(integration.webhookUrl, body, {
        headers: {
          "Content-Type": "application/json",
          "X-Signature": signature,
          "X-Event": event,
        },
        timeout: 5000,
      })
      .then(async () => {
        await Integration.updateOne(
          { _id: integration._id },
          {
            $set: { lastTriggeredAt: new Date() },
            $inc: { rateLimitCount: 1 },
          }
        );
      })
      .catch(async (err) => {
        console.error(`Webhook failure for ${event}:`, err.message);
        await Integration.updateOne(
          { _id: integration._id },
          { $inc: { failures: 1 } }
        );
      });
  } catch (error) {
    console.error("Error triggering webhook:", error);
  }
}
