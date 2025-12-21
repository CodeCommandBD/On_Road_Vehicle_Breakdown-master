const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { join } = require("path");

dotenv.config({ path: join(__dirname, "../../.env.local") });

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

const planSchema = new mongoose.Schema({}, { strict: false });
const Plan = mongoose.models.Plan || mongoose.model("Plan", planSchema);

const checkPlans = async () => {
  await connectDB();
  const plans = await Plan.find({});
  console.log("Total Plans:", plans.length);
  plans.forEach((p) => {
    console.log(
      `Plan: ${p.name || "Unnamed"}, Tier: ${p.tier}, Type: ${
        p.type
      }, IsActive: ${p.isActive}`
    );
  });
  process.exit(0);
};

checkPlans();
