const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { join } = require("path");

dotenv.config({ path: join(__dirname, "../../.env.local") });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected to:", process.env.MONGODB_URI.split("@")[1]); // Log partial URI for safety
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

const checkDB = async () => {
  await connectDB();

  // Check collections
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(
    "Collections:",
    collections.map((c) => c.name)
  );

  // Check specific plans collection
  const count = await mongoose.connection.db
    .collection("plans")
    .countDocuments();
  console.log("Raw Plans Count:", count);

  if (count > 0) {
    const plans = await mongoose.connection.db
      .collection("plans")
      .find({})
      .toArray();
    console.log("Plans found:", plans);
  }

  process.exit(0);
};

checkDB();
