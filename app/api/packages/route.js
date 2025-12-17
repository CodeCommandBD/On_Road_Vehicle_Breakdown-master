import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Package from "@/lib/db/models/Package";

export async function GET(request) {
  try {
    await dbConnect();

    const  { searchParams } = new URL(request.url);
    const tier = searchParams.get("tier");
    const isActive = searchParams.get("isActive") !== "false";

    const query = { isActive };
    if (tier) {
      query.tier = tier;
    }

    const packages = await Package.find(query).sort({ order: 1 }).lean();

    return NextResponse.json({
      success: true,
      data: {
        packages,
        total: packages.length,
      },
    });
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch packages",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
