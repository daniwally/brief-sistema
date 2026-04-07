"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Filters } from "@/components/shared/filters";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Factura, EstadoPago, Moneda } from "@/lib/types";
import Link from "next/link";

interface FacturaRecord {
  id: string;
  fields: Omit<Factura, "id">;
}

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

function isEnMora(fecha: string | undefined, estado: string): boolean {
  if (!fecha || estado === "Pagado") return false;
  const emision = new Date(fecha + "T00:00:00");
  const hoy = new Date();
  const diff = (hoy.getTime() - emision.getTime()) / (1000 * 60 * 60 * 24);
  return diff > 31;
}

function diasMora(fecha: string): number {
  const emision = new Date(fecha + "T00:00:00");
  const hoy = new Date();
  return Math.floor((hoy.getTime() - emision.getTime()) / (1000 * 60 * 60 * 24));
}

export function FacturaTable() {
  const [facturas, setFacturas] = useState<FacturaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [rates, setRates] = useState<Cotizaciones | null>(null);
  const [pais, setPais] = useState("all");
  const [estado, setEstado] = useState("all");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  useEffect(() => {
    fetch("/api/cotizacion")
      .then((r) => r.json())
      .then(setRates)
      .catch(() => {});
  }, []);

  const fetchFacturas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (pais !== "all") params.set("pais", pais);
      if (estado !== "all") params.set("estado", estado);
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);

      const res = await fetch(`/api/facturas?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Error ${res.status}`);
        setLoading(false);
        return;
      }
      setFacturas(data);
    } catch (err) {
      setError(String(err));
    }
    setLoading(false);
  }, [pais, estado, desde, hasta]);

  useEffect(() => {
    fetchFacturas();
  }, [fetchFacturas]);

  async function toggleEstado(id: string, currentEstado: EstadoPago) {
    setTogglingId(id);
    const newEstado = currentEstado === "Pagado" ? "Impago" : "Pagado";
    setFacturas((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, fields: { ...f.fields, Estado: newEstado } } : f
      )
    );

    await fetch(`/api/facturas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Estado: newEstado }),
    });
    setTogglingId(null);
  }

  async function deleteFactura(id: string) {
    if (!confirm("¿Eliminar esta factura?")) return;
    await fetch(`/api/facturas/${id}`, { method: "DELETE" });
    setFacturas((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Facturas</h2>
          <p className="text-sm text-gray-400">Facturacion AR / CL / PY</p>
        </div>
        <Link href="/facturas/nueva">
          <Button className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm">+ Nueva Factura</Button>
        </Link>
      </div>

      {/* Filters + Cotización */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
        <Filters
          pais={pais}
          setPais={setPais}
          estado={estado}
          setEstado={setEstado}
          desde={desde}
          setDesde={setDesde}
          hasta={hasta}
          setHasta={setHasta}
          onClear={() => {
            setPais("all");
            setEstado("all");
            setDesde("");
            setHasta("");
          }}
        />
        {rates && (
          <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-400">Cotizacion Ref.:</span>
            <span className="text-xs font-medium text-gray-600">
              USD/ARS <span className="text-emerald-600 font-mono">$ {rates.ARS.toLocaleString("de-DE", { maximumFractionDigits: 2 })}</span>
            </span>
            <span className="text-xs font-medium text-gray-600">
              USD/CLP <span className="text-emerald-600 font-mono">$ {rates.CLP.toLocaleString("de-DE", { maximumFractionDigits: 2 })}</span>
            </span>
            <span className="text-xs font-medium text-gray-600">
              USD/PYG <span className="text-emerald-600 font-mono">Gs. {rates.PYG.toLocaleString("de-DE", { maximumFractionDigits: 0 })}</span>
            </span>
            <span className="text-[10px] text-gray-300">dolarhoy.com</span>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground py-8 text-center">Cargando...</p>
      ) : error ? (
        <div className="text-center py-8 space-y-2">
          <p className="text-red-500">Error al cargar facturas</p>
          <p className="text-xs text-muted-foreground font-mono break-all max-w-lg mx-auto">{error}</p>
        </div>
      ) : facturas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No hay facturas registradas</p>
          <Link href="/facturas/nueva">
            <Button variant="outline" className="mt-4">
              Registrar primera factura
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Nro</TableHead>
                <TableHead>Emisor</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">USD Ref.</TableHead>
                <TableHead>Pais</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>PDF</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facturas.map((f) => {
                const moneda = f.fields.Moneda as Moneda;
                const usdAmount = rates ? toUsd(f.fields.Monto, moneda, rates) : null;
                const mora = isEnMora(f.fields.Fecha, f.fields.Estado as string);
                return (
                  <TableRow key={f.id} className={mora ? "bg-red-50 hover:bg-red-100" : ""}>
                    <TableCell className="text-center px-2">
                      {mora && (
                        <span title={`${diasMora(f.fields.Fecha!)} días en mora`} className="relative group">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-500 inline-block">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                            <line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span className="absolute left-6 -top-1 hidden group-hover:block bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-md whitespace-nowrap z-10 shadow-sm">
                            {diasMora(f.fields.Fecha!)} días en mora
                          </span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className={`whitespace-nowrap ${mora ? "text-red-700 font-medium" : ""}`}>
                      {f.fields.Fecha ? formatDate(f.fields.Fecha) : "-"}
                    </TableCell>
                    <TableCell>{f.fields.Numero || "-"}</TableCell>
                    <TableCell>{f.fields.Emisor || "-"}</TableCell>
                    <TableCell>{f.fields.Cliente || "-"}</TableCell>
                    <TableCell className="text-right font-mono whitespace-nowrap">
                      {formatCurrency(f.fields.Monto, moneda)}
                    </TableCell>
                    <TableCell className="text-right font-mono whitespace-nowrap text-gray-400">
                      {usdAmount != null
                        ? `US$ ${usdAmount.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "-"}
                    </TableCell>
                    <TableCell>{f.fields.Pais}</TableCell>
                    <TableCell>
                      <StatusBadge
                        estado={f.fields.Estado as EstadoPago}
                        loading={togglingId === f.id}
                        onToggle={() =>
                          toggleEstado(f.id, f.fields.Estado as EstadoPago)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {f.fields.Archivo && f.fields.Archivo.length > 0 ? (
                        <a
                          href={f.fields.Archivo[0].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Ver PDF
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => deleteFactura(f.id)}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
