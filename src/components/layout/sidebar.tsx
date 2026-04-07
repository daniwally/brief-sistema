"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
    ),
  },
  {
    href: "/facturas",
    label: "Facturas",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
    ),
  },
  {
    href: "/gastos",
    label: "Gastos",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    ),
  },
];

function WtfLogo({ size = 48 }: { size?: number }) {
  const r = size * 0.22; // circle radius
  const f = size * 0.18; // font size
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* W */}
      <circle cx="30" cy="22" r="20" fill="black" />
      <text x="30" y="22" textAnchor="middle" dominantBaseline="central" fill="white" fontSize={f} fontWeight="700" fontFamily="var(--font-inter), Inter, sans-serif">W</text>
      {/* T */}
      <circle cx="22" cy="55" r="20" fill="black" />
      <text x="22" y="55" textAnchor="middle" dominantBaseline="central" fill="white" fontSize={f} fontWeight="700" fontFamily="var(--font-inter), Inter, sans-serif">T</text>
      {/* F */}
      <circle cx="58" cy="48" r="20" fill="black" />
      <text x="58" y="48" textAnchor="middle" dominantBaseline="central" fill="white" fontSize={f} fontWeight="700" fontFamily="var(--font-inter), Inter, sans-serif">F</text>
      {/* ¿ */}
      <circle cx="42" cy="85" r="16" fill="black" />
      <text x="42" y="86" textAnchor="middle" dominantBaseline="central" fill="white" fontSize={f * 0.9} fontWeight="700" fontFamily="var(--font-inter), Inter, sans-serif">¿</text>
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-16 lg:w-56 border-r bg-white min-h-screen flex flex-col transition-all duration-200">
      <div className="p-3 lg:p-5 border-b">
        {/* Mobile: small logo */}
        <div className="lg:hidden flex justify-center">
          <WtfLogo size={32} />
        </div>
        {/* Desktop: logo + text */}
        <div className="hidden lg:flex flex-col items-center gap-3">
          <WtfLogo size={52} />
          <div className="text-center">
            <h1 className="text-base font-bold text-gray-900">Brief Sistema</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">WTF Agency</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-2 lg:p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-emerald-50 text-emerald-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              )}
            >
              <span className={cn(
                "flex-shrink-0",
                isActive ? "text-emerald-500" : "text-gray-400"
              )}>
                {item.icon}
              </span>
              <span className="hidden lg:block">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
