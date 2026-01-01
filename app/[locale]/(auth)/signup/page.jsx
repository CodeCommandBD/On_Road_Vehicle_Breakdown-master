import SignupForm from "@/components/auth/SignupForm";

export const metadata = {
  title: "Sign Up | On-Road Vehicle Service",
  description:
    "Create an account to access emergency vehicle breakdown services in Bangladesh. Join as a user, garage owner, or mechanic.",
  keywords:
    "signup, register, create account, vehicle service, breakdown assistance, Bangladesh",
  openGraph: {
    title: "Sign Up | On-Road Vehicle Service",
    description:
      "Create an account to access emergency vehicle breakdown services in Bangladesh.",
    type: "website",
  },
};

export default function SignupPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <SignupForm />
    </div>
  );
}
