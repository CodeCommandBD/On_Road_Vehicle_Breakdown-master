import { NextResponse } from "next/server";
import {
  createMongoDBBackup,
  listBackups,
  deleteBackup,
} from "@/lib/services/backup.service";
import { requireAuth, requireRole } from "@/lib/utils/auth";
import { handleError } from "@/lib/utils/errorHandler";

/**
 * GET /api/admin/backup
 * List all backups or create new backup
 */
export async function GET(request) {
  try {
    // Check for cron secret (for automated backups)
    const authHeader = request.headers.get("authorization");
    const isCronJob = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isCronJob) {
      // Require admin authentication for manual access
      const currentUser = await requireAuth(request);
      requireRole(currentUser, "admin");
    }

    // Check if action is to list backups
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "list") {
      const backups = listBackups();
      return NextResponse.json({
        success: true,
        backups,
        count: backups.length,
      });
    }

    // Default: Create new backup
    const performedBy = isCronJob ? null : (await requireAuth(request)).userId;
    const result = await createMongoDBBackup(performedBy);

    return NextResponse.json({
      success: true,
      message: "Backup created successfully",
      backup: result,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/admin/backup
 * Create a new backup (manual trigger)
 */
export async function POST(request) {
  try {
    const currentUser = await requireAuth(request);
    requireRole(currentUser, "admin");

    const result = await createMongoDBBackup(currentUser.userId);

    return NextResponse.json({
      success: true,
      message: "Backup created successfully",
      backup: result,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/admin/backup
 * Delete a specific backup
 */
export async function DELETE(request) {
  try {
    const currentUser = await requireAuth(request);
    requireRole(currentUser, "admin");

    const { searchParams } = new URL(request.url);
    const backupName = searchParams.get("name");

    if (!backupName) {
      return NextResponse.json(
        { success: false, message: "Backup name is required" },
        { status: 400 }
      );
    }

    await deleteBackup(backupName, currentUser.userId);

    return NextResponse.json({
      success: true,
      message: "Backup deleted successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}
