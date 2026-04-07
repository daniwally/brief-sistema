import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Moneda } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const currencyConfig: Record<Moneda, { locale: string; decimals: number }> = {
  ARS: { locale: "es-AR", decimals: 2 },
  CLP: { locale: "es-CL", decimals: 0 },
  PYG: { locale: "es-PY", decimals: 0 },
  USD: { locale: "en-US", decimals: 2 },
}

export function formatCurrency(amount: number, moneda: Moneda): string {
  const config = currencyConfig[moneda]
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Date(dateString + "T00:00:00").toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}
