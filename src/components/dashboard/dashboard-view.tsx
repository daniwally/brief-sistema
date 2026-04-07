"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { DashboardData, Moneda } from "@/lib/types";

const MONEDAS: Moneda[] = ["USD", "ARS", "CLP", "PYG"];

interface Cotizaciones {
  ARS: number;
  CLP: number;
  PYG: number;
  USD: number;
}

function toUsd(monto: number, moneda: Moneda, rates: Cotizaciones): number {
  const rate = rates[moneda];
  if (!rate || rate === 0) return 0;
  return monto / rate;
}

function formatUsd(amount: number): string {
  return `US$ ${amount.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function wrapHandler(fn: (v: string) => void) {
  return (v: string | null) => fn(v ?? "all");
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos dias";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
}

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<Cotizaciones | null>(null);
  const [pais, setPais] = useState("all");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  useEffect(() => {
    fetch("/api/cotizacion")
      .then((r) => r.json())
      .then(setRates)
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (pais !== "all") params.set("pais", pais);
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);

      const res = await fetch(`/api/dashboard?${params}`);
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || `Error ${res.status}`);
        setLoading(false);
        return;
      }
      setData(d);
    } catch (err) {
      setError(String(err));
    }
    setLoading(false);
  }, [pais, desde, hasta]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeMonedas = data
    ? MONEDAS.filter((m) => data.ingresos[m] > 0 || data.gastos[m] > 0)
    : [];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{greeting()}, Wally</h1>
        <p className="text-sm text-gray-400 mt-1">Resumen financiero</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="space-y-1">
          <Label className="text-xs text-gray-400">Pais</Label>
          <Select value={pais} onValueChange={wrapHandler(setPais)}>
            <SelectTrigger className="w-[140px] border-gray-200 rounded-xl">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Argentina">Argentina</SelectItem>
              <SelectItem value="Chile">Chile</SelectItem>
              <SelectItem value="Paraguay">Paraguay</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-400">Desde</Label>
          <Input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="w-[160px] border-gray-200 rounded-xl"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-400">Hasta</Label>
          <Input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="w-[160px] border-gray-200 rounded-xl"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-gray-200"
          onClick={() => {
            setPais("all");
            setDesde("");
            setHasta("");
          }}
        >
          Limpiar
        </Button>
        {rates && (
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-xs text-gray-400">Cotizacion Ref.:</span>
            <span className="text-xs font-medium text-gray-600">
              USD/ARS <span className="text-emerald-600 font-mono">$ {rates.ARS.toLocaleString("de-DE", { maximumFractionDigits: 2 })}</span>
            </span>
            <span className="text-xs font-medium text-gray-600">
              USD/CLP <span className="text-emerald-600 font-mono">CLP {rates.CLP.toLocaleString("de-DE", { maximumFractionDigits: 2 })}</span>
            </span>
            <span className="text-xs font-medium text-gray-600">
              USD/PYG <span className="text-emerald-600 font-mono">Gs. {rates.PYG.toLocaleString("de-DE", { maximumFractionDigits: 0 })}</span>
            </span>
            <span className="text-[10px] text-gray-300">dolarhoy.com</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-20 mb-4" />
              <div className="h-8 bg-gray-100 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-red-100 text-center space-y-2">
          <p className="text-red-500 font-medium">Error al cargar datos</p>
          <p className="text-xs text-gray-400 font-mono break-all max-w-lg mx-auto">{error}</p>
        </div>
      ) : !data ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <p className="text-gray-400">Sin datos</p>
        </div>
      ) : (
        <>
          {/* Monthly total + Pending alerts */}
          {(() => {
            const mesLabel = new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" });
            let totalUsdMes = 0;
            if (rates && data.facturacionMes) {
              for (const m of MONEDAS) {
                const val = data.facturacionMes[m] || 0;
                if (val > 0) totalUsdMes += toUsd(val, m, rates);
              }
            }
            return (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Facturacion {mesLabel}</p>
                </div>
                <p className="text-4xl font-bold text-emerald-600 font-mono">
                  {formatUsd(totalUsdMes)}
                </p>
                {data.facturacionMes && (
                  <div className="flex flex-wrap gap-3 mt-3">
                    {MONEDAS.filter((m) => (data.facturacionMes[m] || 0) > 0).map((m) => (
                      <span key={m} className="text-xs text-gray-500 font-mono">
                        {formatCurrency(data.facturacionMes[m], m)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Facturas Impagas</p>
              <p className={`text-4xl font-bold ${data.pendientes.facturas_impagas > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                {data.pendientes.facturas_impagas}
              </p>
              <p className="text-xs text-gray-400 mt-2">pendientes de cobro</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Gastos Impagos</p>
              <p className={`text-4xl font-bold ${data.pendientes.gastos_impagos > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                {data.pendientes.gastos_impagos}
              </p>
              <p className="text-xs text-gray-400 mt-2">pendientes de pago</p>
            </div>
          </div>

          {/* Per-currency cards */}
          {activeMonedas.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
              <p className="text-gray-400">No hay movimientos registrados</p>
              <p className="text-xs text-gray-300 mt-1">Crea tu primera factura o gasto para ver el resumen</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeMonedas.map((moneda) => {
                const showUsd = rates && moneda !== "USD";
                return (
                <div key={moneda} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Balance {moneda}</span>
                    <div className="flex items-center gap-2">
                      {showUsd && (
                        <span className="text-xs text-gray-400 font-mono">
                          {formatUsd(toUsd(data.balance[moneda], moneda, rates))}
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        data.balance[moneda] >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                      }`}>
                        {data.balance[moneda] >= 0 ? "+" : ""}{formatCurrency(data.balance[moneda], moneda)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-sm text-gray-500">Ingresos</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-semibold text-gray-900 font-mono">
                          {formatCurrency(data.ingresos[moneda], moneda)}
                        </span>
                        {showUsd && (
                          <p className="text-xs text-gray-400 font-mono">
                            {formatUsd(toUsd(data.ingresos[moneda], moneda, rates))}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="text-sm text-gray-500">Gastos</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-semibold text-gray-900 font-mono">
                          {formatCurrency(data.gastos[moneda], moneda)}
                        </span>
                        {showUsd && (
                          <p className="text-xs text-gray-400 font-mono">
                            {formatUsd(toUsd(data.gastos[moneda], moneda, rates))}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2">
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        {data.ingresos[moneda] > 0 && (
                          <div
                            className={`h-full rounded-full transition-all ${
                              data.balance[moneda] >= 0 ? "bg-emerald-400" : "bg-red-400"
                            }`}
                            style={{
                              width: `${Math.min(100, (data.gastos[moneda] / data.ingresos[moneda]) * 100)}%`,
                            }}
                          />
                        )}
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-gray-300">
                          {data.ingresos[moneda] > 0
                            ? `${Math.round((data.gastos[moneda] / data.ingresos[moneda]) * 100)}% gastado`
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
