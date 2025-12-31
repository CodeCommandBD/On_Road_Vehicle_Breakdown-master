import { NextResponse } from "next/server";
import WebhookSubscription from "@/lib/db/models/WebhookSubscription";
import dbConnect from "@/lib/db/mongodb";
import { getServerSession } from "next-auth"; // Adjust based on your auth
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Hypothetical path
import crypto from "crypto";

export async function POST(req) {
  try {
    await dbConnect();
    // Simplified auth check - in production use real session
    // const session = await getServerSession(authOptions);
    // if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { url, events, userId } = body; // userId passed for testing, usually get from session

    if (!url || !events) {
      return NextResponse.json(
        { error: "URL and Events are required" },
        { status: 400 }
      );
    }

    const secret = "whsec_" + crypto.randomBytes(16).toString("hex");

    const subscription = await WebhookSubscription.create({
      userId: userId || "659d4f...", // Fallback for testing
      url,
      events,
      secret,
    });

    return NextResponse.json({ success: true, subscription }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    const subs = await WebhookSubscription.find({});
    return NextResponse.json(subs);
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
