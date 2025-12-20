import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectDB from "@/lib/db/connection";
import Diagnosis from "@/lib/db/models/Diagnosis";
import { headers } from "next/headers";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { userId, symptoms, vehicleContext } = body;

    if (!userId || !symptoms) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Act as an expert automotive mechanic with 20 years of experience.
      Analyze the following vehicle symptoms and provide a diagnosis.
      
      Vehicle: ${vehicleContext?.model || "Generic Car"} (${
      vehicleContext?.year || "Unknown Year"
    })
      Symptoms: "${symptoms}"
      
      Output MUST be valid JSON with this exact structure:
      {
        "possibleCause": "Brief title of the issue (English + Bangla translation in brackets)",
        "estimatedCost": "Estimated cost range in BDT (৳)",
        "immediateAction": "One clear actionable step (English + Bangla)",
        "severity": "Low" | "Medium" | "High" | "Critical",
        "preventiveMeasures": ["Measure 1", "Measure 2"]
      }

      Example format:
      {
        "possibleCause": "Worn Brake Pads (ক্ষয়প্রাপ্ত ব্রেক প্যাড)",
        "estimatedCost": "৳2,500 - ৳4,000",
        "immediateAction": "Inspect brake pads immediately (তাৎক্ষণিকভাবে ব্রেক প্যাড পরীক্ষা করুন)",
        "severity": "High",
        "preventiveMeasures": ["Check brake fluid", "Avoid hard braking"]
      }
      
      Ensure the cost estimation is realistic for Bangladesh local reliable workshops.
      Do not include markdown formatting or backticks in the response, just the raw JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up potential markdown code blocks if AI adds them
    const cleanJson = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let analysis;
    try {
      analysis = JSON.parse(cleanJson);
    } catch (e) {
      console.error("AI JSON Parse Error:", e, "Raw Text:", text);
      // Fallback if AI fails to return valid JSON
      analysis = {
        possibleCause: "Complex Issue (জটিল সমস্যা)",
        estimatedCost: "৳500 (Consultation)",
        immediateAction: "Visit a workshop for manual inspection.",
        severity: "Medium",
        preventiveMeasures: ["Drive carefully"],
      };
    }
    // --- REAL AI ANALYSIS END ---

    // Save to Database
    const diagnosis = await Diagnosis.create({
      user: userId,
      symptoms,
      analysis,
      vehicleType: vehicleContext?.type || "Car",
    });

    return NextResponse.json({
      success: true,
      data: diagnosis,
    });
  } catch (error) {
    console.error("AI Diagnosis Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
