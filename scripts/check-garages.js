const mongoose = require("mongoose");

const MONGODB_URI = "mongodb://localhost:27017/quickservice";

const garageSchema = new mongoose.Schema({
  name: String,
  location: {
    type: { type: String, default: "Point" },
    coordinates: [Number],
  },
  isActive: Boolean,
  isVerified: Boolean,
});

const Garage = mongoose.models.Garage || mongoose.model("Garage", garageSchema);

async function checkGarages() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected!");

    const count = await Garage.countDocuments();
    console.log(`Total Garages: ${count}`);

    const garages = await Garage.find();
    garages.forEach((g) => {
      console.log(`- Name: ${g.name}`);
      console.log(
        `  Location: ${JSON.stringify(g.location.coordinates)} (Lng, Lat)`
      );
      console.log(`  IsActive: ${g.isActive}`);
      console.log(`  IsVerified: ${g.isVerified}`);
      console.log("---");
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

checkGarages();
