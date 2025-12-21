import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Contract from "@/lib/db/models/Contract";
import { verifyToken } from "@/lib/utils/auth";

/**
 * GET /api/contracts/[id]/pdf
 * Download contract as PDF/HTML
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
      .populate("userId", "name email phone")
      .populate("planId", "name tier")
      .populate("accountManager", "name email phone");

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

    // Generate HTML
    const html = generateContractHTML(contract);

    // Return as HTML
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${contract.contractNumber}.html"`,
      },
    });
  } catch (error) {
    console.error("Contract PDF Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

function generateContractHTML(contract) {
  const userId = contract.userId || {};
  const planId = contract.planId || {};
  const pricing = contract.pricing || {};
  const metadata = contract.metadata || {};

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Contract ${contract.contractNumber}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            background: white;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #FF5722;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #FF5722;
            margin: 0;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            background: #f5f5f5;
            padding: 10px;
            font-weight: bold;
            border-left: 4px solid #FF5722;
            margin-bottom: 10px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 150px 1fr;
            gap: 10px;
            margin-bottom: 10px;
        }
        .label {
            font-weight: bold;
            color: #666;
        }
        .value {
            color: #333;
        }
        .terms {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            white-space: pre-wrap;
            line-height: 1.6;
        }
        .signature-section {
            margin-top: 50px;
            border-top: 2px solid #ddd;
            padding-top: 30px;
        }
        .signature-box {
            border: 1px solid #ddd;
            padding: 20px;
            margin-top: 15px;
            min-height: 80px;
        }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #999;
            font-size: 12px;
        }
        @media print {
            body { padding: 20px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ENTERPRISE SERVICE CONTRACT</h1>
        <p>${contract.contractNumber}</p>
    </div>

    <div class="section">
        <div class="section-title">Contract Information</div>
        <div class="info-grid">
            <div class="label">Contract Number:</div>
            <div class="value">${contract.contractNumber || "N/A"}</div>
            
            <div class="label">Client Name:</div>
            <div class="value">${userId.name || "N/A"}</div>
            
            <div class="label">Client Email:</div>
            <div class="value">${userId.email || "N/A"}</div>
            
            <div class="label">Client Phone:</div>
            <div class="value">${userId.phone || "N/A"}</div>
            
            <div class="label">Plan:</div>
            <div class="value">${planId.name || "Enterprise"} (${(
    planId.tier || "enterprise"
  ).toUpperCase()})</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Financial Terms</div>
        <div class="info-grid">
            <div class="label">Amount:</div>
            <div class="value">${pricing.currency || "BDT"} ${(
    pricing.amount || 0
  ).toLocaleString()}</div>
            
            <div class="label">Billing Cycle:</div>
            <div class="value">${(
              pricing.billingCycle || "monthly"
            ).toUpperCase()}</div>
            
            <div class="label">Start Date:</div>
            <div class="value">${new Date(
              contract.startDate
            ).toLocaleDateString()}</div>
            
            <div class="label">End Date:</div>
            <div class="value">${new Date(
              contract.endDate
            ).toLocaleDateString()}</div>
        </div>
    </div>

    ${
      metadata.customFeatures && metadata.customFeatures.length > 0
        ? `
    <div class="section">
        <div class="section-title">Custom Features Included</div>
        <ul>
            ${metadata.customFeatures.map((f) => `<li>${f}</li>`).join("")}
        </ul>
    </div>
    `
        : ""
    }

    ${
      metadata.slaMinutes
        ? `
    <div class="section">
        <div class="section-title">Service Level Agreement</div>
        <div class="info-grid">
            <div class="label">Response Time:</div>
            <div class="value">${metadata.slaMinutes} minutes</div>
            
            <div class="label">24/7 Support:</div>
            <div class="value">${metadata.dedicatedSupport ? "Yes" : "No"}</div>
        </div>
    </div>
    `
        : ""
    }

    <div class="section">
        <div class="section-title">Terms & Conditions</div>
        <div class="terms">${contract.terms || "Standard terms apply."}</div>
    </div>

    ${
      contract.customTerms
        ? `
    <div class="section">
        <div class="section-title">Custom Terms</div>
        <div class="terms">${contract.customTerms}</div>
    </div>
    `
        : ""
    }

    ${
      contract.signedAt
        ? `
    <div class="signature-section">
        <div class="section-title">Contract Signature</div>
        <div class="signature-box">
            <p><strong>Signed by:</strong> ${contract.signedBy.name}</p>
            <p><strong>Designation:</strong> ${
              contract.signedBy.designation
            }</p>
            <p><strong>Date:</strong> ${new Date(
              contract.signedAt
            ).toLocaleString()}</p>
            <p><strong>Status:</strong> ${contract.status.toUpperCase()}</p>
        </div>
    </div>
    `
        : `
    <div class="signature-section">
        <div class="section-title">Signature Required</div>
        <p>This contract is pending client signature.</p>
        <div class="signature-box">
            <p>Signature: _________________________</p>
            <p>Date: _________________________</p>
        </div>
    </div>
    `
    }

    <div class="footer">
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>This is a legally binding contract. Please review carefully before signing.</p>
    </div>
    
    <div class="no-print" style="margin-top: 30px; text-align: center;">
        <button onclick="window.print()" style="background: #FF5722; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; font-size: 16px;">
            Print / Save as PDF
        </button>
    </div>
</body>
</html>
  `;
}
