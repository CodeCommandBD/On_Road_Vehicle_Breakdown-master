import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
            folder: "vehicle_breakdown", // Optional: organize in folder
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Upload Detailed Error:", {
      message: error.message,
      stack: error.stack,
      envCheck: {
        cloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: !!process.env.CLOUDINARY_API_KEY,
        apiSecret: !!process.env.CLOUDINARY_API_SECRET,
      },
    });
    return NextResponse.json(
      {
        success: false,
        message: "Upload failed",
        error: error.message || "Unknown error",
        details: {
          cloudNameSet: !!process.env.CLOUDINARY_CLOUD_NAME,
          apiKeySet: !!process.env.CLOUDINARY_API_KEY,
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { public_id } = await request.json();

    console.log("DELETE Request - Public ID:", public_id);

    if (!public_id) {
      return NextResponse.json(
        { success: false, message: "Public ID is required" },
        { status: 400 }
      );
    }

    // Try deleting as image first (default)
    let result = await cloudinary.uploader.destroy(public_id);

    console.log("Cloudinary Destroy Result (Image):", result);

    // If not found, try raw (for PDFs sometimes) or video
    if (result.result !== "ok") {
      console.log("Retrying delete as 'raw' resource type...");
      const resultRaw = await cloudinary.uploader.destroy(public_id, {
        resource_type: "raw",
      });
      console.log("Cloudinary Destroy Result (Raw):", resultRaw);
      if (resultRaw.result === "ok") {
        result = resultRaw;
      }
    }

    // Return successfully even if not found, to clear local state?
    // Or return error if strictly not found?
    // For User Verify, maybe better to be permissive but log it.

    return NextResponse.json({
      success: result.result === "ok", // Only true if actually deleted
      message:
        result.result === "ok"
          ? "File deleted successfully"
          : "File not found or could not be deleted",
      result,
    });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json(
      { success: false, message: "Delete failed", error: error.message },
      { status: 500 }
    );
  }
}
