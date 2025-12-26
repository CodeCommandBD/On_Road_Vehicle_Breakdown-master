"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, updateUser } from "@/store/slices/authSlice";
import dynamic from "next/dynamic";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Edit2,
  Camera,
  Save,
  X,
  Loader2,
  Award,
  Navigation,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import PasswordChangeModal from "@/components/profile/PasswordChangeModal";
import ImageUpload from "@/components/common/ImageUpload";
import { useTranslations } from "next-intl";

// Dynamically import MapComponent to avoid SSR issues
const MapComponent = dynamic(() => import("@/components/maps/MapComponent"), {
  ssr: false,
  loading: () => {
    const t = useTranslations("Common");
    return (
      <div className="h-[300px] w-full bg-white/5 animate-pulse rounded-xl flex items-center justify-center border border-white/10">
        <p className="text-white/40">{t("loading")}</p>
      </div>
    );
  },
});

export default function ProfilePage() {
  const t = useTranslations("Profile");
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    district: "",
    postalCode: "",
    location: {
      type: "Point",
      coordinates: [90.4125, 23.8103],
    },
    vehicles: [],
  });

  const [newVehicle, setNewVehicle] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    licensePlate: "",
    vehicleType: "Car",
  });

  // Ref to always hold the latest formData to avoid stale closures in handleSubmit
  const profileDataRef = useRef(profileFormData);

  useEffect(() => {
    profileDataRef.current = profileFormData;
  }, [profileFormData]);

  useEffect(() => {
    if (user && !isEditing && !isLoading) {
      console.log("Initializing ProfileForm with user data:", user.location);
      setProfileFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        street: user.address?.street || "",
        city: user.address?.city || "",
        district: user.address?.district || "",
        postalCode: user.address?.postalCode || "",
        location: user.location || {
          type: "Point",
          coordinates: [90.4125, 23.8103],
        },
        vehicles: Array.isArray(user.vehicles) ? user.vehicles : [],
      });
    }
  }, [user, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLocationSelect = useCallback((latlng) => {
    setProfileFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        coordinates: [latlng.lng, latlng.lat],
      },
    }));
  }, []);

  const handleGeocode = async () => {
    const { street, city, district } = profileFormData;
    const query = `${street}, ${city}, ${district}`;
    if (!street || !city) {
      toast.info(t("enterStreetCity"));
      return;
    }

    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}`
      );
      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        setProfileFormData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: [parseFloat(lon), parseFloat(lat)],
          },
        }));
        toast.success(t("foundOnMap"));
      } else {
        toast.error(t("notFound"));
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error(t("searchFailed"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const currentData = profileDataRef.current;

    // Explicitly reconstruct the payload to ensure NO KEYS are missing
    const payload = {
      name: currentData.name || "",
      phone: currentData.phone || "",
      avatar: currentData.avatar || "",
      address: {
        street: currentData.street || "",
        city: currentData.city || "",
        district: currentData.district || "",
        postalCode: currentData.postalCode || "",
      },
      location: {
        type: "Point",
        coordinates: currentData.location?.coordinates || [90.4125, 23.8103],
      },
      vehicles: Array.isArray(currentData.vehicles) ? currentData.vehicles : [],
    };

    console.log("FINAL SUBMISSION PAYLOAD:", JSON.stringify(payload));

    try {
      const response = await axios.put("/api/profile", payload);

      if (response.data.success) {
        console.log(
          "Profile update success. Response user location:",
          response.data.user.location
        );
        const updatedUser = response.data.user;

        // Update local state immediately to avoid flickers
        setProfileFormData((prev) => ({
          ...prev,
          name: updatedUser.name || "",
          phone: updatedUser.phone || "",
          street: updatedUser.address?.street || "",
          city: updatedUser.address?.city || "",
          district: updatedUser.address?.district || "",
          postalCode: updatedUser.address?.postalCode || "",
          location: updatedUser.location || prev.location,
          vehicles: Array.isArray(updatedUser.vehicles)
            ? updatedUser.vehicles
            : [],
        }));

        toast.success(t("updateSuccess"));

        // Update global state
        dispatch(updateUser(updatedUser));
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.message || t("updateFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setProfileFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        street: user.address?.street || "",
        city: user.address?.city || "",
        district: user.address?.district || "",
        postalCode: user.address?.postalCode || "",
        location: user.location || {
          type: "Point",
          coordinates: [90.4125, 23.8103],
        },
        vehicles: Array.isArray(user.vehicles) ? user.vehicles : [],
      });
    }
    setIsEditing(false);
  };

  const handleAddVehicle = () => {
    if (!newVehicle.make || !newVehicle.model || !newVehicle.licensePlate) {
      toast.warning(t("fillDetails"));
      return;
    }
    setProfileFormData((prev) => ({
      ...prev,
      vehicles: [...(prev.vehicles || []), { ...newVehicle }],
    }));
    setNewVehicle({
      make: "",
      model: "",
      year: new Date().getFullYear(),
      licensePlate: "",
      vehicleType: "Car",
    });
    toast.success(`${newVehicle.make} added to your list.`);
  };

  const handleRemoveVehicle = (index) => {
    setProfileFormData((prev) => ({
      ...prev,
      vehicles: (prev.vehicles || []).filter((_, i) => i !== index),
    }));
  };

  const getMembershipColor = (tier) => {
    const colors = {
      free: "from-gray-500 to-gray-600",
      basic: "from-blue-500 to-blue-600",
      standard: "from-purple-500 to-purple-600",
      premium: "from-yellow-400 to-orange-500",
    };
    return colors[tier] || colors.free;
  };

  if (!user) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {t("title")}
          </h1>
          <p className="text-white/60 mt-1">{t("personalInfo")}</p>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl overflow-hidden">
        {/* Cover Photo */}
        <div className="h-32 sm:h-48 bg-gradient-to-r from-orange-500 to-red-500 relative">
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Profile Info */}
        <div className="relative px-4 sm:px-8 pb-6">
          {/* Avatar */}
          {/* Avatar */}
          <div className="relative -mt-16 sm:-mt-20 mb-4 group">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-orange flex items-center justify-center text-white font-bold text-4xl sm:text-5xl border-4 border-[#1E1E1E] shadow-glow-orange overflow-hidden">
              {profileFormData.avatar ? (
                <img
                  src={profileFormData.avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                user.name?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="absolute bottom-0 right-0 p-2 bg-orange-500 rounded-full hover:bg-orange-600 transition-colors shadow-lg z-10"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
            )}

            {/* Avatar Upload Modal */}
            {showAvatarModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">
                      Update Profile Photo
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAvatarModal(false)}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <ImageUpload
                      label="Upload New Photo"
                      value={profileFormData.avatar}
                      onChange={(url) =>
                        setProfileFormData((prev) => ({
                          ...prev,
                          avatar: url,
                        }))
                      }
                      showPreview={true}
                    />

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setShowAvatarModal(false)}
                        className="px-6 py-2 bg-gradient-orange text-white rounded-xl font-medium transition-all hover:shadow-glow-orange"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Name and Membership */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                {user.name}
              </h2>
              <p className="text-white/60 mt-1">{user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`px-4 py-2 rounded-xl bg-gradient-to-r ${
                  user.membershipExpiry &&
                  new Date(user.membershipExpiry) < new Date()
                    ? "from-red-500 to-red-600"
                    : getMembershipColor(user.membershipTier)
                } text-white font-semibold flex flex-col items-center gap-0.5`}
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  {user.membershipExpiry &&
                  new Date(user.membershipExpiry) < new Date()
                    ? "EXPIRED"
                    : `${user.membershipTier?.toUpperCase() || "FREE"} ${t(
                        "member"
                      )}`}
                </div>
                {user.membershipExpiry && (
                  <span className="text-[10px] opacity-80">
                    {new Date(user.membershipExpiry) < new Date() ? (
                      `Expired on: ${new Date(
                        user.membershipExpiry
                      ).toLocaleDateString()}`
                    ) : (
                      <>
                        Renews on:{" "}
                        {new Date(user.membershipExpiry).toLocaleDateString()}
                        <span className="ml-1 font-extrabold text-orange-300">
                          (
                          {Math.ceil(
                            (new Date(user.membershipExpiry) - new Date()) /
                              (1000 * 60 * 60 * 24)
                          )}{" "}
                          days left)
                        </span>
                      </>
                    )}
                  </span>
                )}
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center gap-2 transition-colors border border-white/20"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("edit")}</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/10">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {user.totalBookings || 0}
              </p>
              <p className="text-xs text-white/60 mt-1">{t("bookings")}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400">৳0</p>
              <p className="text-xs text-white/60 mt-1">{t("totalSpent")}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">
                {user.points || 0}
              </p>
              <p className="text-xs text-white/60 mt-1">{t("points")}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {user.isVerified ? t("yes") : t("no")}
              </p>
              <p className="text-xs text-white/60 mt-1">{t("verified")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-4 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">
              {t("personalInformation")}
            </h3>
            {isEditing && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-gradient-orange text-white rounded-lg flex items-center gap-2 transition-colors hover:shadow-glow-orange disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {t("save")}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                <User className="w-4 h-4" />
                {t("fullName")}
              </label>
              <input
                type="text"
                name="name"
                value={profileFormData.name}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                placeholder={t("namePlaceholder")}
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                <Mail className="w-4 h-4" />
                {t("email")}
              </label>
              <input
                type="email"
                name="email"
                value={profileFormData.email}
                disabled
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/60 cursor-not-allowed"
              />
              <p className="text-xs text-white/40 mt-1">{t("emailFixed")}</p>
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                <Phone className="w-4 h-4" />
                {t("phone")}
              </label>
              <input
                type="tel"
                name="phone"
                value={profileFormData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder={t("phonePlaceholder")}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* Role (Read-only) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                <Shield className="w-4 h-4" />
                {t("accountType")}
              </label>
              <input
                type="text"
                value={user.role?.toUpperCase() || "USER"}
                disabled
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/60 cursor-not-allowed"
              />
            </div>

            {/* Street Address */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                <MapPin className="w-4 h-4" />
                {t("address")}
              </label>
              <input
                type="text"
                name="street"
                value={profileFormData.street}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder={t("streetPlaceholder")}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* City */}
            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">
                {t("city")}
              </label>
              <input
                type="text"
                name="city"
                value={profileFormData.city}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder={t("cityPlaceholder")}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* District */}
            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">
                {t("district")}
              </label>
              <input
                type="text"
                name="district"
                value={profileFormData.district}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder={t("districtPlaceholder")}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* Postal Code */}
            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">
                {t("postalCode")}
              </label>
              <input
                type="text"
                name="postalCode"
                value={profileFormData.postalCode}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder={t("postalPlaceholder")}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* Member Since */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                <Calendar className="w-4 h-4" />
                {t("memberSince")}
              </label>
              <input
                type="text"
                value={
                  user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "N/A"
                }
                disabled
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/60 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Map Section */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  {t("pointOnMap")}
                </h4>
                <p className="text-sm text-white/40 mt-1">
                  {t("pointOnMapDesc")}
                </p>
              </div>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleGeocode}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-all border border-white/10 flex items-center gap-2 self-start"
                >
                  <Navigation className="w-4 h-4" />
                  {t("findOnMap")}
                </button>
              )}
            </div>

            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <MapComponent
                center={[
                  profileFormData.location.coordinates[1],
                  profileFormData.location.coordinates[0],
                ]}
                zoom={15}
                onLocationSelect={isEditing ? handleLocationSelect : null}
                markers={[
                  {
                    lat: profileFormData.location.coordinates[1],
                    lng: profileFormData.location.coordinates[0],
                    content: t("yourLocation"),
                  },
                ]}
                className="h-[350px] w-full"
              />
            </div>
            {isEditing && (
              <p className="text-[10px] text-white/30 mt-3 text-center italic">
                {t("coordinates")}:{" "}
                {profileFormData.location.coordinates[1].toFixed(6)},{" "}
                {profileFormData.location.coordinates[0].toFixed(6)}
              </p>
            )}
          </div>
        </div>

        {/* Vehicle Management Section */}
        <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-4 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                {t("myVehicles")}
              </h3>
            </div>
            {isEditing && (
              <p className="text-xs text-white/40">{t("saveAll")}</p>
            )}
          </div>

          {/* Vehicle List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {profileFormData.vehicles.length > 0 ? (
              profileFormData.vehicles.map((v, index) => (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 p-4 rounded-xl flex justify-between items-center group"
                >
                  <div>
                    <h4 className="font-bold text-white mb-1">
                      {v.make} {v.model}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] font-bold rounded uppercase">
                        {v.licensePlate}
                      </span>
                      <span className="text-xs text-white/40">{v.year}</span>
                      <span className="text-xs text-white/40">
                        {v.vehicleType}
                      </span>
                    </div>
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVehicle(index)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="sm:col-span-2 py-8 text-center bg-white/5 border border-dashed border-white/10 rounded-xl">
                <p className="text-white/40">{t("noVehicles")}</p>
              </div>
            )}
          </div>

          {/* Add Vehicle Form (Only when editing) */}
          {isEditing && (
            <div className="bg-white/5 border-2 border-dashed border-white/10 p-5 rounded-2xl">
              <h4 className="text-sm font-bold text-white/80 mb-4">
                {t("addVehicle")}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Make (e.g. Toyota)"
                  value={newVehicle.make}
                  onChange={(e) =>
                    setNewVehicle({ ...newVehicle, make: e.target.value })
                  }
                  className="px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:border-orange-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Model (e.g. Corolla)"
                  value={newVehicle.model}
                  onChange={(e) =>
                    setNewVehicle({ ...newVehicle, model: e.target.value })
                  }
                  className="px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:border-orange-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="License Plate"
                  value={newVehicle.licensePlate}
                  onChange={(e) =>
                    setNewVehicle({
                      ...newVehicle,
                      licensePlate: e.target.value,
                    })
                  }
                  className="px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:border-orange-500 outline-none"
                />
                <select
                  value={newVehicle.vehicleType}
                  onChange={(e) =>
                    setNewVehicle({
                      ...newVehicle,
                      vehicleType: e.target.value,
                    })
                  }
                  className="px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:border-orange-500 outline-none"
                >
                  <option value="Car" className="bg-[#1A1A1A] text-white">
                    Car
                  </option>
                  <option
                    value="Motorcycle"
                    className="bg-[#1A1A1A] text-white"
                  >
                    Motorcycle
                  </option>
                  <option value="Truck" className="bg-[#1A1A1A] text-white">
                    Truck
                  </option>
                  <option value="Van" className="bg-[#1A1A1A] text-white">
                    Van
                  </option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddVehicle}
                className="mt-4 w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/10"
              >
                {t("confirmAdd")}
              </button>
            </div>
          )}

          {/* Secondary Save Button (Visible only when editing) */}
          {isEditing && (
            <div className="mt-8 flex justify-end border-t border-white/10 pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-orange text-white rounded-xl flex items-center gap-2 transition-all hover:shadow-glow-orange disabled:opacity-50 font-bold"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {t("saveAll")}
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Account Security Section */}
      <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-4 sm:p-8">
        <h3 className="text-xl font-semibold text-white mb-4">
          {t("accountSecurity")}
        </h3>
        <p className="text-white/60 mb-6">{t("keepSecure")}</p>

        <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/20">
          {t("changePassword")}
        </button>
      </div>
    </div>
  );
}
