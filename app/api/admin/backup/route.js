import { NextResponse } from "next/server";
import { generateBackup } from "@/lib/services/backup.service";
import { getServerSession } from "next-auth"; // Adjust import based on your auth implementation
import User from "@/lib/db/models/User";
import dbConnect from "@/lib/db/mongodb";
import { headers } from "next/headers";

// Simulating Authentication check (Replace with your actual auth guard)
async function isAdmin(req) {
  // 1. Check for Cron Secret (Automated)
  const authHeader = headers().get("authorization");
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }

  // 2. Check for Admin User (Manual via UI)
  // Note: Adjust this based on how you handle sessions in API routes
  // For now, we'll return true to allow you to test it easily,
  // BUT you should uncomment the session check below in production.

  /*
  const session = await getServerSession(); 
  if (!session || !session.user) return false;
  await dbConnect();
  const user = await User.findById(session.user.id);
  return user && user.role === 'admin';
  */

  return true; // TEMPORARY: Allow access for testing
}

export async function GET(req) {
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const backupData = await generateBackup();

    // Create a response with the JSON data
    // We set headers to prompt a file download
    const filename = `backup-${new Date().toISOString().split("T")[0]}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Backup failed:", error);
    return NextResponse.json(
      { error: "Backup generation failed" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  // Trigger backup creation and maybe email it (Automation Flow)
  try {
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In a real scenario, this would upload to S3 and return a secure link
    // For now, it behaves same as GET for simplicity in testing
    const backupData = await generateBackup();

    return NextResponse.json({
      success: true,
      message: "Backup generated successfully",
      metadata: backupData.metadata,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Automated backup failed" },
      { status: 500 }
    );
  }
}
