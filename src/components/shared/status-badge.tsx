"use client";

import { Badge } from "@/components/ui/badge";
import type { EstadoPago } from "@/lib/types";

interface StatusBadgeProps {
  estado: EstadoPago;
  onToggle?: () => void;
  loading?: boolean;
}

export function StatusBadge({ estado, onToggle, loading }: StatusBadgeProps) {
  return (
    <Badge
      variant={estado === "Pagado" ? "default" : "secondary"}
      className={`cursor-pointer select-none ${
        estado === "Pagado"
          ? "bg-green-600 hover:bg-green-700"
          : "bg-amber-500 hover:bg-amber-600 text-white"
      } ${loading ? "opacity-50" : ""}`}
      onClick={onToggle}
    >
      {loading ? "..." : estado}
    </Badge>
  );
}
