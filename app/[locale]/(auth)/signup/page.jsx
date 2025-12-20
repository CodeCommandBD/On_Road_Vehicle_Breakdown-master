import SignupForm from "@/components/auth/SignupForm";

export const metadata = {
  title: "Sign Up - QuickService",
  description: "Create your QuickService account",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <SignupForm />
    </div>
  );
}
