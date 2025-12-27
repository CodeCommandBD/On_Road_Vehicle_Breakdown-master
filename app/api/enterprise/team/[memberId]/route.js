import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { verifyToken } from "@/lib/utils/auth";

export async function DELETE(request, { params }) {
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

    const currentUser = await User.findById(decoded.userId);
    // Only owner/admin can remove
    if (
      !currentUser.enterpriseTeam?.isOwner &&
      currentUser.enterpriseTeam?.role !== "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Only enterprise owners or admins can remove members",
        },
        { status: 403 }
      );
    }

    const { memberId } = params;

    // 1. Remove from Owner's list
    // If I am owner, I am the parent.
    // If I am admin (member), I need to find the parent.
    // For simplicity, let's assume only Owner performs management now, or currentUser has the list.
    // Re-fetching owner if needed.

    let owner = currentUser;
    if (!currentUser.enterpriseTeam?.isOwner) {
      owner = await User.findById(currentUser.enterpriseTeam.parentAccount);
    }

    if (!owner)
      return NextResponse.json(
        { success: false, message: "Owner not found" },
        { status: 404 }
      );

    // Remove from array
    owner.enterpriseTeam.members = owner.enterpriseTeam.members.filter(
      (m) => m.userId.toString() !== memberId
    );
    await owner.save();

    // 2. Update the Member user account
    // Should we delete the user? Or just unlink them?
    // Unlinking is safer. They become a free user.
    await User.findByIdAndUpdate(memberId, {
      membershipTier: "free",
      enterpriseTeam: {
        isOwner: false,
        parentAccount: null,
        role: "member",
        members: [],
      },
    });

    return NextResponse.json({
      success: true,
      message: "Team member removed successfully",
    });
  } catch (error) {
    console.error("Remove Member Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
