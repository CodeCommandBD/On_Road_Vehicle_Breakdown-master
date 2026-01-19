import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Login | On-Road Vehicle Service",
  description:
    "Login to access 24/7 vehicle breakdown assistance in Bangladesh. Secure access for users, garages, mechanics, and admins.",
  keywords: "login, sign in, vehicle service, breakdown assistance, Bangladesh",
  openGraph: {
    title: "Login | On-Road Vehicle Service",
    description:
      "Login to access 24/7 vehicle breakdown assistance in Bangladesh.",
    type: "website",
  },
};

export default function LoginPage() {
  return <LoginForm />;
}
