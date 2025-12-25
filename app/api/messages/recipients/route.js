import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Garage from "@/lib/db/models/Garage";
import Booking from "@/lib/db/models/Booking";
import { verifyToken } from "@/lib/utils/auth";

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

    const currentUserId = decoded.userId; // Fixed: using decoded.userId for consistency
    const currentUserRole = decoded.role;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase();

    let recipients = {
      support: [],
      garages: [],
      customers: [],
      searchResult: [],
    };

    // 1. Always get Support (Admin)
    const admins = await User.find({ role: "admin" })
      .select("name avatar role")
      .limit(5)
      .lean();
    recipients.support = admins;

    // 2. Role-based Logic
    if (currentUserRole === "user") {
      // Show Verified Garages to Users
      const verifiedGarages = await Garage.find({ isVerified: true })
        .populate("owner", "name avatar role")
        .select("name owner")
        .limit(20)
        .lean();

      recipients.garages = verifiedGarages.map((g) => ({
        _id: g.owner._id,
        name: g.name,
        role: "garage",
        avatar: g.owner.avatar,
      }));
    } else if (currentUserRole === "garage") {
      // Show customers (Users who booked this garage)
      const garageProfile = await Garage.findOne({ owner: currentUserId });
      if (garageProfile) {
        // Show Mechanics in the same garage
        const mechanics = await User.find({
          garageId: garageProfile._id,
          role: "mechanic",
        })
          .select("name avatar role")
          .lean();
        recipients.garages = mechanics; // Reusing garages array for "Team" in this context

        const bookings = await Booking.find({ garage: garageProfile._id })
          .populate("user", "name avatar role email")
          .select("user")
          .limit(50)
          .lean();

        // Get unique users from bookings
        const uniqueUsers = Array.from(
          new Set(bookings.map((b) => b.user?._id?.toString()))
        )
          .map(
            (id) => bookings.find((b) => b.user?._id?.toString() === id)?.user
          )
          .filter(Boolean);

        recipients.customers = uniqueUsers;
      }
    } else if (currentUserRole === "mechanic") {
      // Mechanic can see their Garage Owner and Assigned Customers
      const mechanicUser = await User.findById(currentUserId).populate(
        "garageId"
      );
      if (mechanicUser && mechanicUser.garageId) {
        const garageOwner = await User.findById(mechanicUser.garageId.owner)
          .select("name avatar role")
          .lean();
        if (garageOwner) recipients.garages = [garageOwner];

        // Find customers from bookings assigned to this mechanic
        const assignedBookings = await Booking.find({
          assignedMechanic: currentUserId,
        })
          .populate("user", "name avatar role")
          .select("user")
          .lean();

        const uniqueCustomers = Array.from(
          new Set(assignedBookings.map((b) => b.user?._id?.toString()))
        )
          .map(
            (id) =>
              assignedBookings.find((b) => b.user?._id?.toString() === id)?.user
          )
          .filter(Boolean);

        recipients.customers = uniqueCustomers;
      }
    }

    // 2b. Add mechanics to User's list if they have an active booking
    if (currentUserRole === "user") {
      const userBookings = await Booking.find({
        user: currentUserId,
        status: { $in: ["confirmed", "in_progress"] },
      })
        .populate("assignedMechanic", "name avatar role")
        .select("assignedMechanic")
        .lean();

      const activeMechanics = userBookings
        .map((b) => b.assignedMechanic)
        .filter(Boolean);

      // Add to searchResult or a new category
      recipients.searchResult = [
        ...recipients.searchResult,
        ...activeMechanics,
      ];
    }

    // 3. Search Logic (Global for Admin, Limited for others)
    if (search && search.length > 2) {
      let searchQuery = {
        $and: [
          { _id: { $ne: currentUserId } },
          {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
          },
        ],
      };

      const users = await User.find(searchQuery)
        .select("name avatar role email")
        .limit(10)
        .lean();
      recipients.searchResult = users;
    }

    return NextResponse.json({
      success: true,
      recipients,
    });
  } catch (error) {
    console.error("Recipients GET error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
