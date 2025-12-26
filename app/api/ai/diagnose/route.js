import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectDB from "@/lib/db/connection";
import Diagnosis from "@/lib/db/models/Diagnosis";
import { getCurrentUser } from "@/lib/utils/auth";
import { logActivity } from "@/lib/utils/activity";
import TeamMember from "@/lib/db/models/TeamMember";
import User from "@/lib/db/models/User";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function GET(req) {
  try {
    await connectDB();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const diagnoses = await Diagnosis.find({ user: user.userId })
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json({
      success: true,
      data: diagnoses,
    });
  } catch (error) {
    console.error("Fetch Diagnosis Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const verifiedUser = await getCurrentUser();
    if (!verifiedUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId, symptoms, vehicleContext } = body;

    if (!userId || !symptoms) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check Tier-based Limits
    const userDoc = await User.findById(userId);
    const tier = userDoc?.membershipTier || "free";

    const limits = {
      free: 6,
      trial: 2,
      standard: 500,
      premium: 9999,
      enterprise: 9999,
    };

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usageCount = await Diagnosis.countDocuments({
      user: userId,
      createdAt: { $gte: startOfMonth },
    });

    const tierLimit = limits[tier] || 2;

    if (usageCount >= tierLimit) {
      return NextResponse.json(
        {
          success: false,
          message: `Monthly limit reached for ${tier} tier (${tierLimit} diagnoses). Please upgrade your plan.`,
        },
        { status: 403 }
      );
    }

    if (!process.env.GOOGLE_API_KEY) {
      console.error("GOOGLE_API_KEY is missing");
      return NextResponse.json(
        { success: false, message: "AI Service Unavailable (Config Error)" },
        { status: 503 }
      );
    }

    // --- REAL AI ANALYSIS START ---
    let analysis;
    try {
      // Using 'gemini-flash-latest' which usually maps to the latest stable free-tier friendly model
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

      const prompt = `
      Act as an expert automotive mechanic with 20 years of experience in the Bangladesh automotive industry.
      Analyze the following vehicle symptoms and provide a comprehensive diagnosis.
      
      Vehicle: ${vehicleContext?.model || "Generic Car"} (${
        vehicleContext?.year || "Unknown Year"
      })
      Symptoms: "${symptoms}"
      
      The user may provide symptoms in English or Bengali. You must analyze correctly regardless of the language.
      
      Output MUST be valid JSON with this exact structure:
      {
        "possibleCause": "Title of the issue in English with clear Bangla translation in brackets",
        "estimatedCost": "Estimated cost range in BDT (৳), realistic for reliable local workshops in Bangladesh",
        "immediateAction": "One clear actionable step (English + robust Bangla translation)",
        "severity": "Low" | "Medium" | "High" | "Critical",
        "preventiveMeasures": ["Measure 1 (English + Bangla)", "Measure 2 (English + Bangla)"]
      }

      Example format:
      {
        "possibleCause": "Worn Brake Pads (ব্রেক প্যাড ক্ষয়ে যাওয়া)",
        "estimatedCost": "৳২,৫০০ - ৳৪,০০০",
        "immediateAction": "Check brake pads immediately (তাৎক্ষণিকভাবে ব্রেক প্যাড পরীক্ষা করুন)",
        "severity": "High",
        "preventiveMeasures": ["Check brake fluid (ব্রেক ফ্লুইড চেক করুন)", "Avoid hard braking (হঠাৎ জোরে ব্রেক করবেন না)"]
      }
      
      Ensure technical terms are explained simply in Bangla. 
      Do not include any markdown formatting or backticks, just the raw JSON string.
    `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean up potential markdown code blocks if AI adds them
      const cleanJson = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      try {
        analysis = JSON.parse(cleanJson);
      } catch (e) {
        console.error("AI JSON Parse Error:", e, "Raw Text:", text);
        throw new Error("Failed to parse AI response");
      }
    } catch (aiError) {
      console.error("Gemini API Error (Detailed):", aiError);
      // FALLBACK SIMULATION
      analysis = {
        possibleCause: `AI Error: ${
          aiError.message?.substring(0, 100) || "Check Server Logs"
        }`,
        estimatedCost: "৳0",
        immediateAction: "Please check your Server Terminal for more details.",
        severity: "Medium",
        preventiveMeasures: ["Check engine oil", "Listen for unusual sounds"],
      };
    }

    // Save to Database
    const diagnosis = await Diagnosis.create({
      user: userId,
      symptoms,
      analysis,
      vehicleType: vehicleContext?.type || "Car",
    });

    // Logging activity for organizations
    const teamMember = await TeamMember.findOne({ user: userId });
    if (teamMember) {
      await logActivity({
        organizationId: teamMember.organization,
        userId: userId,
        action: "ai_diagnosis",
        metadata: {
          possibleCause: analysis.possibleCause,
          vehicle: vehicleContext?.model,
        },
        req,
      });
    }

    return NextResponse.json({
      success: true,
      data: diagnosis,
      usage: {
        current: usageCount + 1,
        limit: tierLimit,
      },
    });
  } catch (error) {
    console.error("AI Diagnosis Error:", error);
    return NextResponse.json(
      { success: false, message: `Internal Server Error: ${error.message}` },
      { status: 500 }
    );
  }
}
