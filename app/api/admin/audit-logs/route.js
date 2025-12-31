import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import ActivityLog from "@/lib/db/models/ActivityLog";
import { requireAuth, requireRole } from "@/lib/utils/auth";
import { handleError } from "@/lib/utils/errorHandler";
import { paginatedResponse } from "@/lib/utils/apiResponse";
import { PAGINATION } from "@/lib/utils/constants";

/**
 * GET /api/admin/audit-logs
 * Get audit logs (Admin only)
 */
export async function GET(request) {
  try {
    await connectDB();

    // Require admin authentication
    const currentUser = await requireAuth(request);
    requireRole(currentUser, "admin");

    // Get query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || PAGINATION.DEFAULT_PAGE;
    const limit =
      parseInt(searchParams.get("limit")) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    // Filters
    const action = searchParams.get("action");
    const severity = searchParams.get("severity");
    const targetModel = searchParams.get("targetModel");
    const performedBy = searchParams.get("performedBy");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build query
    const query = {};
    if (action) query.action = action;
    if (severity) query.severity = severity;
    if (targetModel) query.targetModel = targetModel;
    if (performedBy) query.performedBy = performedBy;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Get total count
    const total = await ActivityLog.countDocuments(query);

    // Fetch logs
    const logs = await ActivityLog.find(query)
      .populate("performedBy", "name email role")
      .populate("user", "name email role") // For backward compatibility
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return paginatedResponse(
      logs,
      page,
      limit,
      total,
      "Audit logs retrieved successfully"
    );
  } catch (error) {
    return handleError(error);
  }
}
