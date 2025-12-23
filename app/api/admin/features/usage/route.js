import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Garage from "@/lib/db/models/Garage";

export async function GET(request) {
  try {
    await connectDB();

    // Get all users and garages
    const users = await User.find({}).lean();
    const garages = await Garage.find({}).lean();

    // Initialize feature tracking
    const featureUsage = {
      analytics: { total: 0, premium: 0, enterprise: 0 },
      aiMechanic: { total: 0, premium: 0, enterprise: 0 },
      crm: { total: 0, premium: 0, enterprise: 0 },
      teamManagement: { total: 0, premium: 0, enterprise: 0 },
      automation: { total: 0, premium: 0, enterprise: 0 },
      reports: { total: 0, premium: 0, enterprise: 0 },
    };

    // Tier distribution
    const tierDistribution = {
      user: { free: 0, trial: 0, standard: 0, premium: 0, enterprise: 0 },
      garage: { free: 0, trial: 0, standard: 0, premium: 0, enterprise: 0 },
    };

    // Track users
    users.forEach((user) => {
      const tier = user.membershipTier || user.planTier || "free";
      tierDistribution.user[tier] = (tierDistribution.user[tier] || 0) + 1;

      // Check feature access based on tier
      if (tier === "premium" || tier === "enterprise") {
        // These users have access to premium features
        // In real implementation, you'd check actual usage from logs/analytics

        // For now, assume users with premium+ tiers are using features
        if (user.hasUsedAnalytics) featureUsage.analytics[tier]++;
        if (user.hasUsedAIMechanic) featureUsage.aiMechanic[tier]++;
        if (user.hasUsedCRM) featureUsage.crm[tier]++;
        if (user.teamMembers?.length > 0) featureUsage.teamManagement[tier]++;
        if (user.automations?.length > 0) featureUsage.automation[tier]++;
      }
    });

    // Track garages
    garages.forEach((garage) => {
      const tier = garage.membershipTier || garage.planTier || "free";
      tierDistribution.garage[tier] = (tierDistribution.garage[tier] || 0) + 1;

      if (tier === "premium" || tier === "enterprise") {
        if (garage.hasUsedAnalytics) featureUsage.analytics[tier]++;
        if (garage.hasUsedCRM) featureUsage.crm[tier]++;
        if (garage.teamMembers?.length > 0) featureUsage.teamManagement[tier]++;
      }
    });

    // Calculate totals
    Object.keys(featureUsage).forEach((feature) => {
      featureUsage[feature].total =
        featureUsage[feature].premium + featureUsage[feature].enterprise;
    });

    // Feature limits (from plans)
    const featureLimits = {
      aiMechanic: {
        free: 0,
        trial: 5,
        standard: 20,
        premium: 50,
        enterprise: -1, // unlimited
      },
      teamMembers: {
        free: 1,
        trial: 1,
        standard: 3,
        premium: 5,
        enterprise: -1,
      },
      apiCalls: {
        free: 0,
        trial: 100,
        standard: 500,
        premium: 1000,
        enterprise: -1,
      },
    };

    // Calculate adoption rates
    const totalPremiumUsers =
      tierDistribution.user.premium +
      tierDistribution.user.enterprise +
      tierDistribution.garage.premium +
      tierDistribution.garage.enterprise;

    const adoptionRates = {
      analytics:
        totalPremiumUsers > 0
          ? Math.round((featureUsage.analytics.total / totalPremiumUsers) * 100)
          : 0,
      aiMechanic:
        totalPremiumUsers > 0
          ? Math.round(
              (featureUsage.aiMechanic.total / totalPremiumUsers) * 100
            )
          : 0,
      crm:
        totalPremiumUsers > 0
          ? Math.round((featureUsage.crm.total / totalPremiumUsers) * 100)
          : 0,
      teamManagement:
        totalPremiumUsers > 0
          ? Math.round(
              (featureUsage.teamManagement.total / totalPremiumUsers) * 100
            )
          : 0,
    };

    // Top features by usage
    const topFeatures = Object.entries(featureUsage)
      .map(([name, data]) => ({
        name,
        usage: data.total,
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers: users.length,
          totalGarages: garages.length,
          premiumUsers:
            tierDistribution.user.premium + tierDistribution.user.enterprise,
          premiumGarages:
            tierDistribution.garage.premium +
            tierDistribution.garage.enterprise,
        },
        tierDistribution,
        featureUsage,
        featureLimits,
        adoptionRates,
        topFeatures,
      },
    });
  } catch (error) {
    console.error("Error fetching feature usage:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch feature usage",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
