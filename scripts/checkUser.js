// Check if user exists in database
// Run: node scripts/checkUser.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env.local") });

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model("User", userSchema);

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to database");

    const email = "shantokumar00@gmail.com";

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      console.log("❌ User NOT found with email:", email);
      console.log("\n📝 Please create an account first!");
    } else {
      console.log("✅ User found!");
      console.log("📧 Email:", user.email);
      console.log("👤 Name:", user.name);
      console.log("🎭 Role:", user.role);
      console.log("✅ Active:", user.isActive);
      console.log("🔑 Password hash exists:", !!user.password);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

checkUser();
