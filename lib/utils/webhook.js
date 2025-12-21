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

    // ============================================
    // RATE LIMITING CHECK
    // ============================================
    const now = new Date();
    const RATE_LIMIT = 60; // Max 60 requests per minute

    // Reset counter if time window expired
    if (now > integration.rateLimitResetAt) {
      integration.rateLimitCount = 0;
      integration.rateLimitResetAt = new Date(now.getTime() + 60000); // Next minute
    }

    // Check if rate limit exceeded
    if (integration.rateLimitCount >= RATE_LIMIT) {
      console.warn(
        `⚠️ Rate limit exceeded for user ${userId}. Blocked webhook.`
      );
      return; // Block the webhook
    }

    // Increment counter
    integration.rateLimitCount += 1;
    // ============================================

    // ============================================
    // PREPARE PAYLOAD - Slack Compatible Format
    // ============================================

    // Check if URL is Slack webhook
    const isSlackWebhook = integration.webhookUrl.includes("hooks.slack.com");

    let requestBody;

    if (isSlackWebhook) {
      // Format for Slack
      const sosData = payload.data || payload;
      const location =
        sosData.location?.address ||
        `${sosData.location?.coordinates?.[1]}, ${sosData.location?.coordinates?.[0]}` ||
        "Unknown Location";

      requestBody = JSON.stringify({
        text: "🚨 EMERGENCY SOS ALERT",
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "🚨 EMERGENCY SOS ALERT",
              emoji: true,
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Event:*\n${event}`,
              },
              {
                type: "mrkdwn",
                text: `*Status:*\n${sosData.status || "pending"}`,
              },
              {
                type: "mrkdwn",
                text: `*Location:*\n${location}`,
              },
              {
                type: "mrkdwn",
                text: `*Vehicle:*\n${sosData.vehicleType || "N/A"}`,
              },
            ],
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*SOS ID:* ${sosData.sosId}\n*Time:* ${new Date(
                sosData.createdAt
              ).toLocaleString("en-US", { timeZone: "Asia/Dhaka" })}`,
            },
          },
          {
            type: "divider",
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `Event ID: ${crypto.randomUUID()}`,
              },
            ],
          },
        ],
      });
    } else {
      // Generic webhook format (webhook.site, Discord, etc.)
      const data = {
        id: crypto.randomUUID(),
        event: event,
        timestamp: new Date().toISOString(),
        data: payload,
      };
      requestBody = JSON.stringify(data);
    }
    // ============================================

    // Create Signature (HMAC SHA256)
    const signature = crypto
      .createHmac("sha256", integration.secret)
      .update(requestBody)
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
      body: requestBody,
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
