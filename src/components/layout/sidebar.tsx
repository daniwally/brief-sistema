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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-16 lg:w-56 border-r bg-white min-h-screen flex flex-col transition-all duration-200">
      <div className="p-3 lg:p-4 border-b">
        <div className="w-8 h-8 lg:w-auto lg:h-auto rounded-lg bg-emerald-500 flex items-center justify-center lg:bg-transparent lg:rounded-none">
          <span className="text-white font-bold text-sm lg:hidden">B</span>
          <div className="hidden lg:block">
            <h1 className="text-base font-bold text-gray-900">Brief Sistema</h1>
            <p className="text-xs text-gray-400">WTF Agency</p>
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
