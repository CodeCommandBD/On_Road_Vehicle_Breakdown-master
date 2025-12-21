const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { join } = require("path");

dotenv.config({ path: join(__dirname, "../../.env.local") });

const connectDB = async () => {
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

const migratePlans = async () => {
  await connectDB();

  try {
    // Find plans that are missing the 'type' field or have it undefined
    const result = await Plan.updateMany(
      { type: { $exists: false } },
      { $set: { type: "user" } }
    );

    console.log(
      `Matched and Updated ${result.matchedCount} plans to type: 'user'.`
    );
    process.exit(0);
  } catch (error) {
    console.error("Migration Error:", error);
    process.exit(1);
  }
};

migratePlans();
