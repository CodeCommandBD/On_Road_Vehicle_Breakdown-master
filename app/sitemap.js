import connectDB from "@/lib/db/connect";
import Garage from "@/lib/db/models/Garage";
import Service from "@/lib/db/models/Service";

/**
 * Dynamic Sitemap Generator
 * Generates sitemap.xml for search engines
 */
export default async function sitemap() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://on-road-vehicle-service.com";
  const currentDate = new Date().toISOString();

  // Static routes
  const staticRoutes = [
    {
      url: `${baseUrl}/en`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/bn`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/en/about`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/bn/about`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/en/services`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/bn/services`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/en/garages`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/bn/garages`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/en/login`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/bn/login`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/en/signup`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/bn/signup`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  let dynamicRoutes = [];

  try {
    // Attempt to fetch dynamic routes
    // This try-catch ensures the build doesn't fail if DB is unreachable
    await connectDB();

    // 1. Garage Profiles
    const garages = await Garage.find({ isVerified: true })
      .select("_id")
      .limit(100);

    const garageRoutes = garages.flatMap((garage) => [
      {
        url: `${baseUrl}/en/garages/${garage._id}`,
        lastModified: currentDate,
        changeFrequency: "weekly",
        priority: 0.8,
      },
      {
        url: `${baseUrl}/bn/garages/${garage._id}`,
        lastModified: currentDate,
        changeFrequency: "weekly",
        priority: 0.8,
      },
    ]);

    // 2. Services
    const services = await Service.find({ isActive: true })
      .select("_id")
      .limit(50);

    const serviceRoutes = services.flatMap((service) => [
      {
        url: `${baseUrl}/en/services/${service._id}`,
        lastModified: currentDate,
        changeFrequency: "weekly",
        priority: 0.7,
      },
      {
        url: `${baseUrl}/bn/services/${service._id}`,
        lastModified: currentDate,
        changeFrequency: "weekly",
        priority: 0.7,
      },
    ]);

    dynamicRoutes = [...garageRoutes, ...serviceRoutes];
  } catch (error) {
    console.warn(
      "⚠️ Failed to generate dynamic sitemap routes:",
      error.message
    );
    // Continue with static routes only
  }

  return [...staticRoutes, ...dynamicRoutes];
}
