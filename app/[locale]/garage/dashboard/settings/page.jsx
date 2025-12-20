"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@/store/slices/authSlice";
import {
  Settings,
  Bell,
  Lock,
  Shield,
  Trash2,
  Loader2,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";

export default function GarageSettingsPage() {
  const t = useTranslations("Settings");
  const commonT = useTranslations("Common");
  const user = useSelector(selectUser);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [settings, setSettings] = useState({
    account: {
      isActive: true,
      notificationPreferences: {
        email: true,
        push: true,
        serviceReminders: true,
      },
    },
    garage: {
      isActive: true,
      isVerified: false,
    },
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get("/api/garages/settings");
        if (response.data.success) {
          setSettings(response.data.settings);
        }
      } catch (error) {
        console.error("Fetch Settings Error:", error);
        toast.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const handleToggle = (type, field) => {
    if (type === "account") {
      setSettings((prev) => ({
        ...prev,
        account: {
          ...prev.account,
          [field]: !prev.account[field],
        },
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        garage: {
          ...prev.garage,
          [field]: !prev.garage[field],
        },
      }));
    }
  };

  const handleNotificationChange = (field) => {
    setSettings((prev) => ({
      ...prev,
      account: {
        ...prev.account,
        notificationPreferences: {
          ...prev.account.notificationPreferences,
          [field]: !prev.account.notificationPreferences[field],
        },
      },
    }));
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const payload = {
        notificationPreferences: settings.account.notificationPreferences,
        garageActive: settings.garage.isActive,
        accountActive: settings.account.isActive,
      };

      if (passwordForm.currentPassword && passwordForm.newPassword) {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
          toast.error("Passwords do not match");
          setIsSaving(false);
          return;
        }
        payload.currentPassword = passwordForm.currentPassword;
        payload.newPassword = passwordForm.newPassword;
      }

      const response = await axios.put("/api/garages/settings", payload);
      if (response.data.success) {
        toast.success(t("saveChanges"));
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update settings");
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
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {t("accountSettings")}
          </h1>
          <p className="text-white/60">{t("manageBusiness")}</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all font-medium disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {t("saveChanges")}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Visibility & Status */}
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-orange-500" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {t("businessVisibility")}
              </h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <p className="text-white font-medium">{t("garageActive")}</p>
                  <p className="text-xs text-white/50">
                    {t("garageActiveDesc")}
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("garage", "isActive")}
                  className="text-orange-500"
                >
                  {settings.garage.isActive ? (
                    <ToggleRight className="w-10 h-10" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-white/20" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <p className="text-white font-medium">{t("accountActive")}</p>
                  <p className="text-xs text-white/50">
                    {t("accountActiveDesc")}
                  </p>
                </div>
                <button
                  onClick={() => handleToggle("account", "isActive")}
                  className="text-orange-500"
                >
                  {settings.account.isActive ? (
                    <ToggleRight className="w-10 h-10" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-white/20" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
                <p className="text-xs text-blue-400">
                  {settings.garage.isVerified
                    ? t("verified")
                    : t("pendingVerification")}
                </p>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {t("notifications")}
              </h2>
            </div>

            <div className="space-y-4">
              {Object.entries(settings.account.notificationPreferences).map(
                ([key, val]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer group hover:bg-white/10 transition-colors"
                  >
                    <span className="text-white capitalize">
                      {t(
                        key.replace(/([A-Z])/g, " $1") === "email"
                          ? "emailNotif"
                          : key === "push"
                          ? "pushNotif"
                          : "serviceReminders"
                      )}
                    </span>
                    <input
                      type="checkbox"
                      checked={val}
                      onChange={() => handleNotificationChange(key)}
                      className="w-5 h-5 rounded border-white/10 accent-orange-500"
                    />
                  </label>
                )
              )}
            </div>
          </div>
        </div>

        {/* Security / Password */}
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-purple-500" />
              </div>
              <h2 className="text-xl font-bold text-white">{t("security")}</h2>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <label className="text-xs text-white/50 mb-1 block">
                  {t("currentPassword")}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50"
                  />
                  <button
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="relative">
                <label className="text-xs text-white/50 mb-1 block">
                  {t("newPassword")}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50"
                  />
                  <button
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="relative">
                <label className="text-xs text-white/50 mb-1 block">
                  {t("confirmNewPassword")}
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50"
                />
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-red-500">
                {t("dangerZone")}
              </h2>
            </div>

            <p className="text-white/60 text-sm mb-6">{t("deleteWarning")}</p>

            <button className="w-full py-3 border border-red-500/50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all font-medium">
              {t("deleteAccount")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
