"use client";

import type { EstadoPago } from "@/lib/types";

interface StatusBadgeProps {
  estado: EstadoPago;
  onToggle?: () => void;
  loading?: boolean;
}

export function StatusBadge({ estado, onToggle, loading }: StatusBadgeProps) {
  const isPagado = estado === "Pagado";
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer select-none ${
        isPagado
          ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
          : "bg-amber-50 text-amber-600 hover:bg-amber-100"
      } ${loading ? "opacity-50" : ""}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isPagado ? "bg-gray-800" : "bg-amber-400"}`} />
      {loading ? "..." : estado}
    </button>
  );
}
