import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import { verifyToken } from "@/lib/utils/auth";
import bcrypt from "bcrypt";

// GET: List Team Members
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

    const currentUser = await User.findById(decoded.userId);
    if (!currentUser)
      return NextResponse.json({ success: false }, { status: 404 });

    // Check if enterprise owner
    // If member, maybe they can see team too? Let's allow owner and admin-level members
    const isOwner = currentUser.enterpriseTeam?.isOwner !== false;
    const parentId = isOwner
      ? currentUser._id
      : currentUser.enterpriseTeam?.parentAccount;

    if (!parentId) {
      return NextResponse.json(
        { success: false, message: "Not part of an enterprise team" },
        { status: 400 }
      );
    }

    // Determine whose members to fetch
    // If I am owner, fetch my members (where parentAccount = my ID)
    // If I am member, fetch my colleagues (where parentAccount = my parent ID)

    // Note: The structure in User.js was:
    // enterpriseTeam: { parentAccount: Ref, members: [SubDoc] }
    // Actually, storing members array in the Parent User might be better for single-source-of-truth if we used the Option 2 described in artifacts.
    // Let's check what I implemented in User.js

    // User.js implementation:
    // enterpriseTeam: { isOwner: Boolean, parentAccount: Ref, members: [ { userId, name, ... } ] }

    // So if I am owner, "members" array in MY document holds the list.
    // If I am member, I need to fetch the owner document to see the list?
    // OR we just query users where enterpriseTeam.parentAccount matches.
    // Storing in 'members' array in Parent is duplication if we also link via parentAccount.
    // BUT the prompt asked for the structure in Option 2 which had 'members' array.
    // SO, the authoritative list is in the Owner's 'enterpriseTeam.members' array.

    let owner;
    if (isOwner) {
      owner = currentUser;
    } else {
      owner = await User.findById(parentId);
    }

    if (!owner) {
      return NextResponse.json(
        { success: false, message: "Team owner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      members: owner.enterpriseTeam.members || [],
    });
  } catch (error) {
    console.error("Team List Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Add Team Member
export async function POST(request) {
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
    // Only owner can add members for now
    if (
      !currentUser.enterpriseTeam?.isOwner &&
      currentUser.enterpriseTeam?.role !== "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Only enterprise owners or admins can add members",
        },
        { status: 403 }
      );
    }

    const { name, email, password, phone, role } = await request.json();

    // 1. Create the new User account for the member
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Default password if not provided? Or require it.
    const memberPassword = password || "Team@1234"; // Should force change later

    const newMember = await User.create({
      name,
      email,
      password: memberPassword,
      phone,
      role: "user", // Base role
      membershipTier: "enterprise", // Inherit tier? Or keeps free but linked?
      // Usually enterprise members get benefits, so let's mark them enterprise
      enterpriseTeam: {
        isOwner: false,
        parentAccount: currentUser._id,
        role: role || "member",
      },
    });

    // 2. Add to Owner's member list
    currentUser.enterpriseTeam.members.push({
      userId: newMember._id,
      name: newMember.name,
      email: newMember.email,
      role: role || "member",
      addedBy: currentUser._id,
    });

    await currentUser.save();

    return NextResponse.json({
      success: true,
      message: "Team member added successfully",
      member: {
        id: newMember._id,
        name: newMember.name,
        email: newMember.email,
        role: role,
      },
    });
  } catch (error) {
    console.error("Add Member Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to add member" },
      { status: 500 }
    );
  }
}
