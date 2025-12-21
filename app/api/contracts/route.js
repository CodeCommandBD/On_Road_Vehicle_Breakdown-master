import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Contract from "@/lib/db/models/Contract";
import User from "@/lib/db/models/User";
import Package from "@/lib/db/models/Package";
import { verifyToken } from "@/lib/utils/auth";

/**
 * GET /api/contracts
 * Fetch contracts for current user or all (admin only)
 */
export async function GET(request) {
  try {
    await connectDB();
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = {};

    // Role-based filtering
    if (decoded.role === "admin") {
      if (status) {
        query.status = status;
      }
    } else {
      // Users can only see their own contracts
      query.userId = decoded.userId;
      if (status) {
        query.status = status;
      }
    }

    const contracts = await Contract.find(query)
      .populate("userId", "name email phone")
      .populate("planId", "name tier")
      .populate("accountManager", "name email phone")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: { contracts },
    });
  } catch (error) {
    console.error("Contract GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contracts
 * Create a new contract (Admin only)
 */
export async function POST(request) {
  try {
    await connectDB();
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      userId,
      planId,
      terms,
      customTerms,
      pricing,
      startDate,
      endDate,
      accountManager,
      metadata,
    } = body;

    // Validation
    if (!userId || !planId || !terms || !pricing || !startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Verify user and plan exist
    const user = await User.findById(userId);
    const plan = await Package.findById(planId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (!plan) {
      return NextResponse.json(
        { success: false, message: "Plan not found" },
        { status: 404 }
      );
    }

    // Create contract
    const contract = await Contract.create({
      userId,
      planId,
      terms,
      customTerms,
      pricing,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      accountManager: accountManager || decoded.userId, // Default to current admin
      metadata,
      status: "pending_signature",
    });

    await contract.populate("userId planId accountManager");

    return NextResponse.json({
      success: true,
      data: { contract },
      message: "Contract created successfully",
    });
  } catch (error) {
    console.error("Contract POST Error:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.toString() : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/contracts
 * Update contract status or sign contract
 */
export async function PATCH(request) {
  try {
    await connectDB();
    const token = request.cookies.get("token")?.value;
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { contractId, action, signedBy } = body;

    if (!contractId) {
      return NextResponse.json(
        { success: false, message: "Contract ID is required" },
        { status: 400 }
      );
    }

    const contract = await Contract.findById(contractId);

    if (!contract) {
      return NextResponse.json(
        { success: false, message: "Contract not found" },
        { status: 404 }
      );
    }

    // Authorization check
    const isOwner = contract.userId.toString() === decoded.userId;
    const isAdmin = decoded.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to modify this contract" },
        { status: 403 }
      );
    }

    // Handle different actions
    if (action === "sign") {
      if (!isOwner) {
        return NextResponse.json(
          { success: false, message: "Only contract owner can sign" },
          { status: 403 }
        );
      }

      contract.status = "active";
      contract.signedAt = new Date();
      contract.signedBy = signedBy || {
        name: decoded.name,
        designation: "Client",
      };
    } else if (action === "activate" && isAdmin) {
      contract.status = "active";
    } else if (action === "cancel") {
      contract.status = "cancelled";
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid action" },
        { status: 400 }
      );
    }

    await contract.save();
    await contract.populate("userId planId accountManager");

    return NextResponse.json({
      success: true,
      data: { contract },
      message: `Contract ${action}d successfully`,
    });
  } catch (error) {
    console.error("Contract PATCH Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
