import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/utils/csrf";

/**
 * GET /api/csrf-token
 * Generate and return a CSRF token
 */
export async function GET() {
  try {
    const token = generateCsrfToken();

    return NextResponse.json({
      success: true,
      csrfToken: token,
    });
  } catch (error) {
    console.error("CSRF token generation error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate CSRF token",
      },
      { status: 500 }
    );
  }
}
