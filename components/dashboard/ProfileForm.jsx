"use client";

import { useState, useCallback } from "react";
import {
  User,
  Phone,
  MapPin,
  Car,
  Plus,
  Trash2,
  Save,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { updateUser } from "@/store/slices/authSlice";
import dynamic from "next/dynamic";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import axios from "axios"; // Still needed for Nominatim (external)

// Dynamically import MapComponent
const MapComponent = dynamic(() => import("@/components/maps/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-[250px] w-full bg-gray-100 animate-pulse rounded-xl" />
  ),
});

export default function ProfileForm() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocationLocked, setIsLocationLocked] = useState(true);

  // Local form state - initialized from query data
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
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
    vehicles: [],
  });

  const { isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const response = await axiosInstance.get("/api/profile");
      const data = response.data;
      if (data.success) {
        // Only set form data if it's currently empty or just initialized
        // This is a common pattern for forms: sync once on load
        setFormData({
          name: data.user.name || "",
          phone: data.user.phone || "",
          address: data.user.address || {
            street: "",
            city: "",
            district: "",
            postalCode: "",
          },
          location: data.user.location || {
            type: "Point",
            coordinates: [90.4125, 23.8103],
          },
          vehicles: data.user.vehicles || [],
        });
      }
      return data.user;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedData) => {
      const response = await axiosInstance.put("/profile", updatedData);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Profile updated successfully");
      dispatch(updateUser(data.user));
      queryClient.setQueryData(["userProfile"], data.user);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "An error occurred");
    },
  });

  const saving = updateMutation.isPending;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

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
        toast.success("Location found on map!");
      } else {
        toast.warning("Could not find address. Please mark manually on map.");
      }
    } catch (error) {
      toast.error("Failed to lookup address.");
    } finally {
      setIsGeocoding(false);
    }
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

  const handleAddVehicle = () => {
    if (!newVehicle.make || !newVehicle.model || !newVehicle.licensePlate) {
      toast.warning("Please fill vehicle details");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      vehicles: [...prev.vehicles, newVehicle],
    }));
    setNewVehicle({
      make: "",
      model: "",
      year: new Date().getFullYear(),
      licensePlate: "",
      vehicleType: "Car",
    });
  };

  const handleRemoveVehicle = (index) => {
    setFormData((prev) => ({
      ...prev,
      vehicles: prev.vehicles.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const [newVehicle, setNewVehicle] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    licensePlate: "",
    vehicleType: "Car",
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Personal Information */}
      <section className="bg-[#161616] p-6 rounded-2xl shadow-sm border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#FF532D]/10 rounded-lg text-[#FF532D]">
            <User className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white">Personal Information</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2.5 bg-black/40 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#FF532D]/20 transition-all outline-none"
                placeholder="Ex: John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full p-2.5 bg-black/40 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-[#FF532D]/20 transition-all outline-none"
                placeholder="Ex: 017xxxxxxxx"
                required
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 border-t pt-6">
            <div className="space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <MapPin size={16} /> Address Details
              </h3>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  className="w-full p-2.5 bg-black/40 border border-white/10 text-white rounded-xl text-sm"
                  placeholder="Street"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase">
                    City
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    className="w-full p-2.5 bg-black/40 border border-white/10 text-white rounded-xl text-sm"
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase">
                    District
                  </label>
                  <input
                    type="text"
                    name="address.district"
                    value={formData.address.district}
                    onChange={handleInputChange}
                    className="w-full p-2.5 bg-black/40 border border-white/10 text-white rounded-xl text-sm"
                    placeholder="District"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="address.postalCode"
                  value={formData.address.postalCode}
                  onChange={handleInputChange}
                  className="w-full p-2.5 bg-black/40 border border-white/10 text-white rounded-xl text-sm"
                  placeholder="1200"
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
                Find on Map
              </button>
              <p className="text-[10px] text-white/40 italic">
                * After clicking, we will pinpoint your address on the map. You
                can also drag the map or click manually to refine.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-white text-sm font-bold">
                  Map Picker
                </label>
                <button
                  type="button"
                  onClick={() => setIsLocationLocked(!isLocationLocked)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isLocationLocked
                      ? "bg-orange-500/20 text-orange-500 border border-orange-500/30 hover:bg-orange-500/30"
                      : "bg-green-500/20 text-green-500 border border-green-500/30 hover:bg-green-500/30"
                  }`}
                >
                  {isLocationLocked ? (
                    <>🛠️ Edit Location</>
                  ) : (
                    <>✅ Confirm Location</>
                  )}
                </button>
              </div>

              <div
                className={`relative rounded-2xl overflow-hidden border transition-all ${
                  isLocationLocked
                    ? "border-gray-200 opacity-80"
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
                        ? "Your Location"
                        : "Click to set location",
                    },
                  ]}
                  className="h-[350px] w-full"
                />
                {isLocationLocked && (
                  <div className="absolute inset-0 z-[1001] bg-black/5 cursor-not-allowed group">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-white">
                        Click "Edit Location" to move pin
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-white/60 bg-black/20 p-3 rounded-lg border border-white/10">
                <div className="flex-1">
                  <span className="block font-bold text-white/80">
                    Longitude
                  </span>
                  <code className="text-white">
                    {formData.location.coordinates[0].toFixed(6)}
                  </code>
                </div>
                <div className="flex-1">
                  <span className="block font-bold text-white/80">
                    Latitude
                  </span>
                  <code className="text-white">
                    {formData.location.coordinates[1].toFixed(6)}
                  </code>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#FF532D] text-white rounded-xl font-bold hover:bg-[#FF532D]/90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Profile Changes
            </button>
          </div>
        </form>
      </section>

      {/* Vehicle Management */}
      <section className="bg-[#161616] p-6 rounded-2xl shadow-sm border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
            <Car className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white">My Vehicles</h2>
        </div>

        {/* Vehicle List */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {formData.vehicles.map((v, index) => (
            <div
              key={index}
              className="p-4 bg-black/20 rounded-xl border border-white/10 flex justify-between items-center group"
            >
              <div>
                <p className="font-bold text-white">
                  {v.make} {v.model}
                </p>
                <div className="flex gap-2 text-xs text-white/60 mt-1">
                  <span className="bg-white/10 px-2 py-0.5 rounded uppercase font-semibold text-white/80">
                    {v.licensePlate}
                  </span>
                  <span>{v.year}</span>
                  <span>{v.vehicleType}</span>
                </div>
              </div>
              <button
                onClick={() => handleRemoveVehicle(index)}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add New Vehicle Form */}
        <div className="bg-black/20 p-4 rounded-xl border-2 border-dashed border-white/10">
          <p className="text-sm font-bold mb-3 text-white/80">
            Add New Vehicle
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Make (e.g. Toyota)"
              value={newVehicle.make}
              onChange={(e) =>
                setNewVehicle({ ...newVehicle, make: e.target.value })
              }
              className="p-2.5 bg-black/40 border border-white/10 text-white rounded-lg text-sm placeholder:text-white/40"
            />
            <input
              type="text"
              placeholder="Model (e.g. Corolla)"
              value={newVehicle.model}
              onChange={(e) =>
                setNewVehicle({ ...newVehicle, model: e.target.value })
              }
              className="p-2.5 bg-black/40 border border-white/10 text-white rounded-lg text-sm placeholder:text-white/40"
            />
            <input
              type="text"
              placeholder="License Plate"
              value={newVehicle.licensePlate}
              onChange={(e) =>
                setNewVehicle({ ...newVehicle, licensePlate: e.target.value })
              }
              className="p-2.5 bg-black/40 border border-white/10 text-white rounded-lg text-sm placeholder:text-white/40"
            />
            <select
              value={newVehicle.vehicleType}
              onChange={(e) =>
                setNewVehicle({ ...newVehicle, vehicleType: e.target.value })
              }
              className="p-2.5 bg-black/40 border border-white/10 text-white rounded-lg text-sm"
            >
              <option value="Car">Car</option>
              <option value="Motorcycle">Motorcycle</option>
              <option value="Truck">Truck</option>
              <option value="Van">Van</option>
            </select>
          </div>
          <button
            onClick={handleAddVehicle}
            className="mt-3 w-full py-2 bg-[#FF532D] text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#FF532D]/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Vehicle to List
          </button>
        </div>
      </section>
    </div>
  );
}
