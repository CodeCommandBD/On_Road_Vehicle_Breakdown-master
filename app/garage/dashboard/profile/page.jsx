import ProfileForm from "@/components/dashboard/ProfileForm";

export const metadata = {
  title: "My Profile | On Road Vehicle Breakdown",
  description: "Manage your personal information and vehicles",
};

export default function ProfilePage() {
  return (
    <div className="py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your personal information, contact details, and vehicles.
        </p>
      </div>

      <ProfileForm />
    </div>
  );
}
