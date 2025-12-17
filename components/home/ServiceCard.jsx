import Link from "next/link";
import Image from "next/image";

/**
 * Props: { icon: string, title: string, link?: string }
 */
export default function ServiceCard({ icon, title, link = "#" }) {
  const isImg = typeof icon === "string" && (icon.startsWith("/") || icon.startsWith("http"));
  
  return (
    <Link 
      href={link} 
      className="group h-full flex flex-col items-center gap-4 p-6 sm:p-8 rounded-2xl border border-gray-200 bg-white shadow-[0_0_20px_rgba(228,222,222,0.4)] transition-all duration-300 hover:-translate-y-2 hover:border-orange-600 hover:shadow-[0_8px_30px_rgba(255,83,45,0.3)] cursor-pointer"
    >
      <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-orange-50 p-3 text-orange-600 shadow-sm transition-all duration-300 group-hover:bg-orange-100 group-hover:scale-110">
        {isImg ? (
          <Image 
            src={icon} 
            alt={title} 
            width={48} 
            height={48} 
            className="object-contain" 
          />
        ) : (
          <span className="text-2xl leading-none">{icon}</span>
        )}
      </div>
      
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 text-center transition-colors duration-300 group-hover:text-orange-600">
        {title}
      </h3>
    </Link>
  );
}
