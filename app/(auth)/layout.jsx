export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Background Images/Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800"></div>
        <div className="absolute inset-0 bg-[url('/images/auth-pattern.svg')] opacity-5"></div>
        {/* Overlay */}
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full flex justify-center">
        {children}
      </div>
    </div>
  );
}
