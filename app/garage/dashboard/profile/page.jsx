"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import {
  Loader2,
  Save,
  MapPin,
  Phone,
  Mail,
  Clock,
  Car,
  Info,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

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
  const user = useSelector(selectUser);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
      coordinates: [90.4125, 23.8103], // Dhaka default
    },
    operatingHours: {},
    is24Hours: false,
    vehicleTypes: [],
  });

  // Fetch garage profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const response = await axios.get("/api/garages/profile");

        if (response.data.success) {
          const garage = response.data.garage;

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
              coordinates: [90.4125, 23.8103],
            },
            operatingHours: hours,
            is24Hours: garage.is24Hours || false,
            vehicleTypes: garage.vehicleTypes || [],
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

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
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await axios.put("/api/garages/profile", formData);

      if (response.data.success) {
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
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
          <h1 className="text-3xl font-bold text-white mb-2">Garage Profile</h1>
          <p className="text-white/60">
            Manage your garage business information and operating hours
          </p>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Basic Information */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Info className="w-5 h-5 text-orange-500" />
          </div>
          <h2 className="text-xl font-bold text-white">Basic Information</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Garage Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
              placeholder="Enter garage name"
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
              placeholder="garage@example.com"
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
              placeholder="+880 1XXX-XXXXXX"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-white/80 text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              maxLength={1000}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors resize-none"
              placeholder="Describe your garage services and specialties..."
            />
            <p className="text-white/40 text-xs mt-1">
              {formData.description.length}/1000 characters
            </p>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-white">Location</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-white/80 text-sm font-medium mb-2">
              Street Address *
            </label>
            <input
              type="text"
              value={formData.address.street}
              onChange={(e) => handleAddressChange("street", e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
              placeholder="123 Main Street"
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              City *
            </label>
            <input
              type="text"
              value={formData.address.city}
              onChange={(e) => handleAddressChange("city", e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
              placeholder="Dhaka"
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              District *
            </label>
            <input
              type="text"
              value={formData.address.district}
              onChange={(e) => handleAddressChange("district", e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
              placeholder="Dhaka"
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Postal Code
            </label>
            <input
              type="text"
              value={formData.address.postalCode}
              onChange={(e) =>
                handleAddressChange("postalCode", e.target.value)
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 transition-colors"
              placeholder="1200"
            />
          </div>
        </div>
      </div>

      {/* Operating Hours */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-white">Operating Hours</h2>
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
            <span className="text-white/80">Open 24/7</span>
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
                        to
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
                      Closed
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
            Supported Vehicle Types
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
    </form>
  );
}
