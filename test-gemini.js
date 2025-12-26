const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

async function testGemini() {
  const apiKey = process.env.GOOGLE_API_KEY;
  console.log("Checking API Key...");

  if (!apiKey) {
    console.error("❌ ERROR: GOOGLE_API_KEY is missing in .env.local file");
    return;
  }

  console.log("API Key found (length: " + apiKey.length + ")");
  console.log("Fetching available models via REST API...");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const data = await response.json();

    if (data.error) {
      console.error("❌ API Error:", JSON.stringify(data.error, null, 2));
    } else {
      console.log(
        "✅ Available Models:",
        data.models?.map((m) => m.name)
      );
    }
  } catch (error) {
    console.error("❌ Network catch Error:", error);
  }
}

testGemini();
