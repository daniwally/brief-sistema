import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Moneda } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const currencyConfig: Record<Moneda, { symbol: string; decimals: number }> = {
  ARS: { symbol: "$", decimals: 2 },
  CLP: { symbol: "CLP", decimals: 0 },
  PYG: { symbol: "Gs.", decimals: 0 },
  USD: { symbol: "US$", decimals: 2 },
}

export function formatCurrency(amount: number, moneda: Moneda): string {
  const config = currencyConfig[moneda]
  // Notación decimal europea: punto como separador de miles, coma para decimales
  const formatted = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount)
  return `${config.symbol} ${formatted}`
}

export function formatDate(dateString: string): string {
  return new Date(dateString + "T00:00:00").toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}
