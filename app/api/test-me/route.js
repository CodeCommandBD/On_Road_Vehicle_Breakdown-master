import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Antigravity Test Route is LIVE",
    time: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
}
