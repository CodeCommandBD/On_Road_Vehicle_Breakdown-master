/**
 * Seed script to create an initial Admin account
 * Run with: node lib/db/seedAdmin.js
 */

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: ".env.local" });

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "garage", "admin"], default: "user" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function seedAdmin() {
  try {
    console.log("🌱 Connecting to database...");

    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI not found in .env.local");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected successfully!");

    const adminEmail = "admin@onroad.com"; // Default admin email
    const adminPassword = "AdminPassword123!"; // Default secure password

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log("⚠️  Admin account already exists.");
      process.exit(0);
    }

    console.log("📝 Creating Admin account...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const admin = new User({
      name: "System Administrator",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    await admin.save();

    console.log("\n✅ Admin account created successfully!");
    console.log(`   📧 Email: ${adminEmail}`);
    console.log(`   🔑 Password: ${adminPassword}`);
    console.log("\n🚀 You can now login using these credentials.\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error seeding Admin:", error.message);
    process.exit(1);
  }
}

seedAdmin();
