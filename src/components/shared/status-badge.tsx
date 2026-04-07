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
          ? "bg-violet-50 text-violet-600 hover:bg-violet-100"
          : "bg-amber-50 text-amber-600 hover:bg-amber-100"
      } ${loading ? "opacity-50" : ""}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isPagado ? "bg-violet-400" : "bg-amber-400"}`} />
      {loading ? "..." : estado}
    </button>
  );
}
