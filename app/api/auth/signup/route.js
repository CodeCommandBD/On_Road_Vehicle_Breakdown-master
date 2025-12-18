import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import User from "@/lib/db/models/User";
import Garage from "@/lib/db/models/Garage";
import { createToken, setTokenCookie } from "@/lib/utils/auth";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, password, phone, role, garageName, address } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "This email is already registered. Please login instead.",
        },
        { status: 409 }
      );
    }

    // Validate password
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Format address into an object if it's a string
    const formattedAddress =
      typeof address === "string"
        ? {
            street: address,
            city: "Dhaka",
            district: "Dhaka",
            postalCode: "",
          }
        : address;

    // Create user
    const userData = {
      name,
      email,
      password,
      phone: phone || null,
      role: role || "user",
    };

    if (formattedAddress) {
      userData.address = formattedAddress;
    }

    const user = new User(userData);
    await user.save();

    // If registering as garage, create garage profile
    if (role === "garage" && garageName) {
      const garage = new Garage({
        name: garageName,
        owner: user._id,
        email: email,
        phone: phone || "",
        address: formattedAddress || {
          street: "",
          city: "Dhaka",
          district: "Dhaka",
        },
      });
      await garage.save();
    }

    // Create JWT token (optional if redirecting to login)
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const token = await createToken(tokenPayload);

    // Skip setting cookie to allow redirect to login page as requested by user
    // await setTokenCookie(token);

    // Return success
    return NextResponse.json(
      {
        success: true,
        message: "Registration successful. Please login.",
        user: user.toPublicJSON(),
        token, // Still return token in case frontend wants it
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json(
        { success: false, message: messages.join(", ") },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
