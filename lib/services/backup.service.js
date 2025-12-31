import User from "@/lib/db/models/User";
import Garage from "@/lib/db/models/Garage";
import Booking from "@/lib/db/models/Booking";
import Review from "@/lib/db/models/Review";
import Payment from "@/lib/db/models/Payment";
import Subscription from "@/lib/db/models/Subscription";
import Service from "@/lib/db/models/Service";
import Organization from "@/lib/db/models/Organization";
import TeamMember from "@/lib/db/models/TeamMember";
import SupportTicket from "@/lib/db/models/SupportTicket";
import dbConnect from "@/lib/db/mongodb";

export async function generateBackup() {
  await dbConnect();

  const timestamp = new Date().toISOString();

  // Fetch critical data
  // Using .lean() for performance since we just need the JSON
  const [
    users,
    garages,
    bookings,
    reviews,
    payments,
    subscriptions,
    services,
    organizations,
    teams,
    tickets,
  ] = await Promise.all([
    User.find({}).lean(),
    Garage.find({}).lean(),
    Booking.find({}).lean(),
    Review.find({}).lean(),
    Payment.find({}).lean(),
    Subscription.find({}).lean(),
    Service.find({}).lean(),
    Organization.find({}).lean(),
    TeamMember.find({}).lean(),
    SupportTicket.find({}).lean(),
  ]);

  // Sanitize Users (Remove passwords)
  const sanitizedUsers = users.map((u) => {
    const { password, ...rest } = u;
    return rest;
  });

  return {
    metadata: {
      timestamp,
      version: "1.0",
      counts: {
        users: users.length,
        garages: garages.length,
        bookings: bookings.length,
        payments: payments.length,
      },
    },
    data: {
      users: sanitizedUsers,
      garages,
      bookings,
      reviews,
      payments,
      subscriptions,
      services,
      organizations,
      teams,
      tickets,
    },
  };
}
