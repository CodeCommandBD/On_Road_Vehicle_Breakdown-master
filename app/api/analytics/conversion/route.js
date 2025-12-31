import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import { verifyToken } from "@/lib/utils/auth";
import { rateLimitMiddleware } from "@/lib/utils/rateLimit";
import ConversionFunnel from "@/lib/db/models/ConversionFunnel";

/**
 * GET /api/analytics/conversion
 * Get conversion funnel analytics (admin only)
 */
export async function GET(request) {
  // Rate limiting: 30 requests per minute
  const rateLimitResult = rateLimitMiddleware(request, 30, 60 * 1000);
  if (rateLimitResult) return rateLimitResult;

  try {
    await connectDB();

    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const funnelType = searchParams.get("funnelType") || "booking";
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all funnels of this type
    const funnels = await ConversionFunnel.find({
      funnelType,
      startedAt: { $gte: startDate },
    });

    // Calculate funnel metrics
    const totalFunnels = funnels.length;
    const completedFunnels = funnels.filter(
      (f) => f.status === "completed"
    ).length;
    const abandonedFunnels = funnels.filter(
      (f) => f.status === "abandoned"
    ).length;
    const inProgressFunnels = funnels.filter(
      (f) => f.status === "in_progress"
    ).length;

    const conversionRate =
      totalFunnels > 0 ? (completedFunnels / totalFunnels) * 100 : 0;

    // Calculate average time to convert
    const completedWithDuration = funnels.filter(
      (f) => f.status === "completed" && f.totalDuration
    );
    const avgTimeToConvert =
      completedWithDuration.length > 0
        ? completedWithDuration.reduce((sum, f) => sum + f.totalDuration, 0) /
          completedWithDuration.length
        : 0;

    // Calculate step-by-step drop-off
    const stepAnalysis = calculateStepDropOff(funnels);

    // Calculate total conversion value
    const totalConversionValue = funnels
      .filter((f) => f.converted)
      .reduce((sum, f) => sum + (f.conversionValue || 0), 0);

    return NextResponse.json({
      success: true,
      funnelType,
      period: `Last ${days} days`,
      summary: {
        total: totalFunnels,
        completed: completedFunnels,
        abandoned: abandonedFunnels,
        inProgress: inProgressFunnels,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgTimeToConvert: Math.round(avgTimeToConvert), // seconds
        totalRevenue: Math.round(totalConversionValue),
      },
      stepAnalysis,
    });
  } catch (error) {
    console.error("Conversion analytics error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Calculate step-by-step drop-off rates
 */
function calculateStepDropOff(funnels) {
  if (funnels.length === 0) return [];

  // Get unique steps from all funnels
  const allSteps = new Map();

  funnels.forEach((funnel) => {
    funnel.steps.forEach((step) => {
      if (!allSteps.has(step.stepOrder)) {
        allSteps.set(step.stepOrder, {
          stepOrder: step.stepOrder,
          stepName: step.stepName,
          entered: 0,
          completed: 0,
          avgTimeSpent: 0,
          totalTimeSpent: 0,
        });
      }
    });
  });

  // Count completions for each step
  funnels.forEach((funnel) => {
    funnel.steps.forEach((step) => {
      const stepData = allSteps.get(step.stepOrder);
      if (stepData) {
        stepData.completed++;
        stepData.totalTimeSpent += step.timeSpent || 0;
      }
    });

    // Count entries (users who reached this step)
    const maxStep = Math.max(...funnel.steps.map((s) => s.stepOrder), 0);
    for (let i = 0; i <= maxStep; i++) {
      const stepData = allSteps.get(i);
      if (stepData) {
        stepData.entered++;
      }
    }
  });

  // Calculate metrics
  const steps = Array.from(allSteps.values()).sort(
    (a, b) => a.stepOrder - b.stepOrder
  );

  let previousEntered = funnels.length;

  return steps.map((step, index) => {
    const completionRate =
      step.entered > 0 ? (step.completed / step.entered) * 100 : 0;

    const dropOffRate =
      previousEntered > 0
        ? ((previousEntered - step.entered) / previousEntered) * 100
        : 0;

    const avgTimeSpent =
      step.completed > 0 ? step.totalTimeSpent / step.completed : 0;

    const result = {
      stepOrder: step.stepOrder,
      stepName: step.stepName,
      entered: step.entered,
      completed: step.completed,
      completionRate: Math.round(completionRate * 100) / 100,
      dropOffRate: Math.round(dropOffRate * 100) / 100,
      avgTimeSpent: Math.round(avgTimeSpent), // seconds
    };

    previousEntered = step.entered;
    return result;
  });
}
