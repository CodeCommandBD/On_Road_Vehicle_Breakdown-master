import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Login - QuickService",
  description: "Login to your QuickService account",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
