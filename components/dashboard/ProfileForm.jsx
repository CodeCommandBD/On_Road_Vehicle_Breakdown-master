"use client";

import { useState, useEffect, useCallback } from "react";
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
import axios from "axios";

// Dynamically import MapComponent
const MapComponent = dynamic(() => import("@/components/maps/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-[250px] w-full bg-gray-100 animate-pulse rounded-xl" />
  ),
});

export default function ProfileForm() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocationLocked, setIsLocationLocked] = useState(true);
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

  const [newVehicle, setNewVehicle] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    licensePlate: "",
    vehicleType: "Car",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.success) {
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
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

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
          query
        )}`
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
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Profile updated successfully");
        dispatch(updateUser(data.user));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Personal Information */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-100 rounded-lg text-primary">
            <User className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold">Personal Information</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                placeholder="Ex: John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full p-2.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                placeholder="Ex: 017xxxxxxxx"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 border-t pt-6">
            <div className="space-y-4">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <MapPin size={16} /> Address Details
              </h3>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  className="w-full p-2.5 bg-gray-50 border rounded-xl text-sm"
                  placeholder="Street"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    City
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    className="w-full p-2.5 bg-gray-50 border rounded-xl text-sm"
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    District
                  </label>
                  <input
                    type="text"
                    name="address.district"
                    value={formData.address.district}
                    onChange={handleInputChange}
                    className="w-full p-2.5 bg-gray-50 border rounded-xl text-sm"
                    placeholder="District"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="address.postalCode"
                  value={formData.address.postalCode}
                  onChange={handleInputChange}
                  className="w-full p-2.5 bg-gray-50 border rounded-xl text-sm"
                  placeholder="1207"
                />
              </div>

              <button
                type="button"
                onClick={handleGeocode}
                disabled={isGeocoding || !formData.address.city}
                className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-all disabled:opacity-50 border border-blue-100 mt-2"
              >
                {isGeocoding ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Search size={16} />
                )}
                Set Map from Address
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-700">
                  Map Location (Home/Base)
                </h3>
                <button
                  type="button"
                  onClick={() => setIsLocationLocked(!isLocationLocked)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    isLocationLocked
                      ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                      : "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200"
                  }`}
                >
                  {isLocationLocked ? "🛠️ Edit" : "✅ Confirm"}
                </button>
              </div>

              <div
                className={`relative rounded-2xl overflow-hidden border transition-all ${
                  isLocationLocked
                    ? "border-gray-200"
                    : "ring-2 ring-green-500/20 border-green-500/50"
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
                        ? "Locked"
                        : "Setting Location...",
                    },
                  ]}
                  className="h-[250px] w-full"
                />
                {isLocationLocked && (
                  <div className="absolute inset-0 z-[1001] bg-black/5 cursor-not-allowed flex items-center justify-center group">
                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Click "Edit" to move
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-gray-400 italic text-center">
                Your default service location is pinned here
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center gap-2"
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
      <section className="bg-white p-6 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <Car className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold">My Vehicles</h2>
        </div>

        {/* Vehicle List */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {formData.vehicles.map((v, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 rounded-xl border flex justify-between items-center group"
            >
              <div>
                <p className="font-bold text-gray-900">
                  {v.make} {v.model}
                </p>
                <div className="flex gap-2 text-xs text-gray-500 mt-1">
                  <span className="bg-gray-200 px-2 py-0.5 rounded uppercase font-semibold">
                    {v.licensePlate}
                  </span>
                  <span>{v.year}</span>
                  <span>{v.vehicleType}</span>
                </div>
              </div>
              <button
                onClick={() => handleRemoveVehicle(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add New Vehicle Form */}
        <div className="bg-gray-50 p-4 rounded-xl border-2 border-dashed">
          <p className="text-sm font-bold mb-3 text-gray-600">
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
              className="p-2.5 bg-white border rounded-lg text-sm"
            />
            <input
              type="text"
              placeholder="Model (e.g. Corolla)"
              value={newVehicle.model}
              onChange={(e) =>
                setNewVehicle({ ...newVehicle, model: e.target.value })
              }
              className="p-2.5 bg-white border rounded-lg text-sm"
            />
            <input
              type="text"
              placeholder="License Plate"
              value={newVehicle.licensePlate}
              onChange={(e) =>
                setNewVehicle({ ...newVehicle, licensePlate: e.target.value })
              }
              className="p-2.5 bg-white border rounded-lg text-sm"
            />
            <select
              value={newVehicle.vehicleType}
              onChange={(e) =>
                setNewVehicle({ ...newVehicle, vehicleType: e.target.value })
              }
              className="p-2.5 bg-white border rounded-lg text-sm"
            >
              <option value="Car">Car</option>
              <option value="Motorcycle">Motorcycle</option>
              <option value="Truck">Truck</option>
              <option value="Van">Van</option>
            </select>
          </div>
          <button
            onClick={handleAddVehicle}
            className="mt-3 w-full py-2 bg-gray-800 text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-black transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Vehicle to List
          </button>
        </div>
      </section>
    </div>
  );
}
