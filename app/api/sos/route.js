import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import SOS from "@/lib/db/models/SOS";
import Garage from "@/lib/db/models/Garage";
import Notification from "@/lib/db/models/Notification";
import User from "@/lib/db/models/User";
import PointsRecord from "@/lib/db/models/PointsRecord";
import Subscription from "@/lib/db/models/Subscription";
import Plan from "@/lib/db/models/Plan";
import { verifyToken } from "@/lib/utils/auth";
import {
  sendSOSEmail,
  sendAssignmentEmail,
  sendQuotaWarningEmail,
  sendWelcomeEmail,
} from "@/lib/utils/email";
import { triggerWebhook } from "@/lib/utils/webhook";
import mongoose from "mongoose";

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login again." },
        { status: 401 }
      );
    }

    const { latitude, longitude, address, phone, vehicleType } = body;

    // Validation
    if (!latitude || !longitude || !phone) {
      return NextResponse.json(
        { success: false, message: "Location and phone are required" },
        { status: 400 }
      );
    }

    // --- SUBSCRIPTION & LIMIT CHECK ---
    let subscription = await Subscription.findOne({
      userId: decoded.userId,
      status: { $in: ["active", "trial"] },
    }).populate("planId");

    let hasAccess = false;
    let plan = null;

    // Auto-create Free Plan subscription if user doesn't have one
    if (!subscription) {
      try {
        // Find the free/trial plan
        const freePlan = await Plan.findOne({
          tier: { $in: ["free", "trial"] },
        }).sort({ tier: 1 });

        if (freePlan) {
          // Create a free subscription automatically
          const now = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 30); // 30 days free access

          subscription = await Subscription.create({
            userId: decoded.userId,
            planId: freePlan._id,
            status: freePlan.tier === "trial" ? "trial" : "active",
            billingCycle: "monthly",
            startDate: now,
            endDate: endDate,
            amount: 0,
            usage: {
              serviceCallsUsed: 0,
              lastServiceCallDate: null,
            },
          });

          // Manually assign the plan object (instead of re-querying)
          subscription.planId = freePlan;
          plan = freePlan;

          console.log(
            `✅ Auto-created ${freePlan.tier} subscription for user: ${decoded.userId}`
          );
        } else {
          // No free plan found in database
          return NextResponse.json(
            {
              success: false,
              message: "No service plans available. Please contact support.",
            },
            { status: 500 }
          );
        }
      } catch (autoSubError) {
        console.error("Failed to auto-create subscription:", autoSubError);
        return NextResponse.json(
          {
            success: false,
            message:
              "Unable to process request. Please try again or contact support.",
          },
          { status: 500 }
        );
      }
    } else {
      // Subscription exists, get the plan
      plan = subscription.planId;

      // Fix corrupted subscription (planId is null)
      if (!plan) {
        console.warn(
          "⚠️ Found subscription with null planId, attempting to fix..."
        );
        try {
          // Determine plan based on amount or status
          let planToAssign;

          if (subscription.status === "trial" || subscription.amount === 0) {
            // Trial or free
            planToAssign = await Plan.findOne({
              tier: { $in: ["trial", "free"] },
            }).sort({ tier: 1 });
          } else {
            // Find plan by amount
            planToAssign = await Plan.findOne({
              $or: [
                { "pricing.monthly": subscription.amount },
                { "pricing.yearly": subscription.amount },
              ],
            });

            // If not found by amount, default to standard plan
            if (!planToAssign) {
              planToAssign = await Plan.findOne({ tier: "standard" });
            }
          }

          if (planToAssign) {
            // Update the subscription
            subscription.planId = planToAssign._id;
            await subscription.save();

            // Assign plan for current request
            plan = planToAssign;
            console.log(`✅ Fixed subscription planId: ${planToAssign.tier}`);
          } else {
            console.error(
              "❌ No plans available in database to fix subscription"
            );
            return NextResponse.json(
              {
                success: false,
                message: "Service configuration error. Please contact support.",
              },
              { status: 500 }
            );
          }
        } catch (fixError) {
          console.error("Failed to fix subscription:", fixError);
          return NextResponse.json(
            {
              success: false,
              message: "Service configuration error. Please try again.",
            },
            { status: 500 }
          );
        }
      }
    }

    // Double check if plan is populated
    if (!plan) {
      console.error("Plan not populated for subscription:", subscription);
      return NextResponse.json(
        {
          success: false,
          message: "Service configuration error. Please try again.",
        },
        { status: 500 }
      );
    }

    const limit = plan.limits?.serviceCalls ?? 1; // Default to 1 if missing
    const used = subscription.usage?.serviceCallsUsed || 0;
    // ----------------------------------

    // Check Limit
    if (limit !== -1 && used >= limit) {
      return NextResponse.json(
        {
          success: false,
          message: `You have reached your limit of ${limit} requests. Upgrade for unlimited access!`,
          action: "/pricing",
        },
        { status: 403 }
      );
    }
    // ----------------------------------

    // --- CALCULATE SLA & PRIORITY ---
    const planTier = plan.tier || "free";
    let priority = "normal";
    let slaMinutes = 60; // Default Standard

    if (planTier === "enterprise") {
      priority = "critical";
      slaMinutes = 5;
    }

    const slaDeadline = new Date(Date.now() + slaMinutes * 60000);
    // --------------------------------

    const sosAlert = await SOS.create({
      user: decoded.userId,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
        address: address || "Location from GPS",
      },
      phone,
      vehicleType: vehicleType || "other",
      status: "pending",
      priority,
      slaDeadline,
    });

    // --- INCREMENT USAGE & TRIGGER WARNINGS ---
    try {
      subscription.usage.serviceCallsUsed = used + 1;
      subscription.usage.lastServiceCallDate = new Date();
      await subscription.save();

      // Psychological Trigger: Quota Warning
      // If limited plan (not -1) and usage is high (>= 50% or <= 1 left)
      if (limit !== -1) {
        const remaining = limit - (used + 1);
        if (remaining === 1 || (used + 1) / limit >= 0.5) {
          // Send warning email
          const userObj = await User.findById(decoded.userId);
          if (userObj?.email) {
            sendQuotaWarningEmail(userObj.email, userObj.name, remaining);
          }
        }
      }
    } catch (err) {
      console.error("Error updating usage:", err);
    }
    // ------------------------------------------

    // --- TRIGGER WEBHOOK (Fire & Forget) ---
    try {
      await triggerWebhook(decoded.userId, "sos.created", {
        sosId: sosAlert._id,
        location: sosAlert.location,
        status: sosAlert.status,
        vehicleType: sosAlert.vehicleType,
        createdAt: sosAlert.createdAt,
      });
    } catch (webhookErr) {
      console.error("Webhook trigger failed (non-blocking):", webhookErr);
    }
    // ---------------------------------------

    // --- SEARCH LOGIC UPDATED FOR COVERAGE LIMITS ---
    const serviceRadiusKm = plan.limits?.serviceRadius || 5; // Default 5km if missing

    // If radius is huge (e.g., > 10000 km), it's "Nationwide" -> Find all active garages
    // Else, use Geospatial query
    const isNationwide = serviceRadiusKm > 10000;

    let garageQuery = { isActive: true }; // Base query

    if (!isNationwide) {
      garageQuery.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: serviceRadiusKm * 1000, // Convert km to meters
        },
      };
    }

    // Create notifications and send emails
    try {
      const user = await User.findById(decoded.userId);
      // Execute the query
      const garages = await Garage.find(garageQuery).populate("owner");

      const emailPromises = garages.map((g) => {
        if (g.owner?.email) {
          return sendSOSEmail(g.owner.email, {
            userName: user?.name || "A User",
            location: address || "GPS Location",
            phone: phone,
            vehicleType: vehicleType,
          });
        }
        return null;
      });

      const notificationPromises = garages.map((g) =>
        Notification.create({
          recipient: g.owner?._id || g.owner,
          type: "system_alert",
          title: `🚨 ${
            priority === "critical" ? "URGENT VIP" : "EMERGENCY"
          } SOS ALERT`,
          message: `${user?.name || "A user"} (${
            priority === "critical" ? "VIP" : "User"
          }) needs help! Deadline: ${slaMinutes}m.`,
          link: `/garage/sos-navigation/${sosAlert._id}`,
        })
      );

      // Also notify all admins
      const admins = await User.find({ role: "admin" }).select("_id");
      const adminNotificationPromises = admins.map((admin) =>
        Notification.create({
          recipient: admin._id,
          type: "system_alert",
          title: "🚨 GLOBAL SOS ALERT",
          message: `${user?.name || "A user"} reported an emergency: ${
            address || "GPS Location"
          }`,
          link: `/admin/dashboard`, // Admin sees all SOS in dashboard
        })
      );

      await Promise.all([
        ...notificationPromises,
        ...adminNotificationPromises,
        ...emailPromises,
      ]);
    } catch (notifyErr) {
      console.error("Failed to send SOS alerts:", notifyErr);
    }

    return NextResponse.json({
      success: true,
      data: sosAlert,
      message: "Emergency alert sent successfully. Help is on the way!",
    });
  } catch (error) {
    console.error("============ SOS POST Error ============");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    console.error("Error:", error);
    console.error("========================================");

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const query = {};

    // Role-based filtering
    if (decoded.role === "admin") {
      if (status)
        query.status = status.includes(",")
          ? { $in: status.split(",") }
          : status;
    } else if (decoded.role === "garage") {
      const garage = await Garage.findOne({ owner: decoded.userId });
      if (!garage) {
        return NextResponse.json(
          { success: false, message: "Garage not found" },
          { status: 404 }
        );
      }

      if (status) {
        const statuses = status.split(",");
        const orConditions = [];

        // Common status like 'pending' (anyone in role can see)
        const generalStatuses = statuses.filter(
          (s) => s !== "assigned" && s !== "resolved"
        );
        if (generalStatuses.length > 0) {
          orConditions.push({ status: { $in: generalStatuses } });
        }

        // Sensitive status like 'assigned' or 'resolved' (only see my own)
        if (statuses.includes("assigned")) {
          orConditions.push({ status: "assigned", assignedGarage: garage._id });
        }
        if (statuses.includes("resolved")) {
          orConditions.push({ status: "resolved", assignedGarage: garage._id });
        }

        if (orConditions.length > 0) {
          query.$or = orConditions;
        }
      }
    } else {
      // User can only see their own
      query.user = decoded.userId;
      if (status) {
        query.status = status.includes(",")
          ? { $in: status.split(",") }
          : status;
      } else {
        query.status = { $ne: "cancelled" }; // Default for user
      }
    }

    const alerts = await SOS.find(query)
      .populate("user", "name phone email")
      .populate("assignedGarage", "name phone location")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error("CRITICAL SOS GET ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please login again." },
        { status: 401 }
      );
    }

    const { sosId, status, garageId } = await request.json();

    if (!sosId) {
      return NextResponse.json(
        { success: false, message: "SOS ID is required" },
        { status: 400 }
      );
    }

    const sos = await SOS.findById(sosId);
    if (!sos) {
      return NextResponse.json(
        { success: false, message: "SOS alert not found" },
        { status: 404 }
      );
    }

    // Role-based logic
    if (decoded.role === "admin") {
      // Admin can assign, resolve, or cancel
      if (status) sos.status = status;
      if (garageId) {
        sos.assignedGarage = garageId;
        sos.status = "assigned";
        sos.assignedAt = new Date();

        // Send Email to the assigned garage
        try {
          const garage = await Garage.findById(garageId).populate("owner");
          const user = await User.findById(sos.user);
          if (garage && garage.owner?.email) {
            await sendAssignmentEmail(garage.owner.email, garage.name, {
              userName: user?.name || "User",
              location: sos.location?.address || "Location",
              phone: sos.phone,
            });
          }
        } catch (err) {
          console.error("Assignment email error:", err);
        }
      }
      if (status === "resolved") {
        sos.status = "resolved";
        sos.resolvedAt = new Date();

        // Award points on resolution (Admin manual resolution)
        try {
          // Resolve points for Garage Owner
          if (sos.assignedGarage) {
            const garage = await Garage.findById(sos.assignedGarage);
            if (garage) {
              const garageOwner = await User.findById(garage.owner);
              if (garageOwner) {
                garageOwner.rewardPoints =
                  (garageOwner.rewardPoints || 0) + 100;
                await garageOwner.save();
              }
              await PointsRecord.create({
                user: garage.owner,
                points: 100,
                type: "earn",
                reason: "Resolved emergency SOS (Admin-mediated)",
                metadata: { sosId: sos._id },
              });

              await Notification.create({
                recipient: garage.owner,
                type: "system_alert",
                title: "🏆 Hero Points Alert!",
                message:
                  "You've been rewarded 100 points for resolving an emergency SOS!",
                link: `/garage/sos-navigation/${sos._id}`,
              });
            }
          }

          // Small reward for User too
          const userObj = await User.findById(sos.user);
          if (userObj) {
            userObj.rewardPoints = (userObj.rewardPoints || 0) + 20;
            await userObj.save();
          }
          await PointsRecord.create({
            user: sos.user,
            points: 20,
            type: "earn",
            reason: "Emergency SOS resolved",
            metadata: { sosId: sos._id },
          });
        } catch (pointsErr) {
          console.error("SOS points error:", pointsErr);
        }
      }
    } else if (decoded.role === "garage") {
      // Garage can only accept if it's pending, or mark as resolved if assigned to them
      const garage = await Garage.findOne({ owner: decoded.userId });
      if (!garage) {
        return NextResponse.json(
          { success: false, message: "Garage profile not found" },
          { status: 404 }
        );
      }

      if (status === "assigned") {
        if (sos.status !== "pending") {
          return NextResponse.json(
            { success: false, message: "This alert has already been taken" },
            { status: 400 }
          );
        }
        sos.assignedGarage = garage._id;
        sos.status = "assigned";
        sos.assignedAt = new Date();
      } else if (status === "resolved") {
        if (
          !sos.assignedGarage ||
          sos.assignedGarage.toString() !== garage._id.toString()
        ) {
          return NextResponse.json(
            { success: false, message: "You are not assigned to this alert" },
            { status: 403 }
          );
        }
        sos.status = "resolved";
        sos.resolvedAt = new Date();

        // Award points on resolution (Garage resolution)
        try {
          // Resolve points for Garage Owner (the one who's logged in)
          const garageOwner = await User.findById(decoded.userId);
          if (garageOwner) {
            garageOwner.rewardPoints = (garageOwner.rewardPoints || 0) + 100;
            await garageOwner.save();
          }
          await PointsRecord.create({
            user: decoded.userId,
            points: 100,
            type: "earn",
            reason: "Resolved emergency SOS",
            metadata: { sosId: sos._id },
          });

          await Notification.create({
            recipient: decoded.userId,
            type: "system_alert",
            title: "🏆 Hero Points Earned!",
            message:
              "Outstanding! You earned 100 points for resolving an emergency SOS.",
            link: `/garage/sos-navigation/${sos._id}`,
          });

          // Small reward for User
          const userObj = await User.findById(sos.user);
          if (userObj) {
            userObj.rewardPoints = (userObj.rewardPoints || 0) + 20;
            await userObj.save();
          }
          await PointsRecord.create({
            user: sos.user,
            points: 20,
            type: "earn",
            reason: "Emergency SOS resolved",
            metadata: { sosId: sos._id },
          });
        } catch (pointsErr) {
          console.error("SOS points error (garage):", pointsErr);
        }
      } else {
        return NextResponse.json(
          { success: false, message: "Forbidden transition for garage role" },
          { status: 403 }
        );
      }
    } else {
      // User can cancel their own SOS
      if (status === "cancelled") {
        if (sos.user.toString() !== decoded.userId) {
          return NextResponse.json(
            { success: false, message: "Unauthorized to cancel" },
            { status: 403 }
          );
        }
        sos.status = "cancelled";
      } else {
        return NextResponse.json(
          { success: false, message: "Unauthorized action" },
          { status: 403 }
        );
      }
    }

    await sos.save();

    return NextResponse.json({
      success: true,
      message: `SOS alert updated to ${sos.status}`,
      data: sos,
      action: status === "cancelled" ? "cancelled" : undefined,
    });
  } catch (error) {
    console.error("SOS PATCH error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
