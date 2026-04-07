"use client";

import { useState, useEffect } from "react";
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

/** Convert dd/mm/yy to yyyy-mm-dd */
function toIso(display: string): string {
  if (!display) return "";
  const parts = display.replace(/[.\-]/g, "/").split("/");
  if (parts.length !== 3) return "";
  const [d, m, y] = parts;
  if (!d || !m || !y) return "";
  const fullYear = y.length === 2 ? `20${y}` : y;
  const dd = d.padStart(2, "0");
  const mm = m.padStart(2, "0");
  if (parseInt(mm) > 12 || parseInt(dd) > 31) return "";
  return `${fullYear}-${mm}-${dd}`;
}

export function DateInput({ value, onChange, className }: DateInputProps) {
  const [display, setDisplay] = useState(toDisplay(value));

  useEffect(() => {
    setDisplay(toDisplay(value));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value;
    // Auto-add slashes
    const digits = raw.replace(/\D/g, "");
    if (digits.length <= 2) {
      raw = digits;
    } else if (digits.length <= 4) {
      raw = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      raw = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 6)}`;
    }
    setDisplay(raw);
  }

  function handleBlur() {
    const iso = toIso(display);
    if (iso) {
      onChange(iso);
      setDisplay(toDisplay(iso));
    } else if (display === "") {
      onChange("");
    }
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      placeholder="dd/mm/aa"
      maxLength={8}
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
}
