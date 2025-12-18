"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import {
  Car,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Loader2,
  Sparkles,
  Wrench,
  User,
  AlertCircle,
  CheckCircle2,
  Star,
  BadgeCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectUser, selectIsAuthenticated } from "@/store/slices/authSlice";

// Validation Schema
const bookingSchema = z.object({
  vehicleType: z.enum([
    "car",
    "motorcycle",
    "bus",
    "truck",
    "cng",
    "rickshaw",
    "other",
  ]),
  serviceId: z.string().min(1, "Please select a service"),
  vehicleId: z.string().optional(),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  plateNumber: z.string().min(1, "Plate number is required"),
  address: z.string().min(5, "Location address is required"),
  description: z.string().min(10, "Please describe the issue in detail"),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
});

function BookingForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [coordinates, setCoordinates] = useState(null); // [long, lat]

  // Data Fetching State
  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [nearbyGarages, setNearbyGarages] = useState([]);
  const [isLoadingGarages, setIsLoadingGarages] = useState(false);
  const [selectedGarage, setSelectedGarage] = useState(null);

  // Get query params if pre-selecting
  const serviceIdFromUrl = searchParams.get("service");

  useEffect(() => {
    if (!isAuthenticated) {
      toast.info("Please login to book a service");
      router.push("/login?callbackUrl=/book");
      return;
    }

    const fetchInitialData = async () => {
      setIsLoadingServices(true);
      try {
        const res = await axios.get("/api/services?isActive=true");
        if (res.data.success) {
          setServices(res.data.data.services);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        toast.error("Failed to load services");
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchInitialData();
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      vehicleType: "car",
      serviceId: serviceIdFromUrl || "",
      vehicleId: "",
      brand: "",
      model: "",
      plateNumber: "",
      address: "",
      description: "",
    },
  });

  const description = watch("description");
  const vehicleId = watch("vehicleId");
  const selectedServiceId = watch("serviceId");

  // Auto-fill vehicle details when a saved vehicle is selected
  useEffect(() => {
    if (vehicleId && user?.vehicles) {
      const vehicle = user.vehicles.find(
        (v) => v._id === vehicleId || v.id === vehicleId
      );
      if (vehicle) {
        setValue("brand", vehicle.make);
        setValue("model", vehicle.model);
        setValue("plateNumber", vehicle.licensePlate);
        setValue("vehicleType", vehicle.vehicleType.toLowerCase());
      }
    }
  }, [vehicleId, user, setValue]);

  // Update estimated cost base price when service changes
  const [basePrice, setBasePrice] = useState(500);
  useEffect(() => {
    if (selectedServiceId && services.length > 0) {
      const service = services.find((s) => s._id === selectedServiceId);
      if (service) {
        setBasePrice(service.basePrice);
      }
    }
  }, [selectedServiceId, services]);

  const fetchNearbyGarages = async (lng, lat) => {
    setIsLoadingGarages(true);
    try {
      const response = await axios.get(
        `/api/garages/nearby?lng=${lng}&lat=${lat}`
      );
      if (response.data.success) {
        setNearbyGarages(response.data.garages);
        if (response.data.garages.length === 0) {
          toast.info(
            "No verified garages found nearby. You can still request, admins will assign one."
          );
        }
      }
    } catch (error) {
      console.error("Error fetching garages:", error);
      toast.error("Could not load nearby garages");
    } finally {
      setIsLoadingGarages(false);
    }
  };

  const handleEstimateCost = async () => {
    if (!description || description.length < 10) {
      toast.error("Please enter a detailed description first");
      return;
    }

    setIsEstimating(true);
    // Dynamic AI estimation based on selected service base price
    setTimeout(() => {
      const partsEst = Math.floor(Math.random() * 1000) + 500;
      const laborEst = Math.floor(basePrice * 0.5);
      const totalMin = basePrice + partsEst + laborEst;

      setEstimatedCost({
        min: totalMin,
        max: totalMin + 1000,
        confidence: "85%",
        breakdown: [
          { item: "Service Base Charge", cost: basePrice },
          { item: "Estimated Parts", cost: partsEst },
          { item: "Labor Estimate", cost: laborEst },
        ],
      });
      setIsEstimating(false);
      toast.success("AI Cost Estimation Generated!");
    }, 1500);
  };

  const onSubmit = async (data) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    // Require garage selection or use fallback if logic allows (currently requiring selection if available)
    // If no garages found, we might need a "Global Admin" fallback logic, but for now let's enforce selection if list > 0
    if (nearbyGarages.length > 0 && !selectedGarage) {
      toast.error("Please select a garage from the list");
      return;
    }

    // Use selected garage ID or a fallback/admin-pool ID if absolutely no key is found
    // IMPORTANT: In a real "admin assign" model, garage might be null initially.
    // But since the DB requires it, we must provide one.
    // If user didn't select logic: picking the first one or a specific default "HQ" ID might be needed.
    // Let's assume user MUST select if available.

    // Fallback ID strictly for development if no garages exist in DB yet
    const finalGarageId = selectedGarage?._id || null; // Will be null if admin needs to assign
    const finalServiceId = data.serviceId;

    // Use detected coordinates or default
    const finalCoordinates = coordinates || [90.4125, 23.8103];

    setIsSubmitting(true);
    try {
      const payload = {
        user: user._id || user.id,
        garage: selectedGarage?._id || null, // Will be null if admin needs to assign
        service: data.serviceId,
        vehicleType: data.vehicleType,
        vehicleInfo: {
          brand: data.brand,
          model: data.model,
          plateNumber: data.plateNumber,
        },
        location: {
          type: "Point",
          coordinates: finalCoordinates,
          address: data.address,
        },
        description: data.description,
        estimatedCost: estimatedCost ? estimatedCost.min : basePrice,
        status: "pending",
        scheduledAt: data.scheduledDate
          ? new Date(`${data.scheduledDate}T${data.scheduledTime || "00:00"}`)
          : null,
      };

      const response = await axios.post("/api/bookings", payload);

      if (response.data.success) {
        toast.success("Booking request submitted successfully!");
        router.push("/user/dashboard/bookings");
      }
    } catch (error) {
      console.error("Booking Error:", error);
      toast.error(error.response?.data?.message || "Failed to submit booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.info("Detecting location...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoordinates([longitude, latitude]);
          setValue(
            "address",
            `Detected Location (Lat: ${latitude.toFixed(
              4
            )}, Long: ${longitude.toFixed(4)})`
          );
          toast.success("Location detected!");
          // Fetch garages immediately
          fetchNearbyGarages(longitude, latitude);
        },
        (error) => {
          console.error(error);
          toast.error("Unable to retrieve location. Please enter manually.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex flex-col justify-center py-12 lg:py-20">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 lg:mb-16">
          <div className="inline-block p-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-6 shadow-xl">
            <Sparkles className="w-8 h-8 text-[#ff4800] animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight">
            Book a Service
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Fill in the details below. Our{" "}
            <span className="text-[#ff4800] font-semibold">
              AI-powered system
            </span>{" "}
            will match you with the best garage and estimate the cost.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 max-w-7xl mx-auto">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Service Selection */}
                <div>
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-white/90">
                    <div className="p-2 bg-[#ff4800]/10 rounded-lg">
                      <Wrench className="w-5 h-5 text-[#ff4800]" />
                    </div>
                    Select Service
                  </h3>
                  <div className="space-y-4">
                    <select
                      {...register("serviceId")}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#ff4800] focus:ring-1 focus:ring-[#ff4800] transition-all"
                    >
                      <option value="" className="bg-gray-900">
                        Choose a service...
                      </option>
                      {services.map((s) => (
                        <option
                          key={s._id}
                          value={s._id}
                          className="bg-gray-900"
                        >
                          {s.name} - ৳{s.basePrice} (Base)
                        </option>
                      ))}
                    </select>
                    {errors.serviceId && (
                      <p className="text-red-500 text-sm">
                        {errors.serviceId.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                {/* Vehicle Details */}
                <div>
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-white/90">
                    <div className="p-2 bg-[#ff4800]/10 rounded-lg">
                      <Car className="w-5 h-5 text-[#ff4800]" />
                    </div>
                    Vehicle Information
                  </h3>

                  {/* Saved Vehicles Dropdown */}
                  {user?.vehicles?.length > 0 && (
                    <div className="mb-6 space-y-2">
                      <label className="text-sm font-medium text-gray-400">
                        Select from your Saved Vehicles
                      </label>
                      <select
                        {...register("vehicleId")}
                        className="w-full bg-black/40 border border-[#ff4800]/30 rounded-xl p-3 text-white outline-none focus:border-[#ff4800] focus:ring-1 focus:ring-[#ff4800] transition-all"
                      >
                        <option value="" className="bg-gray-900">
                          Add a new vehicle manually
                        </option>
                        {user.vehicles.map((v) => (
                          <option
                            key={v._id || v.id}
                            value={v._id || v.id}
                            className="bg-gray-900"
                          >
                            {v.make} {v.model} ({v.licensePlate})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">
                        Vehicle Type
                      </label>
                      <select
                        {...register("vehicleType")}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#ff4800] focus:ring-1 focus:ring-[#ff4800] transition-all"
                      >
                        <option value="car" className="bg-gray-900">
                          Car
                        </option>
                        <option value="motorcycle" className="bg-gray-900">
                          Motorcycle
                        </option>
                        <option value="cng" className="bg-gray-900">
                          CNG
                        </option>
                        <option value="bus" className="bg-gray-900">
                          Bus
                        </option>
                        <option value="truck" className="bg-gray-900">
                          Truck
                        </option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">
                        Brand
                      </label>
                      <input
                        {...register("brand")}
                        placeholder="e.g. Toyota"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder-gray-600 outline-none focus:border-[#ff4800] focus:ring-1 focus:ring-[#ff4800] transition-all"
                      />
                      {errors.brand && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.brand.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">
                        Model
                      </label>
                      <input
                        {...register("model")}
                        placeholder="e.g. Corolla"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder-gray-600 outline-none focus:border-[#ff4800] focus:ring-1 focus:ring-[#ff4800] transition-all"
                      />
                      {errors.model && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.model.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">
                        Plate Number
                      </label>
                      <input
                        {...register("plateNumber")}
                        placeholder="e.g. DHAKA METRO GA 12-3456"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder-gray-600 outline-none focus:border-[#ff4800] focus:ring-1 focus:ring-[#ff4800] transition-all"
                      />
                      {errors.plateNumber && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.plateNumber.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                {/* Location */}
                <div>
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-white/90">
                    <div className="p-2 bg-[#ff4800]/10 rounded-lg">
                      <MapPin className="w-5 h-5 text-[#ff4800]" />
                    </div>
                    Location & Schedule
                  </h3>

                  <div className="space-y-6">
                    <div className="space-y-2 relative">
                      <label className="text-sm font-medium text-gray-400">
                        Current Location / Address
                      </label>
                      <div className="flex gap-3">
                        <input
                          {...register("address")}
                          placeholder="Enter pickup/service location"
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder-gray-600 outline-none focus:border-[#ff4800] focus:ring-1 focus:ring-[#ff4800] transition-all"
                        />
                        <button
                          type="button"
                          onClick={getCurrentLocation}
                          className="px-4 bg-[#ff4800]/20 text-[#ff4800] hover:bg-[#ff4800] hover:text-white rounded-xl transition-all flex items-center justify-center border border-[#ff4800]/30"
                          title="Get Current Location"
                        >
                          <MapPin className="w-5 h-5" />
                        </button>
                      </div>
                      {errors.address && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.address.message}
                        </p>
                      )}
                    </div>

                    {/* Nearby Garages Section */}
                    {coordinates && (
                      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                        <label className="text-sm font-medium text-gray-400 block mb-3">
                          Select Nearby Garage ({nearbyGarages.length} found)
                        </label>

                        {isLoadingGarages ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Finding nearby mechanics...
                          </div>
                        ) : nearbyGarages.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {nearbyGarages.map((garage) => (
                              <div
                                key={garage._id}
                                onClick={() => setSelectedGarage(garage)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                                  selectedGarage?._id === garage._id
                                    ? "bg-[#ff4800]/10 border-[#ff4800] ring-1 ring-[#ff4800]"
                                    : "bg-black/40 border-white/10 hover:border-white/30"
                                }`}
                              >
                                {garage.isVerified && (
                                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-500/20">
                                    <BadgeCheck size={10} /> Verified
                                  </div>
                                )}
                                {!garage.isVerified && (
                                  <div className="absolute top-2 right-2 bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-500/20">
                                    New
                                  </div>
                                )}
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                                    <Wrench className="w-5 h-5 text-gray-400" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-white text-sm pr-16 truncate">
                                      {garage.name}
                                    </h4>
                                    <div className="flex items-center gap-1 text-xs text-yellow-500">
                                      <Star className="w-3 h-3 fill-yellow-500" />
                                      {garage.rating?.average || "New"}
                                    </div>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-1">
                                  {garage.address?.street},{" "}
                                  {garage.address?.city}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-yellow-500">
                            No garages found nearby. Don&apos;t worry, admins
                            will assign one manually!
                          </p>
                        )}
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">
                          Preferred Date
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="date"
                            {...register("scheduledDate")}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pl-10 text-white placeholder-gray-600 outline-none focus:border-[#ff4800] focus:ring-1 focus:ring-[#ff4800] transition-all [color-scheme:dark]"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">
                          Preferred Time
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="time"
                            {...register("scheduledTime")}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pl-10 text-white placeholder-gray-600 outline-none focus:border-[#ff4800] focus:ring-1 focus:ring-[#ff4800] transition-all [color-scheme:dark]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                {/* Description */}
                <div>
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-white/90">
                    <div className="p-2 bg-[#ff4800]/10 rounded-lg">
                      <FileText className="w-5 h-5 text-[#ff4800]" />
                    </div>
                    Issue Description
                  </h3>

                  <div className="space-y-3">
                    <textarea
                      {...register("description")}
                      rows={4}
                      placeholder="Please describe what's wrong with your vehicle..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 outline-none focus:border-[#ff4800] focus:ring-1 focus:ring-[#ff4800] transition-all resize-none"
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm">
                        {errors.description.message}
                      </p>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleEstimateCost}
                        disabled={isEstimating}
                        className="text-sm text-[#ff4800] font-medium hover:text-[#ff6a3d] flex items-center gap-2 transition-colors"
                      >
                        {isEstimating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Analyzing with AI...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Get AI Cost Estimate
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#ff4800] to-[#ff6a3d] hover:from-[#e64200] hover:to-[#e65c2e] text-white py-4 text-lg font-bold rounded-xl shadow-lg shadow-orange-900/20 transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing Booking...
                    </span>
                  ) : (
                    "Confirm Booking"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* AI Estimate Card */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#ff4800] to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles className="w-24 h-24 text-white" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-white">
                      <Sparkles className="w-5 h-5 text-[#ff4800]" />
                      AI Estimate
                    </h3>
                    {estimatedCost && (
                      <span className="bg-[#ff4800]/20 text-[#ff4800] text-xs px-2 py-1 rounded-md border border-[#ff4800]/20 font-medium">
                        {estimatedCost.confidence} match
                      </span>
                    )}
                  </div>

                  {estimatedCost ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                        ৳{estimatedCost.min} - ৳{estimatedCost.max}
                      </div>
                      <p className="text-gray-400 text-sm mb-6">
                        Estimated Total Cost range based on similar repairs
                      </p>

                      <div className="space-y-3 border-t border-white/10 pt-4">
                        {estimatedCost.breakdown.map((item, i) => (
                          <div
                            key={i}
                            className="flex justify-between text-sm items-center"
                          >
                            <span className="text-gray-400 flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3 text-[#ff4800]" />
                              {item.item}
                            </span>
                            <span className="text-white font-medium">
                              ৳{item.cost}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 group-hover:border-[#ff4800]/50 transition-colors">
                        <Sparkles className="w-8 h-8 text-gray-500 group-hover:text-[#ff4800] transition-colors" />
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        Desribe your vehicle's issue and let our AI predict the
                        cost breakdown instantly.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Garage Info */}
            {selectedGarage && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-[#ff4800]" />
                  Selected Garage
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-800 rounded-xl flex items-center justify-center border border-white/5">
                    {selectedGarage.images?.[0] ? (
                      <img
                        src={selectedGarage.images[0].url}
                        alt={selectedGarage.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <Wrench className="w-6 h-6 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">
                      {selectedGarage.name}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <MapPin className="w-3 h-3" />
                      <span>{selectedGarage.address?.city}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Booking Summary</h3>
              <ul className="space-y-4 text-sm">
                <li className="flex justify-between items-center">
                  <span className="text-gray-400">Service Base Fee</span>
                  <span className="font-bold text-white">৳{basePrice}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-400">Urgency</span>
                  <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs border border-green-500/20">
                    Standard
                  </span>
                </li>
                <li className="h-px bg-white/10 my-2" />
                <li className="flex justify-between items-center pt-1">
                  <span className="text-gray-300 font-medium">
                    Total (Estimated)
                  </span>
                  <span className="font-bold text-[#ff4800] text-lg">
                    ৳{estimatedCost ? estimatedCost.min : basePrice}+
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 flex justify-center items-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#ff4800]" />
        </div>
      }
    >
      <BookingForm />
    </Suspense>
  );
}
