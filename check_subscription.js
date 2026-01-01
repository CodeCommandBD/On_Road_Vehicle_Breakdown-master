import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";

const emailToCheck = "shantokumar00@gmail.com";

async function checkSubscription() {
  try {
    const { default: connectDB } = await import("./lib/db/connect.js");
    const { default: User } = await import("./lib/db/models/User.js");
    const { default: Subscription } = await import(
      "./lib/db/models/Subscription.js"
    );
    const { default: Package } = await import("./lib/db/models/Package.js");

    await connectDB();
    console.log(`\n🔍 Checking subscription for: ${emailToCheck}...`);

    const user = await User.findOne({ email: emailToCheck });

    const result = {
      userFound: !!user,
      userDetails: user
        ? {
            name: user.name,
            role: user.role,
            membershipTier: user.membershipTier,
            points: user.rewardPoints,
            subscriptionId: user.currentSubscription,
          }
        : null,
      subscriptionFound: false,
      subscriptionDetails: null,
      message: "",
    };

    if (user && user.currentSubscription) {
      const subscription = await Subscription.findById(
        user.currentSubscription
      ).populate("planId");

      if (subscription) {
        result.subscriptionFound = true;
        result.subscriptionDetails = {
          planName: subscription.planId?.name || "Unknown",
          status: subscription.status,
          amount: subscription.amount,
          isEnterprise:
            subscription.planId?.name?.toLowerCase().includes("enterprise") ||
            user.membershipTier === "enterprise",
        };
        result.message = result.subscriptionDetails.isEnterprise
          ? "YES, Enterprise plan."
          : "Subscription found, possibly not Enterprise.";
      } else {
        result.message = "Subscription ID exists but document missing.";
      }
    } else if (user) {
      result.message = "No active subscription found.";
      if (user.membershipTier === "enterprise") {
        result.message += " (But has Enterprise tier)";
      }
    }

    if (user) {
      const history = await Subscription.find({ userId: user._id })
        .populate("planId")
        .sort({ createdAt: -1 });
      result.subscriptionHistory = history.map((sub) => ({
        id: sub._id,
        planName: sub.planId?.name || "Unknown", // Use optional chaining to avoid crash if planId is missing
        status: sub.status,
        startDate: sub.startDate,
        endDate: sub.endDate,
        amount: sub.amount,
      }));

      if (result.subscriptionHistory.length > 0) {
        const hasEnterpriseHistory = result.subscriptionHistory.some((sub) =>
          sub.planName?.toLowerCase().includes("enterprise")
        );
        if (hasEnterpriseHistory) {
          result.message += " (Found PAST Enterprise subscription)";
        }
      }
    } else {
      result.message = "User not found!";
    }

    const fs = await import("fs");
    fs.default.writeFileSync("result.json", JSON.stringify(result, null, 2));
    console.log("Result written to result.json");
  } catch (error) {
    console.error("Error:", error);
    const fs = await import("fs");
    fs.default.writeFileSync(
      "result.json",
      JSON.stringify({ error: error.message })
    );
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkSubscription();
