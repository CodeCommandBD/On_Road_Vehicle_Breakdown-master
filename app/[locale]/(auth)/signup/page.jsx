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
  return <SignupForm />;
}
