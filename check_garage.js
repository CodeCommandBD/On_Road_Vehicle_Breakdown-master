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

async function checkGarage() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("No MONGODB_URI");
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);

    const garage = await Garage.findOne({ name: /Tongi/i });
    if (garage) {
      console.log("Garage found:", garage.name);
      console.log("isVerified:", garage.isVerified);
    } else {
      console.log("Garage not found");
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
  }
}

checkGarage();
