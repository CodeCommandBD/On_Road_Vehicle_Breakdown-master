const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

// Import Models
const User = require("../lib/db/models/User").default;
const Booking = require("../lib/db/models/Booking").default;
const connectDB = require("../lib/db/connect").default;

async function migrate() {
  try {
    await connectDB();
    console.log("Connected to DB");

    const users = await User.find({});
    console.log(`Found ${users.length} users. Starting migration...`);

    for (const u of users) {
      const stats = await Booking.aggregate([
        { $match: { user: u._id, status: "completed" } },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            totalSpent: {
              $sum: { $ifNull: ["$actualCost", "$estimatedCost"] },
            },
          },
        },
      ]);

      if (stats.length > 0) {
        u.totalBookings = stats[0].totalBookings;
        u.totalSpent = stats[0].totalSpent;
        await u.save();
        console.log(
          `Updated ${u.email}: ${u.totalBookings} bookings, ৳${u.totalSpent} spent`
        );
      } else {
        // Reset to 0 if no completed bookings found (for accuracy)
        if (u.totalBookings !== 0 || u.totalSpent !== 0) {
          u.totalBookings = 0;
          u.totalSpent = 0;
          await u.save();
          console.log(`Reset ${u.email} to 0`);
        }
      }
    }
    console.log("Migration complete.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
