import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Garage from "@/lib/db/models/Garage";
import User from "@/lib/db/models/User";
import Service from "@/lib/db/models/Service";
import { verifyToken } from "@/lib/utils/auth";

// GET /api/garages/profile - Get garage profile for authenticated garage owner
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

    // Find garage by owner ID
    const garage = await Garage.findOne({ owner: decoded.userId }).populate(
      "services",
      "name category icon"
    );

    if (!garage) {
      return NextResponse.json(
        { success: false, message: "Garage not found" },
        { status: 404 }
      );
    }

    // Fetch user for membership details
    const owner = await User.findById(decoded.userId).select(
      "membershipTier membershipExpiry currentSubscription"
    );

    return NextResponse.json(
      {
        success: true,
        garage: {
          _id: garage._id,
          name: garage.name,
          email: garage.email,
          phone: garage.phone,
          description: garage.description,
          address: garage.address,
          location: garage.location,
          rating: garage.rating,
          services: garage.services,
          is24Hours: garage.is24Hours,
          operatingHours: garage.operatingHours,
          vehicleTypes: garage.vehicleTypes,
          totalBookings: garage.totalBookings,
          completedBookings: garage.completedBookings,
          isVerified: garage.isVerified,
          logo: garage.logo,
          mechanicDetails: garage.mechanicDetails,
          membership: {
            tier: owner?.membershipTier || "free",
            expiry: owner?.membershipExpiry,
            subscriptionId: owner?.currentSubscription,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Garage profile fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/garages/profile - Update garage profile
export async function PUT(request) {
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
    const {
      name,
      email,
      phone,
      description,
      address,
      location,
      operatingHours,
      is24Hours,
      vehicleTypes,
      experience,
      specializedEquipments,
      garageImages,
      mechanicDetails,
    } = body;

    // Find garage by owner ID
    const garage = await Garage.findOne({ owner: decoded.userId });

    if (!garage) {
      return NextResponse.json(
        { success: false, message: "Garage not found" },
        { status: 404 }
      );
    }

    // Update garage fields
    if (name) garage.name = name;
    if (email) garage.email = email;
    if (phone) garage.phone = phone;
    if (description !== undefined) garage.description = description;
    if (address) garage.address = address;
    if (location) garage.location = location;
    if (operatingHours) garage.operatingHours = operatingHours;
    if (is24Hours !== undefined) garage.is24Hours = is24Hours;
    if (vehicleTypes) garage.vehicleTypes = vehicleTypes;
    if (verification) garage.verification = verification;
    if (experience) garage.experience = experience;
    if (specializedEquipments)
      garage.specializedEquipments = specializedEquipments;
    if (garageImages) garage.garageImages = garageImages;
    if (mechanicDetails) garage.mechanicDetails = mechanicDetails;

    await garage.save();

    // Also update user's name, email, phone if provided
    if (name || email || phone) {
      const user = await User.findById(decoded.userId);
      if (user) {
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        await user.save();
      }
    }

    // Return updated garage
    const updatedGarage = await Garage.findById(garage._id).populate(
      "services",
      "name category icon"
    );

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        garage: updatedGarage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating garage profile:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
