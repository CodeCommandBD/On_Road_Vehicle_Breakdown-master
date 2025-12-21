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

    // Auto-send email to user
    try {
      const { sendContractEmail } = await import("@/lib/utils/email");
      await sendContractEmail({
        userEmail: user.email,
        userName: user.name,
        contractNumber: contract.contractNumber,
        amount: contract.pricing.amount,
        currency: contract.pricing.currency,
        startDate: contract.startDate,
        endDate: contract.endDate,
        contractId: contract._id,
      });
    } catch (emailError) {
      console.error("Failed to send contract email:", emailError);
      // Don't fail the request if email fails
    }

    // Create notification for user
    try {
      const Notification = (await import("@/lib/db/models/Notification"))
        .default;
      await Notification.create({
        recipient: userId,
        type: "system_alert",
        title: "📄 Enterprise Contract Ready",
        message: `Your custom enterprise contract ${contract.contractNumber} is ready for review and signature.`,
        link: `/user/dashboard/contracts`,
      });
    } catch (notifyError) {
      console.error("Failed to create notification:", notifyError);
      // Don't fail the request
    }

    return NextResponse.json({
      success: true,
      data: { contract },
      message: "Contract created and email sent to user",
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

      // AUTOMATIC MEMBERSHIP ACTIVATION
      try {
        const user = await User.findById(contract.userId);
        if (user) {
          // Update user membership
          user.membershipTier = "enterprise";
          user.membershipStatus = "active";
          user.membershipStartDate = contract.startDate;
          user.membershipEndDate = contract.endDate;
          user.currentPlan = contract.planId;
          await user.save();

          // Send activation email
          try {
            const { sendContractEmail } = await import("@/lib/utils/email");
            await sendContractEmail({
              userEmail: user.email,
              userName: user.name,
              contractNumber: contract.contractNumber,
              amount: contract.pricing.amount,
              currency: contract.pricing.currency,
              startDate: contract.startDate,
              endDate: contract.endDate,
              contractId: contract._id,
            });
          } catch (emailError) {
            console.error("Failed to send activation email:", emailError);
          }

          // Create notification
          try {
            const Notification = (await import("@/lib/db/models/Notification"))
              .default;
            await Notification.create({
              recipient: user._id,
              type: "success",
              title: "🎉 Enterprise Membership Activated!",
              message: `Your enterprise membership is now active. Enjoy unlimited access and premium support until ${new Date(
                contract.endDate
              ).toLocaleDateString()}.`,
              link: "/user/dashboard",
            });
          } catch (notifyError) {
            console.error("Failed to create notification:", notifyError);
          }
        }
      } catch (membershipError) {
        console.error("Membership activation error:", membershipError);
        // Don't fail the signing if membership update fails
      }
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
