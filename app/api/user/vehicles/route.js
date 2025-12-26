import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import TeamMember from "@/lib/db/models/TeamMember";
import Organization from "@/lib/db/models/Organization";
import { getCurrentUser } from "@/lib/utils/auth";

export async function GET() {
  try {
    await connectDB();
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 1. Fetch User's Personal Vehicles
    const user = await User.findById(currentUser.userId).select("vehicles");
    let allVehicles = [];

    if (user && user.vehicles) {
      allVehicles = user.vehicles.map((v) => ({
        ...v.toObject(),
        source: "Personal",
        ownerId: currentUser.userId,
      }));
    }

    // 2. Fetch Organization Vehicles (if any)
    const teamMemberships = await TeamMember.find({
      user: currentUser.userId,
      isActive: true,
    }).populate("organization");

    for (const membership of teamMemberships) {
      const org = membership.organization;
      if (org && org.owner) {
        // If user is the owner, vehicles are already in "Personal" (unless logic differs)
        // Check if owner is different from current user to avoid duplicates
        if (org.owner.toString() !== currentUser.userId) {
          const ownerUser = await User.findById(org.owner).select("vehicles");
          if (ownerUser && ownerUser.vehicles) {
            const orgVehicles = ownerUser.vehicles.map((v) => ({
              ...v.toObject(),
              source: org.name || "Organization",
              ownerId: org.owner,
              isFleet: true,
            }));
            allVehicles = [...allVehicles, ...orgVehicles];
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      vehicles: allVehicles,
    });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
