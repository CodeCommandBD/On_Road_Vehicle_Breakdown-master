import Integration from "@/lib/db/models/Integration";
import crypto from "crypto";

/**
 * Triggers a webhook for a specific user and event.
 * @param {string} userId - The ID of the user (who owns the integration).
 * @param {string} event - The event name (e.g., 'sos.created').
 * @param {object} payload - The data to send.
 */
export async function triggerWebhook(userId, event, payload) {
  try {
    const integration = await Integration.findOne({
      user: userId,
      isActive: true,
    });

    if (!integration || !integration.webhookUrl) {
      return; // No active integration found
    }

    if (!integration.events.includes(event)) {
      return; // User is not subscribed to this event (simplified logic)
    }

    // Prepare payload
    const data = {
      id: crypto.randomUUID(),
      event: event,
      timestamp: new Date().toISOString(),
      data: payload,
    };

    const jsonPayload = JSON.stringify(data);

    // Create Signature (HMAC SHA256)
    const signature = crypto
      .createHmac("sha256", integration.secret)
      .update(jsonPayload)
      .digest("hex");

    // Send Request
    const response = await fetch(integration.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Event": event,
        "X-Signature": signature,
        "User-Agent": "VehicleBreakdown-Webhook/1.0",
      },
      body: jsonPayload,
    });

    if (!response.ok) {
      console.warn(`Webhook failed for user ${userId}: ${response.statusText}`);
      integration.failures += 1;
      // Disable if too many failures?
      if (integration.failures > 10) {
        integration.isActive = false;
      }
      await integration.save();
    } else {
      // Success
      integration.failures = 0;
      integration.lastTriggeredAt = new Date();
      await integration.save();
    }
  } catch (error) {
    console.error("Webhook Execution Error:", error);
  }
}
