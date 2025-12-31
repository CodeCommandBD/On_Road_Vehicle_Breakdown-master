import { NextResponse } from "next/server";
import { runDailyProcessing } from "@/lib/utils/analyticsProcessing";

export const dynamic = "force-dynamic"; // Ensure no caching

/**
 * GET /api/cron/process-daily
 * Trigger daily analytics processing
 * Secured by CRON_SECRET header
 */
export async function GET(request) {
  // Security Check
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const result = await runDailyProcessing();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { success: false, message: "Cron job failed" },
      { status: 500 }
    );
  }
}
