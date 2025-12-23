// Quick script to check all packages in database
const mongoose = require("mongoose");

async function checkPackages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/vehicle-breakdown"
    );

    const Package =
      mongoose.models.Package ||
      mongoose.model("Package", new mongoose.Schema({}, { strict: false }));

    // Get all packages
    const allPackages = await Package.find({}).lean();

    console.log("\n=== ALL PACKAGES IN DATABASE ===\n");
    console.log(`Total: ${allPackages.length} packages\n`);

    // Group by type
    const userPackages = allPackages.filter((p) => p.type === "user");
    const garagePackages = allPackages.filter((p) => p.type === "garage");

    console.log("USER PACKAGES:");
    userPackages.forEach((p) => {
      console.log(
        `  - ${p.name} (${p.tier}) - Active: ${p.isActive}, Featured: ${
          p.isFeatured || false
        }`
      );
    });

    console.log("\nGARAGE PACKAGES:");
    garagePackages.forEach((p) => {
      console.log(
        `  - ${p.name} (${p.tier}) - Active: ${p.isActive}, Featured: ${
          p.isFeatured || false
        }`
      );
    });

    console.log("\n=== END ===\n");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkPackages();
