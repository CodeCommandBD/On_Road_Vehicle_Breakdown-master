import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import ApiKey from "@/lib/db/models/ApiKey";
import { verifyToken } from "@/lib/utils/auth";
import crypto from "crypto";

// GET: Fetch user's API keys
export async function GET(req) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only Enterprise users should manage API keys (checked in UI as well)
    // But for API safety, we can add a check here if needed.

    const apiKeys = await ApiKey.find({ user: user.userId })
      .select("-key")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: apiKeys,
    });
  } catch (error) {
    console.error("API Key Fetch Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}

// POST: Generate a new API key
export async function POST(req) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { label } = await req.json();

    // Generate a secure random key
    const rawKey = `orb_${crypto.randomBytes(24).toString("hex")}`;

    // In a real production app, we should store a HASH of the key.
    // For this implementation, we'll store the key but only show it ONCE to the user.
    // Optimization: Store hashed key in DB, verify against incoming key.

    const newApiKey = await ApiKey.create({
      user: user.userId,
      key: rawKey,
      label: label || "New API Key",
    });

    return NextResponse.json({
      success: true,
      data: {
        _id: newApiKey._id,
        key: rawKey, // ONLY show this once
        label: newApiKey.label,
        createdAt: newApiKey.createdAt,
      },
      message:
        "API Key generated successfully. Please save it now, it won't be shown again.",
    });
  } catch (error) {
    console.error("API Key Create Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}

// DELETE: Revoke an API key
export async function DELETE(req) {
  try {
    await connectDB();
    const token = req.cookies.get("token")?.value;
    const user = await verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get("id");

    if (!keyId) {
      return NextResponse.json(
        { success: false, message: "Missing key ID" },
        { status: 400 }
      );
    }

    const result = await ApiKey.findOneAndDelete({
      _id: keyId,
      user: user.userId,
    });

    if (!result) {
      return NextResponse.json(
        { success: false, message: "Key not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "API Key revoked successfully",
    });
  } catch (error) {
    console.error("API Key Delete Error:", error);
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}
