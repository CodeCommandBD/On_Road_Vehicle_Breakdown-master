import { notFound } from "next/navigation";
import GarageDetailsClient from "./GarageDetailsClient";
import Garage from "@/lib/db/models/Garage";
import dbConnect from "@/lib/db/mongodb";

// Fetch data on the server
async function getGarage(id) {
  try {
    await dbConnect();
    const garage = await Garage.findById(id).lean();
    if (!garage) return null;
    
    // Convert _id and dates to string for serialization
    return JSON.parse(JSON.stringify(garage));
  } catch (error) {
    console.error("Error fetching garage:", error);
    return null;
  }
}

// Generate Dynamic SEO Metadata
export async function generateMetadata({ params }) {
  const { id } = await params;
  const garage = await getGarage(id);

  if (!garage) {
    return {
      title: "Garage Not Found | On-Road Vehicle Service",
    };
  }

  const title = `${garage.name} - Expert Mechanic in ${garage.address?.city}`;
  const description = `${garage.name} offers reliable ${garage.services?.[0]?.name || "vehicle repair"} services in ${garage.address?.city}. Rated ${garage.rating?.average || 5}/5. Open ${garage.is24Hours ? "24/7" : "standard hours"}.`;
  
  const imageUrl = garage.images?.[0]?.url 
    ? garage.images[0].url
    : "https://on-road-vehicle-breakdown.vercel.app/og-image.jpg"; // Fallback image

  return {
    title: {
      absolute: title, // Overrides the template
    },
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: garage.name,
        },
      ],
      type: "website", 
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [imageUrl],
    },
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  const garage = await getGarage(id);

  if (!garage) {
    notFound();
  }

  return <GarageDetailsClient garage={garage} id={id} />;
}
