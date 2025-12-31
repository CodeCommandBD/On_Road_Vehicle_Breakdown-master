"use client";

import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { FaGoogle, FaFacebook } from "react-icons/fa";

export default function SocialLoginButtons() {
  const t = useTranslations("Auth");

  const handleSocialLogin = (provider) => {
    toast.info(`${provider} login functionality is currently disabled.`);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-black px-2 text-gray-500 font-medium tracking-wider">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => handleSocialLogin("Google")}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300 group"
        >
          <FaGoogle className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          <span className="text-gray-400 group-hover:text-white font-medium text-sm transition-colors">
            Google
          </span>
        </button>
        <button
          type="button"
          onClick={() => handleSocialLogin("Facebook")}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-300 group"
        >
          <FaFacebook className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
          <span className="text-gray-400 group-hover:text-white font-medium text-sm transition-colors">
            Facebook
          </span>
        </button>
      </div>
    </div>
  );
}
