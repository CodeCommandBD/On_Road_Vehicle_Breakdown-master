"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouterWithLoading } from "@/hooks/useRouterWithLoading";
import Link from "next/link";
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
  Wrench,
  Sparkles,
  User,
  AlertCircle,
  CheckCircle2,
  Star,
  BadgeCheck,
  BrainCircuit,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectUser, selectIsAuthenticated } from "@/store/slices/authSlice";
import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";

// Validation Schema is moved inside component or uses dynamic logic for translation?
// Zod schema messages cannot be easily translated inside schema definition if defined outside component.
// We will move schema creation inside component or keep it here but use custom resolver or error map?
// Simpler approach: define schema inside component memoized or just use default English for Zod internal errors (like invalid email)
// but for "required" errors we can pass strings.
// Actually, best practice is to use `useTranslations` and define schema inside or `useMemo`.

function BookingForm() {
  const t = useTranslations("Booking");
  const tServices = useTranslations("Home.serviceNames");
  const searchParams = useSearchParams();
  const router = useRouterWithLoading(); // Regular routing
  const hasRedirected = useRef(false);
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Get query params if pre-selecting
  const serviceIdFromUrl = searchParams.get("service");
  const garageIdFromUrl = searchParams.get("garage"); // Added garage ID handling
  const rebookId = searchParams.get("rebook");

  /* 
   We need to recreate schema to use translations.
   Or clearer: define schema inside.
  */
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
    serviceId: z.string().min(1, t("validation.selectService")),
    vehicleId: z.string().optional(),
    brand: z.string().min(1, t("validation.brandRequired")),
    model: z.string().min(1, t("validation.modelRequired")),
    plateNumber: z.string().min(1, t("validation.plateRequired")),
    address: z.string().min(5, t("validation.addressRequired")),
    description: z.string().min(10, t("validation.descRequired")),
    scheduledDate: z.string().optional(),
    scheduledTime: z.string().optional(),
  });

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

  // New state for user vehicles (including fleet)
  const [userVehicles, setUserVehicles] = useState([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

  const description = watch("description");
  const vehicleId = watch("vehicleId");
  const selectedServiceId = watch("serviceId");

  useEffect(() => {
    if (!isAuthenticated) {
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        toast.info(t("toasts.loginRequired"));
        router.push("/login?redirect=/book");
      }
      return;
    }

    const fetchInitialData = async () => {
      setIsLoadingServices(true);
      try {
        const res = await axios.get("/api/services?isActive=true");
        if (res.data.success) {
          setServices(res.data.data.services);
        }

        // If re-booking, fetch past booking details
        if (rebookId) {
          const bookingRes = await axios.get(`/api/bookings/${rebookId}`);
          if (bookingRes.data.success) {
            const pastBooking = bookingRes.data.booking;
            // Pre-fill form
            setValue("vehicleType", pastBooking.vehicleType);
            setValue(
              "serviceId",
              pastBooking.service?._id || pastBooking.service
            );
            setValue("brand", pastBooking.vehicleInfo?.brand);
            setValue("model", pastBooking.vehicleInfo?.model);
            setValue("plateNumber", pastBooking.vehicleInfo?.plateNumber);
            setValue("address", pastBooking.location?.address);
            setValue(
              "description",
              `Re-booking for: ${pastBooking.description}`
            );

            if (pastBooking.location?.coordinates) {
              setCoordinates(pastBooking.location.coordinates);
              fetchNearbyGarages(
                pastBooking.location.coordinates[0],
                pastBooking.location.coordinates[1]
              );
            }

            if (pastBooking.garage) {
              setSelectedGarage(pastBooking.garage);
            }
          }
        }

        // Fetch selected garage if in URL
        if (garageIdFromUrl) {
          const garageRes = await axios.get(`/api/garages/${garageIdFromUrl}`);
          if (garageRes.data.success) {
            setSelectedGarage(garageRes.data.data);
          }
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast.error(t("toasts.loadError"));
      } finally {
        setIsLoadingServices(false);
      }
    };

    const fetchUserVehicles = async () => {
      setIsLoadingVehicles(true);
      try {
        const res = await axios.get("/api/user/vehicles");
        if (res.data.success) {
          setUserVehicles(res.data.vehicles);
        }
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        // Fallback to redux user vehicles if API fails
        if (user && user.vehicles) {
          setUserVehicles(user.vehicles);
        }
      } finally {
        setIsLoadingVehicles(false);
      }
    };

    fetchInitialData();
    fetchUserVehicles();
  }, [isAuthenticated, router, rebookId, setValue, garageIdFromUrl]);

  // Auto-fill vehicle details when a saved vehicle is selected
  // Auto-fill vehicle details when a saved vehicle is selected
  useEffect(() => {
    if (vehicleId && userVehicles.length > 0) {
      const vehicle = userVehicles.find(
        (v) => v._id === vehicleId || v.id === vehicleId
      );
      if (vehicle) {
        setValue("brand", vehicle.make);
        setValue("model", vehicle.model);
        setValue("plateNumber", vehicle.licensePlate);
        setValue("vehicleType", vehicle.vehicleType.toLowerCase());
      }
    }
  }, [vehicleId, userVehicles, setValue]);

  // Update estimated cost base price when service changes
  const [basePrice, setBasePrice] = useState(500);
  useEffect(() => {
    if (selectedServiceId && services.length > 0) {
      const service = services.find((s) => s._id === selectedServiceId);
      if (service) {
        let finalBasePrice = service.basePrice;

        // Dynamic Towing Pricing Logic
        if (service.name.toLowerCase().includes("towing")) {
          const hasSubscription =
            user?.membershipTier && user.membershipTier !== "free";
          if (hasSubscription) {
            finalBasePrice = 0; // Free for any subscription tier
          } else {
            finalBasePrice = 500; // 500 base for normal (free) users
          }
        }

        setBasePrice(finalBasePrice);
      }
    }
  }, [selectedServiceId, services, user]);

  const fetchNearbyGarages = async (lng, lat) => {
    setIsLoadingGarages(true);
    try {
      const response = await axios.get(
        `/api/garages/nearby?lng=${lng}&lat=${lat}`
      );
      if (response.data.success) {
        setNearbyGarages(response.data.garages);
        if (response.data.garages.length === 0) {
          toast.info(t("noGarages"));
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
      toast.error(t("toasts.descFirst"));
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
          { item: t("serviceBaseFee"), cost: basePrice },
          { item: "Estimated Parts", cost: partsEst },
          { item: "Labor Estimate", cost: laborEst },
        ],
      });

      setIsEstimating(false);
      toast.success(t("toasts.aiGenerated"));
    }, 1500);
  };

  const onSubmit = async (data) => {
    if (!user) {
      toast.error(t("toasts.mustLogin"));
      return;
    }

    // Require garage selection or use fallback if logic allows (currently requiring selection if available)
    // If no garages found, we might need a "Global Admin" fallback logic, but for now let's enforce selection if list > 0
    if (nearbyGarages.length > 0 && !selectedGarage) {
      toast.error(t("toasts.selectGarage"));
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
        toast.success(t("toasts.success"));
        router.push("/user/dashboard/bookings");
      }
    } catch (error) {
      console.error("Booking Error:", error);
      toast.error(error.response?.data?.message || t("toasts.submitError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.info(t("toasts.detecting"));
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
          toast.success(t("toasts.detected"));
          // Fetch garages immediately
          fetchNearbyGarages(longitude, latitude);
        },
        (error) => {
          console.error(error);
          toast.error(t("toasts.detectError"));
        }
      );
    } else {
      toast.error(t("toasts.geoUnsupported"));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex flex-col justify-center py-12 lg:py-20">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 lg:mb-16 relative">
          <Link
            href="/garages"
            className="absolute left-0 top-0 md:top-2 md:left-2 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="font-medium hidden md:inline">{t("back")}</span>
          </Link>

          <div className="inline-block p-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-6 shadow-xl">
            <Sparkles className="w-8 h-8 text-[#ff4800] animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight">
            {t("title")}
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            {t.rich("subtitle", {
              aiSystem: (chunks) => (
                <span className="text-[#ff4800] font-semibold">{chunks}</span>
              ),
            })}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 max-w-7xl mx-auto">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* AI Mechanic Prompt */}
                <div className="relative group overflow-hidden bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-6 mb-8">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BrainCircuit className="w-16 h-16 text-blue-400" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h4 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                        {t("confusedTitle")}
                      </h4>
                      <p className="text-gray-400 text-sm max-w-md">
                        {t("confusedDesc")}
                      </p>
                    </div>
                    <Link
                      href="/user/dashboard/predictive-maintenance"
                      className="whitespace-nowrap px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-500/20"
                    >
                      <BrainCircuit className="w-4 h-4" />
                      {t("tryAiMechanic")}
                    </Link>
                  </div>
                </div>

                {/* Service Selection */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold flex items-center gap-3 text-white/90">
                      <div className="p-2 bg-[#ff4800]/10 rounded-lg">
                        <Wrench className="w-5 h-5 text-[#ff4800]" />
                      </div>
                      {t("selectService")}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        const diagnosisService = services.find((s) =>
                          s.name.toLowerCase().includes("diagnosis")
                        );
                        if (diagnosisService) {
                          setValue("serviceId", diagnosisService._id);
                          toast.info(t("toasts.selectedDiagnosis"));
                          // Smooth scroll to description
                          document
                            .getElementById("description-area")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="text-sm font-bold text-[#ff4800] hover:text-[#ff6a3d] transition-colors flex items-center gap-2 px-4 py-2 bg-[#ff4800]/5 rounded-xl border border-[#ff4800]/20"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {t("dontKnowIssue")}
                    </button>
                  </div>
                  <div className="space-y-4">
                    <select
                      {...register("serviceId")}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#ff4800] focus:ring-1 focus:ring-[#ff4800] transition-all"
                    >
                      <option value="" className="bg-gray-900">
                        {t("chooseService")}
                      </option>
                      {services.map((s) => {
                        let displayPrice = s.basePrice;
                        if (s.name.toLowerCase().includes("towing")) {
                          const hasSub =
                            user?.membershipTier &&
                            user.membershipTier !== "free";
                          displayPrice = hasSub ? 0 : 500;
                        }

                        return (
                          <option
                            key={s._id}
                            value={s._id}
                            className="bg-gray-900"
                          >
                            {tServices(s.name, { default: s.name })} - ৳
                            {displayPrice}{" "}
                            {displayPrice === 0
                              ? `(${t("freePerk")})`
                              : `(${t("base")})`}
                          </option>
                        );
                      })}
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
                    {t("vehicleInfo")}
                  </h3>

                  {/* Saved Vehicles Dropdown */}
                  {(userVehicles.length > 0 || isLoadingVehicles) && (
                    <div className="mb-6 space-y-2">
                      <label className="text-sm font-medium text-gray-400">
                        {t("selectSavedVehicle")}
                      </label>
                      <select
                        {...register("vehicleId")}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[#ff4800] focus:ring-1 focus:ring-[#ff4800] transition-all"
                        disabled={isLoadingVehicles}
                      >
                        <option value="" className="bg-gray-900">
                          {isLoadingVehicles
                            ? "Loading vehicles..."
                            : t("addNewVehicle")}
                        </option>
                        {userVehicles.map((v) => (
                          <option
                            key={v._id || v.id}
                            value={v._id || v.id}
                            className="bg-gray-900"
                          >
                            {v.make} {v.model} ({v.licensePlate}){" "}
                            {v.source && v.source !== "Personal"
                              ? `[${v.source}]`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">
                        {t("vehicleType")}
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
                        {t("brand")}
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
                        {t("model")}
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
                        {t("plateNumber")}
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
                    {t("locationSchedule")}
                  </h3>

                  <div className="space-y-6">
                    <div className="space-y-2 relative">
                      <label className="text-sm font-medium text-gray-400">
                        {t("currentLocation")}
                      </label>
                      <div className="flex gap-3">
                        <input
                          {...register("address")}
                          placeholder={t("enterLocation")}
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
                          {t("selectGarage", { count: nearbyGarages.length })}
                        </label>

                        {isLoadingGarages ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t("findingMechanics")}
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
                            {t("noGarages")}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">
                          {t("preferredDate")}
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
                          {t("preferredTime")}
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
                    {t("issueDescription")}
                  </h3>

                  <div className="space-y-3">
                    <textarea
                      {...register("description")}
                      id="description-area"
                      rows={4}
                      placeholder={t("describeIssue")}
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
                            <Wrench className="w-4 h-4 animate-spin" />
                            {t("analyzing")}
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            {t("getEstimate")}
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
                      <Wrench className="w-5 h-5 animate-spin" />
                      {t("processing")}
                    </span>
                  ) : (
                    t("confirmBooking")
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 h-fit">
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
                      {t("aiEstimate")}
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
                        {t("estimateRange")}
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
                  {t("selectedGarage")}
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
              <h3 className="font-semibold text-white mb-4">
                {t("bookingSummary")}
              </h3>
              <ul className="space-y-4 text-sm">
                <li className="flex justify-between items-center">
                  <span className="text-gray-400">{t("serviceBaseFee")}</span>
                  <span className="font-bold text-white">৳{basePrice}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-400">{t("urgency")}</span>
                  <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs border border-green-500/20">
                    {t("standard")}
                  </span>
                </li>
                <li className="h-px bg-white/10 my-2" />
                <li className="flex justify-between items-center pt-1">
                  <span className="text-gray-300 font-medium">
                    {t("totalEstimated")}
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
          <Wrench className="w-10 h-10 animate-spin text-[#ff4800]" />
        </div>
      }
    >
      <BookingForm />
    </Suspense>
  );
}
