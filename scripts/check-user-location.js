const mongoose = require("mongoose");

// Standard connect string from lib/db/connect.js
const MONGODB_URI = "mongodb://localhost:27017/quickservice";

async function checkUser(email) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Define a minimal schema since we just want to read
    const User =
      mongoose.models.User ||
      mongoose.model(
        "User",
        new mongoose.Schema(
          {
            email: String,
            name: String,
            location: Object,
          },
          { strict: false }
        )
      );

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User with email ${email} not found`);
    } else {
      console.log(`User found: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Location: ${JSON.stringify(user.location, null, 2)}`);
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error);
  }
}

// User email from screenshot: shantokunaree@gmail.com
checkUser("shantokunaree@gmail.com");
