import Integration from "@/lib/db/models/Integration";
import { connectDB } from "@/lib/db/connect";
import crypto from "crypto";

/**
 * Core function to send a webhook (Slack or Generic)
 */
export async function sendWebhook(
  webhookUrl,
  secret,
  event,
  payload,
  options = {}
) {
  const { payloadFormat = "slack" } = options;
  try {
    if (!webhookUrl) {
      console.warn(`[Webhook] No URL provided for event: ${event}`);
      return;
    }
    console.log(`[Webhook] Sending ${event} to ${webhookUrl}`);

    // Prepare payload
    const isSlackWebhook = webhookUrl.includes("hooks.slack.com");
    let requestBody;

    // Use Slack format ONLY if format is 'slack' AND it's a Slack URL
    // OR if format is 'slack' (we try to send Slack format to generic URLs too if requested)
    if (payloadFormat === "slack") {
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
                text: `*User:*\n${sosData.user?.name || "Unknown User"}`,
              },
              {
                type: "mrkdwn",
                text: `*Phone:*\n${sosData.user?.phone || "Not Provided"}`,
              },
              {
                type: "mrkdwn",
                text: `*Status:*\n${sosData.status || "pending"}`,
              },
              {
                type: "mrkdwn",
                text: `*Vehicle:*\n${sosData.vehicleType || "N/A"}`,
              },
              {
                type: "mrkdwn",
                text: `*Location:*\n${location}`,
              },
              {
                type: "mrkdwn",
                text: `*Event:*\n${event}`,
              },
            ],
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*SOS ID:* ${sosData.sosId}\n*Time:* ${new Date(
                sosData.createdAt || Date.now()
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
      requestBody = JSON.stringify({
        id: crypto.randomUUID(),
        event,
        timestamp: new Date().toISOString(),
        data: payload,
      });
    }

    const signature = secret
      ? crypto.createHmac("sha256", secret).update(requestBody).digest("hex")
      : null;

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Event": event,
        ...(signature && { "X-Signature": signature }),
        "User-Agent": "VehicleBreakdown-Webhook/1.0",
      },
      body: requestBody,
    });

    if (!response.ok) {
      console.error(
        `[Webhook] Failed: ${response.status} ${response.statusText}`
      );
      const errorText = await response.text();
      console.error(`[Webhook] Response: ${errorText}`);
    } else {
      console.log(`[Webhook] Success: ${response.status}`);
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      requestBody,
    };
  } catch (error) {
    console.error("sendWebhook error:", error);
    return { ok: false, error: error.message, status: 500 };
  }
}

/**
 * Helper to log results into the integration model
 */
export async function logResult(integration, event, result, payload) {
  if (!integration) return;

  const logEntry = {
    event,
    status: result.ok ? "success" : "failed",
    statusCode: result.status,
    message: result.ok ? "Delivered" : result.error || result.statusText,
    timestamp: new Date(),
    payload: result.requestBody ? JSON.parse(result.requestBody) : payload,
  };

  // Update success/failure counts
  if (result.ok) {
    integration.failures = 0;
    integration.successCount = (integration.successCount || 0) + 1;
    integration.lastTriggeredAt = new Date();
  } else {
    integration.failures = (integration.failures || 0) + 1;
    if (integration.failures > 10) integration.isActive = false;
  }

  // Manage logs array (keep last 10)
  integration.logs = [logEntry, ...(integration.logs || [])].slice(0, 10);

  await integration.save();
}

/**
 * Triggers a webhook for a specific user.
 */
export async function triggerWebhook(userId, event, payload, garageId = null) {
  try {
    await connectDB();
    const query = { isActive: true };
    if (garageId) {
      query.garage = garageId;
    } else if (userId) {
      query.user = userId;
    } else {
      return;
    }

    const integration = await Integration.findOne(query);

    if (!integration || !integration.webhookUrl) {
      console.warn(`[Webhook] No active integration found for user ${userId}`);
      return;
    }
    if (!integration.events.includes(event)) return;

    // Rate Limiting
    const now = new Date();
    if (now > integration.rateLimitResetAt) {
      integration.rateLimitCount = 0;
      integration.rateLimitResetAt = new Date(now.getTime() + 60000);
    }

    if (integration.rateLimitCount >= 60) {
      console.warn(`Rate limit exceeded for user ${userId}`);
      return;
    }

    integration.rateLimitCount += 1;

    const result = await sendWebhook(
      integration.webhookUrl,
      integration.secret,
      event,
      payload,
      { payloadFormat: integration.payloadFormat }
    );

    await logResult(integration, event, result, payload);
  } catch (error) {
    console.error("triggerWebhook error:", error);
  }
}

/**
 * Triggers a webhook for an organization.
 */
export async function triggerOrganizationWebhook(
  organizationId,
  event,
  payload
) {
  try {
    await connectDB();
    const Organization = (await import("@/lib/db/models/Organization")).default;
    const org = await Organization.findById(organizationId);

    if (!org) {
      console.warn(`[Webhook] Organization not found: ${organizationId}`);
      return;
    }

    // 1. Try Organization-specific Webhook
    if (org.settings?.webhookUrl && org.settings?.webhookActive) {
      if (
        !org.settings.webhookEvents ||
        org.settings.webhookEvents.includes(event)
      ) {
        console.log(
          `[Webhook] Triggering org webhook for ${org.name} (${organizationId})`
        );
        const result = await sendWebhook(
          org.settings.webhookUrl,
          org.settings.webhookSecret,
          event,
          payload,
          { payloadFormat: "slack" }
        );

        // Track results in owner's integration if it exists
        const ownerIntegration = await Integration.findOne({
          user: org.owner,
          isActive: true,
        });
        if (ownerIntegration) {
          await logResult(ownerIntegration, event, result, payload);
        }
        return;
      }
    }

    // 2. Fallback to Owner's Personal Integration
    console.log(
      `[Webhook] Org ${org.name} has no active webhook. Checking owner fallback...`
    );
    const ownerIntegration = await Integration.findOne({
      user: org.owner,
      isActive: true,
    });

    if (
      ownerIntegration &&
      ownerIntegration.webhookUrl &&
      ownerIntegration.events.includes(event)
    ) {
      console.log(
        `[Webhook] Using owner fallback integration for org: ${org.name} (Owner: ${org.owner})`
      );
      const result = await sendWebhook(
        ownerIntegration.webhookUrl,
        ownerIntegration.secret,
        event,
        payload,
        { payloadFormat: ownerIntegration.payloadFormat }
      );
      await logResult(ownerIntegration, event, result, payload);
      return;
    }

    console.warn(
      `[Webhook] Webhook not configured or inactive for org: ${org.name} (and no owner fallback found)`
    );
  } catch (error) {
    console.error("triggerOrganizationWebhook error:", error);
  }
}

/**
 * Global SOS notification for all admins/system integrations.
 */
export async function triggerGlobalSOSWebhooks(event, payload) {
  try {
    await connectDB();
    const User = (await import("@/lib/db/models/User")).default;
    // Notify all active integrations owned by Admins
    const adminUsers = await User.find({ role: "admin" }).select("_id");
    const adminIds = adminUsers.map((u) => u._id);

    const integrations = await Integration.find({
      user: { $in: adminIds },
      isActive: true,
      events: event,
    });

    console.log(`Sending global webhooks to ${integrations.length} admins`);

    const promises = integrations.map((integration) =>
      sendWebhook(integration.webhookUrl, integration.secret, event, payload, {
        payloadFormat: integration.payloadFormat,
      }).then(async (result) => {
        await logResult(integration, event, result, payload);
      })
    );

    await Promise.all(promises);
  } catch (error) {
    console.error("triggerGlobalSOSWebhooks error:", error);
  }
}
