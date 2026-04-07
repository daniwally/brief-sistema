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
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Pago, Moneda } from "@/lib/types";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/shared/date-input";

interface PagoRecord {
  id: string;
  fields: Omit<Pago, "id">;
}

function wrapHandler(fn: (v: string) => void) {
  return (v: string | null) => fn(v ?? "all");
}

export function PagoTable() {
  const [pagos, setPagos] = useState<PagoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pais, setPais] = useState("all");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const fetchPagos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (pais !== "all") params.set("pais", pais);
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);

      const res = await fetch(`/api/pagos?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Error ${res.status}`);
        setLoading(false);
        return;
      }
      setPagos(data);
    } catch (err) {
      setError(String(err));
    }
    setLoading(false);
  }, [pais, desde, hasta]);

  useEffect(() => {
    fetchPagos();
  }, [fetchPagos]);

  async function deletePago(id: string) {
    if (!confirm("Eliminar este pago?")) return;
    await fetch(`/api/pagos/${id}`, { method: "DELETE" });
    setPagos((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pagos</h2>
          <p className="text-sm text-gray-400">Registro de pagos recibidos</p>
        </div>
        <Link href="/pagos/nuevo">
          <Button className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white shadow-sm">+ Nuevo Pago</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3 items-end">
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
            <DateInput
              value={desde}
              onChange={setDesde}
              className="w-[120px] border-gray-200 rounded-xl"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-400">Hasta</Label>
            <DateInput
              value={hasta}
              onChange={setHasta}
              className="w-[120px] border-gray-200 rounded-xl"
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
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground py-8 text-center">Cargando...</p>
      ) : error ? (
        <div className="text-center py-8 space-y-2">
          <p className="text-red-500">Error al cargar pagos</p>
          <p className="text-xs text-muted-foreground font-mono break-all max-w-lg mx-auto">{error}</p>
        </div>
      ) : pagos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No hay pagos registrados</p>
          <Link href="/pagos/nuevo">
            <Button variant="outline" className="mt-4">
              Registrar primer pago
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] px-2">Fecha</TableHead>
                <TableHead className="px-2">Pagador</TableHead>
                <TableHead className="w-[100px] px-2">Ref. Factura</TableHead>
                <TableHead className="w-[140px] px-2 text-right">Monto</TableHead>
                <TableHead className="w-[52px] px-2">Pais</TableHead>
                <TableHead className="w-[50px] px-2">PDF</TableHead>
                <TableHead className="w-[60px] px-1"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagos.map((p) => {
                const moneda = p.fields.Moneda as Moneda;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="px-2 whitespace-nowrap text-xs">
                      {p.fields.Fecha ? formatDate(p.fields.Fecha) : "-"}
                    </TableCell>
                    <TableCell className="px-2">
                      <div className="text-sm truncate">{p.fields.Pagador || "-"}</div>
                      {p.fields.Descripcion && (
                        <div className="text-xs text-gray-400 truncate">{p.fields.Descripcion}</div>
                      )}
                    </TableCell>
                    <TableCell className="px-2 text-xs truncate">{p.fields.FacturaRef || "-"}</TableCell>
                    <TableCell className="px-2 text-right font-mono whitespace-nowrap text-sm">
                      {formatCurrency(p.fields.Monto, moneda)}
                    </TableCell>
                    <TableCell className="px-2 text-xs">
                      {p.fields.Pais === "Argentina" ? "AR" : p.fields.Pais === "Chile" ? "CL" : p.fields.Pais === "Paraguay" ? "PY" : p.fields.Pais}
                    </TableCell>
                    <TableCell className="px-2">
                      {p.fields.Archivo && p.fields.Archivo.length > 0 ? (
                        <a
                          href={p.fields.Archivo[0].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          PDF
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="px-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-600 text-xs h-7 px-2"
                        onClick={() => deletePago(p.id)}
                      >
                        Borrar
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
