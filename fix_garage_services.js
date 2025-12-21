const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

// Define Minimal Inline Schemas to avoid import issues
const garageSchema = new mongoose.Schema(
  {
    name: String,
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
    location: {
      type: { type: String, default: "Point" },
      coordinates: [Number],
    },
  },
  { strict: false }
); // Strict false to allow other fields to exist without definition

const serviceSchema = new mongoose.Schema(
  {
    name: String,
    slug: String,
    category: String,
  },
  { strict: false }
);

const Garage = mongoose.models.Garage || mongoose.model("Garage", garageSchema);
const Service =
  mongoose.models.Service || mongoose.model("Service", serviceSchema);

async function fixGarageServices() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const services = await Service.find({});
    console.log(`Found ${services.length} services`);

    if (services.length === 0) {
      console.log("No services found! Seed them first.");
      process.exit(1);
    }

    const garages = await Garage.find({});
    console.log(`Found ${garages.length} garages`);

    const serviceIds = services.map((s) => s._id);

    for (const garage of garages) {
      // Assign all services to every garage for now (or a random subset)
      // For testing "Near Me" + "Service", it's best if the garage HAS the service.
      // Let's give every garage ALL services to ensure matches.

      garage.services = serviceIds;
      await garage.save();
      console.log(
        `Updated garage: ${garage.name} with ${serviceIds.length} services`
      );
    }

    console.log("All garages updated!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

fixGarageServices();
