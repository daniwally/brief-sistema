"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";

interface DateInputProps {
  value: string; // yyyy-mm-dd (internal)
  onChange: (isoDate: string) => void;
  className?: string;
}

/** Convert yyyy-mm-dd to dd/mm/yy */
function toDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y.slice(-2)}`;
}

export function DateInput({ value, onChange, className }: DateInputProps) {
  const hiddenRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <Input
        type="text"
        readOnly
        value={toDisplay(value)}
        placeholder="dd/mm/aa"
        onClick={() => hiddenRef.current?.showPicker()}
        className={`cursor-pointer ${className || ""}`}
      />
      <input
        ref={hiddenRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  );
}
