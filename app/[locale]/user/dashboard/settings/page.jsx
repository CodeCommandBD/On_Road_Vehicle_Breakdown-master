"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, updateUser } from "@/store/slices/authSlice";
import {
  Settings,
  Lock,
  Bell,
  Shield,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations("Settings");
  const commonT = useTranslations("Common");
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("security");
  const [loading, setLoading] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    push: true,
    serviceReminders: true,
  });

  // Sync with user data from Redux
  useEffect(() => {
    if (user?.notificationPreferences) {
      setNotificationPrefs(user.notificationPreferences);
    }
  }, [user]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t("passwordSecure"));
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = async (key) => {
    const newValue = !notificationPrefs[key];
    const updatedPrefs = { ...notificationPrefs, [key]: newValue };

    // Optimistic update
    setNotificationPrefs(updatedPrefs);

    try {
      const res = await fetch("/api/user/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPrefs),
      });
      const data = await res.json();
      if (data.success) {
        // Sync back with global state
        dispatch(updateUser({ notificationPreferences: data.preferences }));
        toast.success("Preferences updated", { autoClose: 1000 });
      } else {
        // Revert on error
        setNotificationPrefs(notificationPrefs);
        toast.error(data.message);
      }
    } catch (error) {
      setNotificationPrefs(notificationPrefs);
      toast.error("Failed to update preferences");
    }
  };

  const tabs = [
    { id: "security", label: t("security"), icon: Lock },
    { id: "notifications", label: t("notifications"), icon: Bell },
    { id: "account", label: t("account"), icon: Shield },
  ];

  return (
    <div className="max-w-4xl space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-orange-500" />
          {t("title")}
        </h1>
        <p className="text-white/60 mt-1">{t("manageAccount")}</p>
      </div>

      <div className="grid md:grid-cols-[240px_1fr] gap-8">
        {/* Sidebar Tabs */}
        <div className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === tab.id
                  ? "bg-orange-500 text-white shadow-glow-orange"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-semibold text-sm">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl p-8 min-h-[500px]">
          {activeTab === "security" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {t("changePassword")}
                </h3>
                <p className="text-white/40 text-sm">{t("passwordSecure")}</p>
              </div>

              <form
                onSubmit={handlePasswordChange}
                className="space-y-6 max-w-md"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/60">
                      {t("currentPassword")}
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? "text" : "password"}
                        required
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                      >
                        {showCurrentPass ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/60">
                      {t("newPassword")}
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? "text" : "password"}
                        required
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                      >
                        {showNewPass ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/60">
                      {t("confirmNewPassword")}
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-glow-orange disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    t("updatePassword")
                  )}
                </button>
              </form>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {t("notifPrefs")}
                </h3>
                <p className="text-white/40 text-sm">{t("controlComm")}</p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    key: "email",
                    title: t("emailNotif"),
                    desc: t("emailDesc"),
                  },
                  {
                    key: "push",
                    title: t("pushNotif"),
                    desc: t("pushDesc"),
                  },
                  {
                    key: "serviceReminders",
                    title: t("serviceReminders"),
                    desc: t("serviceRemindersDesc"),
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl"
                  >
                    <div>
                      <p className="text-white font-medium">{item.title}</p>
                      <p className="text-xs text-white/40">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs[item.key]}
                        onChange={() => handleNotificationToggle(item.key)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h3 className="text-xl font-bold text-white mb-2 text-red-500">
                  {t("dangerZone")}
                </h3>
                <p className="text-white/40 text-sm">{t("beCareful")}</p>
              </div>

              <div className="space-y-4">
                <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-3xl">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-500/10 rounded-xl">
                      <Trash2 className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">
                        {t("deleteAccount")}
                      </h4>
                      <p className="text-sm text-white/40 mb-4">
                        {t("deleteWarning")}
                      </p>
                      <button className="px-6 py-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-bold hover:bg-red-500 hover:text-white transition-all">
                        {t("deactivate")}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 border border-white/10 bg-white/5 rounded-3xl">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-500/10 rounded-xl">
                      <AlertTriangle className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">
                        {t("backupData")}
                      </h4>
                      <p className="text-sm text-white/40 mb-4">
                        {t("backupDesc")}
                      </p>
                      <button className="px-6 py-2.5 bg-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-all">
                        {t("requestExport")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
