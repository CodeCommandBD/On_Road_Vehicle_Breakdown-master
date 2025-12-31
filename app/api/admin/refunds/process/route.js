import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import { requireAuth, requireRole } from "@/lib/utils/auth";
import { handleError } from "@/lib/utils/errorHandler";
import {
  processRefundToWallet,
  processAutomatedRefund,
} from "@/lib/utils/refund";

/**
 * POST /api/admin/refunds/process
 * Manually process a refund (Admin only)
 */
export async function POST(request) {
  try {
    await connectDB();

    // Require admin authentication
    const currentUser = await requireAuth(request);
    requireRole(currentUser, "admin");

    const { userId, bookingId, paymentId, refundAmount, reason } =
      await request.json();

    // Validate required fields
    if (!userId || !paymentId || !refundAmount || !reason) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Process refund
    const result = await processRefundToWallet({
      userId,
      bookingId,
      paymentId,
      refundAmount,
      reason,
      processedBy: currentUser.userId,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Refund processed successfully",
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
