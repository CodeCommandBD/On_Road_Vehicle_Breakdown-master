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

const verifyGarage = async () => {
  await connectDB();
  const db = mongoose.connection.db;

  // Find first active garage
  const garage = await db.collection("garages").findOne({ isActive: true });

  if (garage) {
    await db
      .collection("garages")
      .updateOne({ _id: garage._id }, { $set: { isVerified: true } });
    console.log(`Verified garage: ${garage.name}`);
  } else {
    console.log("No active garage found to verify.");
  }
  process.exit(0);
};

verifyGarage();
