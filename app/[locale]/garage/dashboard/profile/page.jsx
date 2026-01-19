"use client";

import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Loader2,
  Save,
  MapPin,
  Phone,
  Mail,
  Clock,
  Car,
  Info,
  Crown,
  Search,
  BadgeCheck,
  FileText,
  Image as ImageIcon,
  Wrench,
} from "lucide-react";
import LockedFeature from "@/components/common/LockedFeature";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

// Dynamically import MapComponent to avoid SSR issues
const MapComponent = dynamic(() => import("@/components/maps/MapComponent"), {
  ssr: false,
  loading: () => {
    const t = useTranslations("Profile");
    return (
      <div className="h-[300px] w-full bg-white/5 animate-pulse rounded-xl" />
    );
  },
});

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const VEHICLE_TYPES = [
  { value: "car", label: "Car" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "bus", label: "Bus" },
  { value: "truck", label: "Truck" },
  { value: "cng", label: "CNG" },
  { value: "rickshaw", label: "Rickshaw" },
  { value: "other", label: "Other" },
];

export default function GarageProfilePage() {
  const t = useTranslations("Profile");
  const user = useSelector(selectUser);
  const queryClient = useQueryClient();
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocationLocked, setIsLocationLocked] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    description: "",
    address: {
      street: "",
      city: "",
      district: "",
      postalCode: "",
    },
    location: {
      type: "Point",
      coordinates: [90.4125, 23.8103], // Dhaka default
    },
    operatingHours: {},
    is24Hours: false,
    vehicleTypes: [],
    verification: {
      tradeLicense: { number: "", imageUrl: "" },
      nid: { number: "", imageUrl: "" },
      ownerPhoto: "",
    },
    experience: { years: 0, description: "" },
    specializedEquipments: [],
    garageImages: { frontView: "", indoorView: "", additional: [] },
  });
  const [membership, setMembership] = useState(null);

  const { data: profileData, isLoading: isFetching } = useQuery({
    queryKey: ["garageProfile"],
    queryFn: async () => {
      const res = await axiosInstance.get("/garages/profile");
      return res.data.user;
    },
    enabled: !!user?._id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await axiosInstance.put("/garages/profile", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success(t("updateSuccess"));
      queryClient.invalidateQueries(["garageProfile"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("updateFailed"));
    },
  });

  const isLoading = isFetching;
  const isSaving = updateProfileMutation.isPending;

  useEffect(() => {
    if (profileData) {
      const garage = profileData.garage;
      if (!garage) return;

      setMembership({
        tier: garage.membershipTier || "free",
        expiry: garage.membershipExpiry,
      });

      // Initialize operating hours if not exists
      const hours = {};
      DAYS.forEach((day) => {
        hours[day] = garage.operatingHours?.[day] || {
          open: "09:00",
          close: "18:00",
          isClosed: false,
        };
      });

      setFormData({
        name: garage.name || "",
        email: garage.email || "",
        phone: garage.phone || "",
        description: garage.description || "",
        address: garage.address || {
          street: "",
          city: "",
          district: "",
          postalCode: "",
        },
        location: garage.location || {
          type: "Point",
          coordinates: [90.4125, 23.8103],
        },
        operatingHours: hours,
        is24Hours: garage.is24Hours || false,
        vehicleTypes: garage.vehicleTypes || [],
        verification: garage.verification || {
          tradeLicense: { number: "", imageUrl: "" },
          nid: { number: "", imageUrl: "" },
          ownerPhoto: "",
        },
        experience: garage.experience || { years: 0, description: "" },
        specializedEquipments: garage.specializedEquipments || [],
        garageImages: garage.garageImages || {
          frontView: "",
          indoorView: "",
          additional: [],
        },
      });
    }
  }, [profileData]);

  // Handle geocoding (nominatim)
  const handleGeocode = async () => {
    const { street, city, district } = formData.address;
    const query = `${street}, ${city}, ${district}, Bangladesh`;

    setIsGeocoding(true);
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query,
        )}`,
      );
      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        setFormData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: [parseFloat(lon), parseFloat(lat)],
          },
        }));
        toast.success(t("foundOnMap"));
      } else {
        toast.warning(t("notFound"));
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error(t("searchFailed"));
    } finally {
      setIsGeocoding(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error(
        "Your browser doesn't support geolocation. Please use Edit Map to set location manually.",
      );
      return;
    }

    toast.info("Detecting your location...");

    // Unlock map before setting location
    setIsLocationLocked(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: [longitude, latitude],
          },
        }));

        // Show success with save reminder
        toast.success(
          `Location detected: ${latitude.toFixed(4)}, ${longitude.toFixed(
            4,
          )}. Don't forget to save!`,
          { autoClose: 5000 },
        );

        // Lock map after 1 second to allow map to update
        setTimeout(() => {
          setIsLocationLocked(true);
        }, 1000);
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Could not detect location.";

        if (error.code === 1) {
          errorMessage =
            "Location permission denied. Please enable location access or use Edit Map to set manually.";
        } else if (error.code === 2) {
          errorMessage =
            "Location unavailable. If you're on a PC, please use Edit Map to set location manually.";
        } else if (error.code === 3) {
          errorMessage =
            "Location request timeout. Please try again or use Edit Map.";
        }

        toast.error(errorMessage);
        // Lock map again if error occurs
        setIsLocationLocked(true);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const handleLocationSelect = useCallback((latlng) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        coordinates: [latlng.lng, latlng.lat],
      },
    }));
  }, []);

  // Handle input change
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle address change
  const handleAddressChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  // Handle operating hours change
  const handleHoursChange = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value,
        },
      },
    }));
  };

  // Handle vehicle type toggle
  const toggleVehicleType = (type) => {
    setFormData((prev) => ({
      ...prev,
      vehicleTypes: prev.vehicleTypes.includes(type)
        ? prev.vehicleTypes.filter((t) => t !== type)
        : [...prev.vehicleTypes, type],
    }));
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {t("garageTitle")}
          </h1>
          <p className="text-white/60 mb-3">{t("garageInfo")}</p>

          {/* Subscription Status Display */}
          {membership?.tier !== "free" && (
            <div className="inline-flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    new Date(membership.expiry) > new Date()
                      ? "bg-green-500"
                      : "bg-red-500"
                  } animate-pulse`}
                ></div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {membership.tier} PLAN
                </span>
              </div>
              <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
              <div className="text-[11px] text-white/60">
                {new Date(membership.expiry) > new Date() ? (
                  <>
                    Valid until:{" "}
                    <span className="text-white font-medium">
                      {new Date(membership.expiry).toLocaleDateString()}
                    </span>
                    <span className="ml-2 px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full font-bold">
                      {Math.ceil(
                        (new Date(membership.expiry) - new Date()) /
                          (1000 * 60 * 60 * 24),
                      )}{" "}
                      days left
                    </span>
                  </>
                ) : (
                  <span className="text-red-400 font-bold">
                    EXPIRED ON{" "}
                    {new Date(membership.expiry).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t("saving")}
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {t("save")}
            </>
          )}
        </button>
      </div>

      {/* Subscription Plan Section */}
      {membership && (
        <div className="bg-gradient-to-r from-orange-500/10 to-purple-500/10 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">
                  {membership.tier?.toUpperCase()} {t("member")}
                </h2>
                <p className="text-white/60 text-sm">
                  {membership.expiry
                    ? `Valid until ${new Date(
                        membership.expiry,
                      ).toLocaleDateString()}`
                    : "Lifetime Free Access"}
                </p>
              </div>
            </div>
            <Link
              href="/garage/dashboard/subscription"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-all text-center"
            >
              {t("manageZone")}
            </Link>
          </div>
        </div>
      )}

      {/* Verification Status Card */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                formData.verification?.status === "verified"
                  ? "bg-green-500 shadow-green-500/20"
                  : "bg-blue-500 shadow-blue-500/20"
              }`}
            >
              <BadgeCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">
                {t("legalDocs")}
              </h2>
              <p className="text-white/60 text-sm mt-1">
                Status:{" "}
                <span
                  className={`font-bold uppercase ${
                    formData.verification?.status === "verified"
                      ? "text-green-500"
                      : "text-orange-500"
                  }`}
                >
                  {formData.verification?.status
                    ? t(formData.verification.status)
                    : t("pending")}
                </span>
              </p>
            </div>
          </div>
          <Link
            href="/garage/dashboard/verification"
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-all text-center flex items-center justify-center gap-2"
          >
            <FileText size={16} />
            {t("viewDetails")}
          </Link>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Info className="w-5 h-5 text-orange-500" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {t("personalInformation")}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              {t("garageName")} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
              placeholder={t("garageNamePlaceholder")}
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              {t("email")} *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
              placeholder={t("emailPlaceholder")}
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              {t("phone")} *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
              placeholder={t("garagePhonePlaceholder")}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-white/80 text-sm font-medium mb-2">
              {t("description")}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              maxLength={1000}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors resize-none"
              placeholder={t("descPlaceholder")}
            />
            <p className="text-white/40 text-xs mt-1">
              {formData.description.length}/1000 {t("chars")}
            </p>
          </div>
        </div>
      </div>

      {/* Address & Map */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-white">{t("locationSetup")}</h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="md:col-span-2">
              <label className="block text-white/80 text-sm font-medium mb-2">
                {t("address")} *
              </label>
              <input
                type="text"
                value={formData.address.street}
                onChange={(e) => handleAddressChange("street", e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                placeholder={t("garageStreetPlaceholder")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  {t("city")} *
                </label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                  placeholder={t("cityPlaceholder")}
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  {t("district")} *
                </label>
                <input
                  type="text"
                  value={formData.address.district}
                  onChange={(e) =>
                    handleAddressChange("district", e.target.value)
                  }
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                  placeholder={t("districtPlaceholder")}
                />
              </div>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                {t("postalCode")}
              </label>
              <input
                type="text"
                value={formData.address.postalCode}
                onChange={(e) =>
                  handleAddressChange("postalCode", e.target.value)
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                placeholder={t("postalPlaceholder")}
              />
            </div>

            <button
              type="button"
              onClick={handleGeocode}
              disabled={isGeocoding || !formData.address.city}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {isGeocoding ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Search size={18} />
              )}
              {t("findOnMap")}
            </button>
            <p className="text-[10px] text-white/40 italic">
              * After clicking, we will pinpoint your address on the map. You
              can also drag the map or click manually to refine.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="block text-white/80 text-sm font-medium">
                {t("mapPicker")}
              </label>
              <div className="flex items-center gap-2">
                {/* Get Current Location Button */}
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 rounded-lg text-xs font-bold transition-all"
                >
                  <span className="text-base">📍</span>
                  Current Location
                </button>

                {/* Edit Map Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsLocationLocked(!isLocationLocked)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isLocationLocked
                      ? "bg-orange-500/20 text-orange-500 border border-orange-500/30 hover:bg-orange-500/30"
                      : "bg-green-500/20 text-green-500 border border-green-500/30 hover:bg-green-500/30"
                  }`}
                >
                  {isLocationLocked ? <>🛠️ Edit Map</> : <>✅ Confirm</>}
                </button>
              </div>
            </div>

            <div
              className={`relative rounded-2xl overflow-hidden border transition-all ${
                isLocationLocked
                  ? "border-white/10 opacity-80"
                  : "border-green-500/50 ring-2 ring-green-500/20"
              }`}
            >
              <MapComponent
                center={[
                  formData.location.coordinates[1],
                  formData.location.coordinates[0],
                ]}
                zoom={15}
                onLocationSelect={
                  isLocationLocked ? null : handleLocationSelect
                }
                markers={[
                  {
                    lat: formData.location.coordinates[1],
                    lng: formData.location.coordinates[0],
                    content: isLocationLocked
                      ? t("pointOnMap")
                      : t("pointOnMapDesc"),
                  },
                ]}
                className="h-[350px] w-full"
              />
              {isLocationLocked && (
                <div className="absolute inset-0 z-[1001] bg-black/5 cursor-not-allowed group">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white">{t("clickEdit")}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-white/40 bg-white/5 p-3 rounded-lg">
              <div className="flex-1">
                <span className="block font-bold">{t("coordinates")}</span>
                <code>{formData.location.coordinates[0].toFixed(6)}</code>
              </div>
              <div className="flex-1">
                <span className="block font-bold">{t("coordinates")}</span>
                <code>{formData.location.coordinates[1].toFixed(6)}</code>
              </div>
            </div>

            {/* Save Location Button */}
            <button
              type="button"
              onClick={() =>
                updateProfileMutation.mutate({ location: formData.location })
              }
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Location
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Operating Hours */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {t("operatingHours")}
          </h2>
        </div>

        {/* 24 Hours Toggle */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is24Hours}
              onChange={(e) => handleChange("is24Hours", e.target.checked)}
              className="w-5 h-5 rounded accent-orange-500"
            />
            <span className="text-white/80">{t("open247")}</span>
          </label>
        </div>

        {!formData.is24Hours && (
          <div className="space-y-4">
            {DAYS.map((day) => {
              const dayData = formData.operatingHours[day] || {};
              return (
                <div
                  key={day}
                  className="grid grid-cols-12 gap-4 items-center p-4 bg-white/5 rounded-xl"
                >
                  <div className="col-span-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!dayData.isClosed}
                        onChange={(e) =>
                          handleHoursChange(day, "isClosed", !e.target.checked)
                        }
                        className="w-4 h-4 rounded accent-orange-500"
                      />
                      <span className="text-white/90 capitalize font-medium">
                        {day}
                      </span>
                    </label>
                  </div>

                  {!dayData.isClosed ? (
                    <>
                      <div className="col-span-4">
                        <input
                          type="time"
                          value={dayData.open || "09:00"}
                          onChange={(e) =>
                            handleHoursChange(day, "open", e.target.value)
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50"
                        />
                      </div>
                      <div className="col-span-1 text-center text-white/40">
                        {t("to")}
                      </div>
                      <div className="col-span-4">
                        <input
                          type="time"
                          value={dayData.close || "18:00"}
                          onChange={(e) =>
                            handleHoursChange(day, "close", e.target.value)
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="col-span-9 text-white/40 text-sm">
                      {t("closed")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vehicle Types */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Car className="w-5 h-5 text-purple-500" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {t("supportedVehicles")}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {VEHICLE_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => toggleVehicleType(type.value)}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                formData.vehicleTypes.includes(type.value)
                  ? "border-orange-500 bg-orange-500/10"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
            >
              <p className="text-white font-medium">{type.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Workshop Gallery Showcase (Premium) */}
      <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-500">
            <ImageIcon size={20} />
          </div>
          <h2 className="text-xl font-bold text-white">
            Workshop Gallery Showcase
          </h2>
          {(membership?.tier === "premium" ||
            membership?.tier === "enterprise") &&
          (!membership?.expiry || new Date(membership.expiry) > new Date()) ? (
            <span className="px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold uppercase rounded-full">
              PRO
            </span>
          ) : null}
        </div>

        {(membership?.tier === "premium" ||
          membership?.tier === "enterprise") &&
        (!membership?.expiry || new Date(membership.expiry) > new Date()) ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {formData.garageImages.additional.map((img, idx) => (
              <div key={idx} className="relative group aspect-square">
                <img
                  src={img}
                  alt={`Gallery ${idx + 1}`}
                  className="w-full h-full object-cover rounded-xl border border-white/10"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newImgs = [...formData.garageImages.additional];
                    newImgs.splice(idx, 1);
                    setFormData((p) => ({
                      ...p,
                      garageImages: { ...p.garageImages, additional: newImgs },
                    }));
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
            {formData.garageImages.additional.length < 6 && (
              <div className="aspect-square">
                <ImageUpload
                  value=""
                  onChange={(val) => {
                    if (val) {
                      setFormData((p) => ({
                        ...p,
                        garageImages: {
                          ...p.garageImages,
                          additional: [...p.garageImages.additional, val],
                        },
                      }));
                    }
                  }}
                  placeholder="Add Photo"
                />
              </div>
            )}
          </div>
        ) : (
          <LockedFeature
            title="Workshop Gallery Showcase"
            description="Showcase your best work with a dedicated photo gallery. Upgrade to Garage Pro to upload unlimited workshop photos."
          />
        )}
      </section>
    </form>
  );
}
