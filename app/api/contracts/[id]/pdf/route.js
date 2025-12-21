import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Contract from "@/lib/db/models/Contract";
import { verifyToken } from "@/lib/utils/auth";
import { generateContractPDF } from "@/lib/utils/pdfGenerator";
import path from "path";
import fs from "fs";

/**
 * GET /api/contracts/[id]/pdf
 * Generate and download contract PDF
 */
export async function GET(request, { params }) {
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

    const { id } = params;

    const contract = await Contract.findById(id)
      .populate("user Id", "name email phone")
      .populate("planId", "name tier benefits")
      .populate("accountManager", "name email");

    if (!contract) {
      return NextResponse.json(
        { success: false, message: "Contract not found" },
        { status: 404 }
      );
    }

    // Authorization check
    const isOwner = contract.userId._id.toString() === decoded.userId;
    const isAdmin = decoded.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to access this contract" },
        { status: 403 }
      );
    }

    // Prepare contract data
    const contractData = {
      contractNumber: contract.contractNumber,
      user: {
        name: contract.userId.name,
        email: contract.userId.email,
        phone: contract.userId.phone,
      },
      plan: {
        name: contract.planId.name,
        tier: contract.planId.tier,
      },
      pricing: contract.pricing,
      startDate: contract.startDate,
      endDate: contract.endDate,
      terms: contract.terms,
      customTerms: contract.customTerms,
      metadata: contract.metadata,
      signedBy: contract.signedBy,
      signedAt: contract.signedAt,
      createdAt: contract.createdAt,
    };

    // Generate PDF
    const publicDir = path.join(process.cwd(), "public", "pdfs", "contracts");

    // Ensure directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const filename = `contract-${contract.contractNumber}.pdf`;
    const outputPath = path.join(publicDir, filename);

    await generateContractPDF(contractData, outputPath);

    // Update contract with PDF URL
    if (!contract.pdfUrl) {
      contract.pdfUrl = `/pdfs/contracts/${filename}`;
      await contract.save();
    }

    // Read the file and return as response
    const pdfBuffer = fs.readFileSync(outputPath);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Contract PDF Generation Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to generate PDF",
      },
      { status: 500 }
    );
  }
}
