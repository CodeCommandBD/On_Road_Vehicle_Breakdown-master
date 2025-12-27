const mongoose = require("mongoose");

async function resetBooking() {
  try {
    // Connect to MongoDB
    await mongoose.connect("mongodb://localhost:27017/vehicleBreakdown");

    const Booking = mongoose.model(
      "Booking",
      new mongoose.Schema({}, { strict: false })
    );

    // Find the "pika" booking and reset payment status
    const result = await Booking.updateOne(
      {
        // Update with your actual booking ID or filter
        status: "completed",
        isPaid: true,
      },
      {
        $set: {
          isPaid: false,
          status: "payment_pending",
          paymentInfo: null,
        },
      }
    );

    console.log("✅ Booking reset:", result);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

resetBooking();
