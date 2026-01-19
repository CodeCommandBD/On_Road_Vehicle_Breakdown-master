import GaragesClient from "./GaragesClient";
import dbConnect from "@/lib/db/mongodb";
import Garage from "@/lib/db/models/Garage";

// Enable ISR with 5 minute revalidation
export const revalidate = 300; // 5 minutes

async function getInitialGarages() {
  try {
    await dbConnect();

    const garages = await Garage.find({ isActive: true })
      .populate("services", "name category")
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(20)
      .lean();

    return JSON.parse(JSON.stringify(garages));
  } catch (error) {
    console.error("Error fetching initial garages:", error);
    return [];
  }
}

export default async function GaragesPage() {
  const initialGarages = await getInitialGarages();

  return <GaragesClient initialGarages={initialGarages} />;
}
