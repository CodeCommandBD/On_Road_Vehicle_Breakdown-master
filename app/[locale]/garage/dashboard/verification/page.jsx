"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import Link from "next/link";
import {
  Loader2,
  Save,
  ArrowLeft,
  BadgeCheck,
  FileText,
  Info,
  Wrench,
  ImageIcon,
  User,
  Award,
} from "lucide-react";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";
import axios from "axios";
import ImageUpload from "@/components/common/ImageUpload";

const EQUIPMENT_SUGGESTIONS = [
  "Computer Diagnostic (OBD-II)",
  "Hydraulic Car Lift",
  "Air Compressor",
  "AC Recovery Machine",
  "Engine Crane/Hoist",
  "Wheel Alignment",
  "Battery Tester",
  "Tire Changer",
  "Welding Machine",
  "Fuel Injector Cleaner",
];

export default function GarageVerificationPage() {
  const t = useTranslations("Verification");
  const user = useSelector(selectUser);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    verification: {
      tradeLicense: { number: "", imageUrl: "" },
      nid: { number: "", imageUrl: "" },
      ownerPhoto: "",
      status: "pending",
    },
    experience: { years: 0, description: "" },
    specializedEquipments: [],
    garageImages: { frontView: "", indoorView: "", additional: [] },
    mechanicDetails: {
      leadName: "",
      experienceYears: 0,
      specializations: [],
      certifications: [{ title: "", imageUrl: "" }],
    },
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
          setFormData({
            verification: garage.verification || {
              tradeLicense: { number: "", imageUrl: "" },
              nid: { number: "", imageUrl: "" },
              ownerPhoto: "",
              status: "pending",
            },
            experience: garage.experience || { years: 0, description: "" },
            specializedEquipments: garage.specializedEquipments || [],
            garageImages: garage.garageImages || {
              frontView: "",
              indoorView: "",
              additional: [],
            },
            mechanicDetails: garage.mechanicDetails || {
              leadName: "",
              experienceYears: 0,
              specializations: [],
              certifications: [{ title: "", imageUrl: "" }],
            },
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error(t("loadFailed"));
      } finally {
        setIsLoading(false);
      }
    };

    if (user?._id) {
      fetchProfile();
    }
  }, [user?._id]);

  // Handle nested verification change
  const handleVerificationChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      verification: {
        ...prev.verification,
        [section]:
          typeof prev.verification[section] === "object"
            ? { ...prev.verification[section], [field]: value }
            : value,
      },
    }));
  };

  // Handle nested experience change
  const handleExperienceChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      experience: {
        ...prev.experience,
        [field]: value,
      },
    }));
  };

  // Handle equipment toggle
  const toggleEquipment = (equipment) => {
    setFormData((prev) => ({
      ...prev,
      specializedEquipments: prev.specializedEquipments.includes(equipment)
        ? prev.specializedEquipments.filter((e) => e !== equipment)
        : [...prev.specializedEquipments, equipment],
    }));
  };

  const handleEquipmentKeyDown = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      e.preventDefault();
      const newEquip = e.target.value.trim();
      if (!formData.specializedEquipments.includes(newEquip)) {
        toggleEquipment(newEquip);
      }
      e.target.value = "";
    }
  };

  // Handle mechanic change
  const handleMechanicChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      mechanicDetails: {
        ...prev.mechanicDetails,
        [field]: value,
      },
    }));
  };

  const addCertification = () => {
    setFormData((prev) => ({
      ...prev,
      mechanicDetails: {
        ...prev.mechanicDetails,
        certifications: [
          ...prev.mechanicDetails.certifications,
          { title: "", imageUrl: "" },
        ],
      },
    }));
  };

  const updateCertification = (index, field, value) => {
    const newCerts = [...formData.mechanicDetails.certifications];
    newCerts[index][field] = value;
    handleMechanicChange("certifications", newCerts);
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await axios.put("/api/garages/profile", formData);

      if (response.data.success) {
        toast.success(t("updateSuccess"));
      }
    } catch (error) {
      console.error("Error saving verification:", error);
      toast.error(error.response?.data?.message || t("updateFailed"));
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/garage/dashboard/profile"
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-white"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {t("garageVerif")}
            </h1>
            <p className="text-white/60 text-sm">{t("documentsDesc")}</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/20 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {t("save")}
        </button>
      </div>

      {/* Status Banner */}
      <div
        className={`p-4 rounded-2xl border flex items-center gap-4 ${
          formData.verification.status === "verified"
            ? "bg-green-500/10 border-green-500/20 text-green-500"
            : "bg-orange-500/10 border-orange-500/20 text-orange-500"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            formData.verification.status === "verified"
              ? "bg-green-500/20"
              : "bg-orange-500/20"
            }`}
        >
          <BadgeCheck size={20} />
        </div>
        <div>
          <h3 className="font-bold uppercase text-sm">
            {t("status")}:{" "}
            {formData.verification.status
              ? t(formData.verification.status)
              : t("pending")}
          </h3>
          <p className="text-xs text-white/60">
            {formData.verification.status === "verified"
              ? t("verifiedDesc")
              : t("pendingDesc")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Legal Documents */}
        <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
              <FileText size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">{t("legalDocs")}</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 pb-6 border-b border-white/5 mb-6">
            <div className="space-y-2">
              <label className="text-white/80 text-sm font-medium">
                {t("tradeLicenseNumber")}
              </label>
              <input
                type="text"
                value={formData.verification.tradeLicense.number}
                onChange={(e) =>
                  handleVerificationChange(
                    "tradeLicense",
                    "number",
                    e.target.value
                  )
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50"
                placeholder={t("licenseNoPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-white/80 text-sm font-medium">
                {t("tradeLicenseImage")}
              </label>
              <ImageUpload
                value={formData.verification.tradeLicense.imageUrl}
                onChange={(val) =>
                  handleVerificationChange("tradeLicense", "imageUrl", val)
                }
                placeholder={t("imgUrlPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-white/80 text-sm font-medium">
                {t("nid")}
              </label>
              <input
                type="text"
                value={formData.verification.nid.number}
                onChange={(e) =>
                  handleVerificationChange("nid", "number", e.target.value)
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50"
                placeholder={t("nidPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-white/80 text-sm font-medium">
                {t("nidImg")}
              </label>
              <ImageUpload
                value={formData.verification.nid.imageUrl}
                onChange={(val) =>
                  handleVerificationChange("nid", "imageUrl", val)
                }
                placeholder={t("imgUrlPlaceholder")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-white/80 text-sm font-medium">
              {t("ownerPhoto")}
            </label>
            <ImageUpload
              value={formData.verification.ownerPhoto}
              onChange={(val) =>
                handleVerificationChange("ownerPhoto", null, val)
              }
              placeholder={t("photoPlaceholder")}
              showPreview={true}
            />
          </div>
        </section>

        {/* Professional Details Section */}
        <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500">
              <Wrench size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">{t("profDetails")}</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-6">
            <div className="md:col-span-1 space-y-2">
              <label className="text-white/80 text-sm font-medium">
                {t("expYears")}
              </label>
              <input
                type="number"
                value={formData.experience.years}
                onChange={(e) =>
                  handleExperienceChange("years", parseInt(e.target.value) || 0)
                }
                min="0"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50"
              />
            </div>
            <div className="md:col-span-3 space-y-2">
              <label className="text-white/80 text-sm font-medium">
                {t("profSummary")}
              </label>
              <input
                type="text"
                value={formData.experience.description}
                onChange={(e) =>
                  handleExperienceChange("description", e.target.value)
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50"
                placeholder={t("summaryPlaceholder")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-white/80 text-sm font-medium flex items-center justify-between">
              {t("specializedEquip")}
              <span className="text-[10px] text-white/40 font-normal">
                {t("pressEnter")}
              </span>
            </label>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {formData.specializedEquipments.map((equip, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/10 rounded-full text-xs text-white"
                  >
                    {equip}
                    <button
                      type="button"
                      onClick={() => toggleEquipment(equip)}
                      className="hover:text-orange-500 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                onKeyDown={handleEquipmentKeyDown}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 mb-4"
                placeholder={t("summaryPlaceholder")}
              />

              <div className="space-y-2">
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
                  {t("quickAdd")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => toggleEquipment(sug)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${
                        formData.specializedEquipments.includes(sug)
                          ? "bg-orange-500/20 border-orange-500 text-orange-500"
                          : "bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mechanic Information Section */}
        <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500">
              <User size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">
              {t("mechanicVerif")}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-white/80 text-sm font-medium">
                {t("leadName")}
              </label>
              <input
                type="text"
                value={formData.mechanicDetails.leadName}
                onChange={(e) =>
                  handleMechanicChange("leadName", e.target.value)
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50"
                placeholder={t("leadNamePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-white/80 text-sm font-medium">
                {t("mechExp")}
              </label>
              <input
                type="number"
                value={formData.mechanicDetails.experienceYears}
                onChange={(e) =>
                  handleMechanicChange(
                    "experienceYears",
                    parseInt(e.target.value) || 0
                  )
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50"
                placeholder={t("mechExpPlaceholder")}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-white/80 text-sm font-medium flex items-center gap-2">
                <Award size={16} className="text-orange-500" />
                {t("certs")}
              </label>
              <button
                type="button"
                onClick={addCertification}
                className="text-xs text-blue-500 hover:text-blue-400 font-medium"
              >
                + {t("addAnother")}
              </button>
            </div>

            {formData.mechanicDetails.certifications.map((cert, index) => (
              <div
                key={index}
                className="grid md:grid-cols-2 gap-4 p-4 bg-white/5 rounded-xl border border-white/5"
              >
                <div className="space-y-2">
                  <label className="text-white/40 text-[10px] uppercase font-bold tracking-wider">
                    {t("certTitle")}
                  </label>
                  <input
                    type="text"
                    value={cert.title}
                    onChange={(e) =>
                      updateCertification(index, "title", e.target.value)
                    }
                    className="w-full bg-transparent border-b border-white/10 py-1 text-white text-sm focus:outline-none focus:border-orange-500"
                    placeholder={t("certPlaceholder")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-white/40 text-[10px] uppercase font-bold tracking-wider">
                    {t("imgUrl")}
                  </label>
                  <ImageUpload
                    value={cert.imageUrl}
                    onChange={(val) =>
                      updateCertification(index, "imageUrl", val)
                    }
                    placeholder={t("imgUrlPlaceholder")}
                    className="-mt-1"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Images */}
        <section className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500">
              <ImageIcon size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">
              {t("garagePhotos")}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-white/80 text-sm font-medium">
                {t("frontView")}
              </label>
              <ImageUpload
                value={formData.garageImages.frontView}
                onChange={(val) =>
                  setFormData((p) => ({
                    ...p,
                    garageImages: {
                      ...p.garageImages,
                      frontView: val,
                    },
                  }))
                }
                placeholder={t("frontPlaceholder")}
                showPreview={true}
              />
            </div>
            <div className="space-y-2">
              <label className="text-white/80 text-sm font-medium">
                {t("indoorView")}
              </label>
              <ImageUpload
                value={formData.garageImages.indoorView}
                onChange={(val) =>
                  setFormData((p) => ({
                    ...p,
                    garageImages: {
                      ...p.garageImages,
                      indoorView: val,
                    },
                  }))
                }
                placeholder={t("indoorPlaceholder")}
                showPreview={true}
              />
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
