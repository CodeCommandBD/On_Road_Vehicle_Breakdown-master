import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import PointsRecord from "@/lib/db/models/PointsRecord";
import { requireAuth, requireRole } from "@/lib/utils/auth";
import { handleError, NotFoundError } from "@/lib/utils/errorHandler";
import { successResponse, paginatedResponse } from "@/lib/utils/apiResponse";
import { MESSAGES, PAGINATION } from "@/lib/utils/constants";
import { logFromRequest, AUDIT_ACTIONS, SEVERITY } from "@/lib/utils/auditLog";

/**
 * GET /api/admin/users
 * Get all users (Admin only)
 */
export async function GET(request) {
  try {
    await connectDB();

    // Require admin authentication
    const currentUser = await requireAuth(request);
    requireRole(currentUser, "admin");

    // Get pagination params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || PAGINATION.DEFAULT_PAGE;
    const limit =
      parseInt(searchParams.get("limit")) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    // Get total count
    const total = await User.countDocuments();

    // Fetch users
    const users = await User.find()
      .populate("garageId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return paginatedResponse(
      users.map((u) => u.toPublicJSON()),
      page,
      limit,
      total,
      "ব্যবহারকারী তালিকা সফলভাবে পাওয়া গেছে"
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/admin/users
 * Update user details (Admin only)
 */
export async function PUT(request) {
  try {
    await connectDB();

    // Require admin authentication
    const currentUser = await requireAuth(request);
    requireRole(currentUser, "admin");

    const { userId, rewardPoints, isActive, role } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "ব্যবহারকারী ID প্রয়োজন" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError(MESSAGES.ERROR.USER_NOT_FOUND);
    }

    // Handle points adjustment
    if (rewardPoints !== undefined) {
      const diff = rewardPoints - (user.rewardPoints || 0);
      user.rewardPoints = rewardPoints;

      // Log point change
      if (diff !== 0) {
        await PointsRecord.create({
          user: user._id,
          points: Math.abs(diff),
          type: diff > 0 ? "earn" : "redeem",
          reason: `Admin adjustment: ${
            diff > 0 ? "Added" : "Removed"
          } by administrator`,
          metadata: { adminId: currentUser.userId },
        });
      }
    }

    // Track changes for audit log
    const changes = {};
    if (isActive !== undefined && user.isActive !== isActive) {
      changes.isActive = { before: user.isActive, after: isActive };
      user.isActive = isActive;
    }
    if (role !== undefined && user.role !== role) {
      changes.role = { before: user.role, after: role };
      user.role = role;
    }
    if (rewardPoints !== undefined) {
      changes.rewardPoints = {
        before: user.rewardPoints || 0,
        after: rewardPoints,
      };
    }

    await user.save();

    // Log admin action
    await logFromRequest(request, {
      action:
        role !== undefined && changes.role
          ? AUDIT_ACTIONS.USER_ROLE_CHANGED
          : AUDIT_ACTIONS.USER_UPDATED,
      performedBy: currentUser.userId,
      targetModel: "User",
      targetId: user._id,
      changes,
      severity: role !== undefined ? SEVERITY.HIGH : SEVERITY.MEDIUM,
    });

    return successResponse(
      { user: user.toPublicJSON() },
      "ব্যবহারকারী সফলভাবে আপডেট হয়েছে"
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/admin/users
 * Delete user (Admin only)
 */
export async function DELETE(request) {
  try {
    await connectDB();

    // Require admin authentication
    const currentUser = await requireAuth(request);
    requireRole(currentUser, "admin");

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "ব্যবহারকারী ID প্রয়োজন" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError(MESSAGES.ERROR.USER_NOT_FOUND);
    }

    // Log deletion before actually deleting
    await logFromRequest(request, {
      action: AUDIT_ACTIONS.USER_DELETED,
      performedBy: currentUser.userId,
      targetModel: "User",
      targetId: user._id,
      changes: {
        deletedUser: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      severity: SEVERITY.CRITICAL,
    });

    await User.findByIdAndDelete(userId);

    return successResponse({ userId }, "ব্যবহারকারী মুছে ফেলা হয়েছে");
  } catch (error) {
    return handleError(error);
  }
}
