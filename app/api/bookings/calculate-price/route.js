import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Service from "@/lib/db/models/Service";
import Garage from "@/lib/db/models/Garage";
import {
  calculateDistance,
  calculateDynamicPrice,
  getPriceEstimate,
} from "@/lib/utils/pricing";

/**
 * POST /api/bookings/calculate-price
 * Calculate dynamic price for a booking
 */
export async function POST(request) {
  try {
    await connectDB();

    const {
      serviceId,
      garageId,
      customerLocation, // { lat, lng }
      vehicleType,
      isEmergency = false,
      isUrgent = false,
      towingRequested = false,
      scheduledAt,
    } = await request.json();

    // Validate required fields
    if (!serviceId || !customerLocation) {
      return NextResponse.json(
        {
          success: false,
          message: "Service ID and customer location are required",
        },
        { status: 400 }
      );
    }

    // Get service details
    const service = await Service.findById(serviceId);
    if (!service) {
      return NextResponse.json(
        { success: false, message: "Service not found" },
        { status: 404 }
      );
    }

    let distance = 0;
    let garageLocation = null;

    // If garage is specified, calculate distance
    if (garageId) {
      const garage = await Garage.findById(garageId);
      if (!garage) {
        return NextResponse.json(
          { success: false, message: "Garage not found" },
          { status: 404 }
        );
      }

      garageLocation = {
        lat: garage.location.coordinates[1],
        lng: garage.location.coordinates[0],
      };

      distance = calculateDistance(
        customerLocation.lat,
        customerLocation.lng,
        garageLocation.lat,
        garageLocation.lng
      );
    }

    // Calculate price
    const priceBreakdown = calculateDynamicPrice({
      basePrice: service.price || 0,
      distance,
      vehicleType: vehicleType || "car",
      isEmergency,
      isUrgent,
      towingRequested,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
    });

    // Get simplified estimate
    const estimate = getPriceEstimate({
      basePrice: service.price || 0,
      distance,
      vehicleType: vehicleType || "car",
      isEmergency,
      isUrgent,
      towingRequested,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          service: {
            id: service._id,
            name: service.name,
            basePrice: service.price,
          },
          garage: garageId
            ? {
                id: garageId,
                location: garageLocation,
              }
            : null,
          distance: Math.round(distance * 100) / 100,
          priceBreakdown,
          estimate,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Price calculation error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
