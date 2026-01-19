import ServicesClient from "./ServicesClient";
import dbConnect from "@/lib/db/mongodb";
import Service from "@/lib/db/models/Service";

// Enable ISR with 10 minute revalidation
export const revalidate = 600; // 10 minutes

async function getInitialServices() {
  try {
    await dbConnect();

    const services = await Service.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .lean();

    return JSON.parse(JSON.stringify(services));
  } catch (error) {
    console.error("Error fetching initial services:", error);
    return [];
  }
}

export default async function ServicesPage() {
  const initialServices = await getInitialServices();

  return <ServicesClient initialServices={initialServices} />;
}
