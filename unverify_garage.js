const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const garageSchema = new mongoose.Schema(
  {
    name: String,
    isVerified: Boolean,
  },
  { strict: false }
);

const Garage = mongoose.models.Garage || mongoose.model("Garage", garageSchema);

async function unverifyGarage() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("No MONGODB_URI");
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);

    // Find Tongi garage and update
    const result = await Garage.updateOne(
      { name: /Tongi/i },
      { $set: { isVerified: false } }
    );

    if (result.matchedCount > 0) {
      console.log("Successfully un-verified Tongi garage.");
    } else {
      console.log("Garage not found.");
    }

    // Verify the change
    const garage = await Garage.findOne({ name: /Tongi/i });
    if (garage) {
      console.log(
        "Current status:",
        garage.name,
        "isVerified:",
        garage.isVerified
      );
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
  }
}

unverifyGarage();
