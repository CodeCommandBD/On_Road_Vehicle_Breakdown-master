"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
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
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import PasswordChangeModal from "@/components/profile/PasswordChangeModal";

export default function ProfilePage() {
  const user = useSelector(selectUser);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    district: "",
    postalCode: "",
  });

  const [vehicles, setVehicles] = useState([]);
  const [newVehicle, setNewVehicle] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    licensePlate: "",
    vehicleType: "Car",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        street: user.address?.street || "",
        city: user.address?.city || "",
        district: user.address?.district || "",
        postalCode: user.address?.postalCode || "",
      });
      setVehicles(user.vehicles || []);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.put("/api/user/profile", {
        name: formData.name,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          district: formData.district,
          postalCode: formData.postalCode,
        },
        vehicles: vehicles,
      });

      if (response.data.success) {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        // Optionally refresh user data
        window.location.reload();
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        street: user.address?.street || "",
        city: user.address?.city || "",
        district: user.address?.district || "",
        postalCode: user.address?.postalCode || "",
      });
    }
    setVehicles(user?.vehicles || []);
    setIsEditing(false);
  };

  const handleAddVehicle = () => {
    if (!newVehicle.make || !newVehicle.model || !newVehicle.licensePlate) {
      toast.warning("Please fill vehicle details");
      return;
    }
    setVehicles((prev) => [...prev, newVehicle]);
    setNewVehicle({
      make: "",
      model: "",
      year: new Date().getFullYear(),
      licensePlate: "",
      vehicleType: "Car",
    });
  };

  const handleRemoveVehicle = (index) => {
    setVehicles((prev) => prev.filter((_, i) => i !== index));
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
            My Profile
          </h1>
          <p className="text-white/60 mt-1">Manage your personal information</p>
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
          <div className="relative -mt-16 sm:-mt-20 mb-4">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-orange flex items-center justify-center text-white font-bold text-4xl sm:text-5xl border-4 border-[#1E1E1E] shadow-glow-orange">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-orange-500 rounded-full hover:bg-orange-600 transition-colors">
              <Camera className="w-4 h-4 text-white" />
            </button>
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
                className={`px-4 py-2 rounded-xl bg-gradient-to-r ${getMembershipColor(
                  user.membershipTier
                )} text-white font-semibold flex items-center gap-2`}
              >
                <Award className="w-4 h-4" />
                {user.membershipTier?.toUpperCase() || "FREE"} Member
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center gap-2 transition-colors border border-white/20"
                >
                  <Edit2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
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
              <p className="text-xs text-white/60 mt-1">Bookings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400">৳0</p>
              <p className="text-xs text-white/60 mt-1">Total Spent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">
                {user.points || 0}
              </p>
              <p className="text-xs text-white/60 mt-1">Points</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {user.isVerified ? "Yes" : "No"}
              </p>
              <p className="text-xs text-white/60 mt-1">Verified</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-4 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">
              Personal Information
            </h3>
            {isEditing && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
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
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                <User className="w-4 h-4" />
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/60 cursor-not-allowed"
              />
              <p className="text-xs text-white/40 mt-1">
                Email cannot be changed
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="+880 1712-345678"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* Role (Read-only) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                <Shield className="w-4 h-4" />
                Account Type
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
                Street Address
              </label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="123 Main Street"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* City */}
            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Dhaka"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* District */}
            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">
                District
              </label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Dhaka"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* Postal Code */}
            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">
                Postal Code
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="1200"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* Member Since */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                <Calendar className="w-4 h-4" />
                Member Since
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
        </div>
      </form>

      {/* Vehicle Management Section */}
      <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-4 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-white">My Vehicles</h3>
          </div>
          {isEditing && (
            <p className="text-xs text-white/40">
              Don't forget to click Save above after adding vehicles
            </p>
          )}
        </div>

        {/* Vehicle List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {vehicles.length > 0 ? (
            vehicles.map((v, index) => (
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
              <p className="text-white/40">No vehicles added yet</p>
            </div>
          )}
        </div>

        {/* Add Vehicle Form (Only when editing) */}
        {isEditing && (
          <div className="bg-white/5 border-2 border-dashed border-white/10 p-5 rounded-2xl">
            <h4 className="text-sm font-bold text-white/80 mb-4">
              Add New Vehicle
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
                  setNewVehicle({ ...newVehicle, licensePlate: e.target.value })
                }
                className="px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:border-orange-500 outline-none"
              />
              <select
                value={newVehicle.vehicleType}
                onChange={(e) =>
                  setNewVehicle({ ...newVehicle, vehicleType: e.target.value })
                }
                className="px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:border-orange-500 outline-none"
              >
                <option value="Car">Car</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddVehicle}
              className="mt-4 w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/10"
            >
              Confirm and Add to List
            </button>
          </div>
        )}
      </div>

      {/* Account Security Section */}
      <div className="bg-[#1E1E1E] border border-white/10 rounded-2xl p-4 sm:p-8">
        <h3 className="text-xl font-semibold text-white mb-4">
          Account Security
        </h3>
        <p className="text-white/60 mb-6">Keep your account secure</p>

        <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/20">
          Change Password
        </button>
      </div>
    </div>
  );
}
