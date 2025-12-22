const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

async function reset() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    const TeamInvitation = mongoose.connection.db.collection("teaminvitations");
    const result = await TeamInvitation.updateOne(
      { email: "pikacu1830@gmail.com" },
      {
        $set: { status: "pending" },
        $unset: { acceptedAt: "", acceptedBy: "" },
      }
    );

    console.log("Reset Result:", result);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

reset();
