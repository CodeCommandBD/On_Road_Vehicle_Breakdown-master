import { NextResponse } from "next/server";
import { removeTokenCookie } from "@/lib/utils/auth";

export async function POST() {
  try {
    await removeTokenCookie();

    return NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
