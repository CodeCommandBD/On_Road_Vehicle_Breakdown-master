const mongoose = require("mongoose");
const { connectDB } = require("./lib/db/connect");

async function run() {
  try {
    await connectDB();

    // Define schema if model not found
    const integrationSchema = new mongoose.Schema({
      user: mongoose.Schema.Types.ObjectId,
      webhookUrl: String,
      isActive: Boolean,
    });

    const Integration =
      mongoose.models.Integration ||
      mongoose.model("Integration", integrationSchema);

    const integrations = await Integration.find({});
    console.log("INTEGRATIONS_START");
    console.log(JSON.stringify(integrations, null, 2));
    console.log("INTEGRATIONS_END");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
