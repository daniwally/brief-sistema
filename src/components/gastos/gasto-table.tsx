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
import type { Gasto, EstadoPago, Moneda } from "@/lib/types";
import Link from "next/link";

interface GastoRecord {
  id: string;
  fields: Omit<Gasto, "id">;
}

export function GastoTable() {
  const [gastos, setGastos] = useState<GastoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pais, setPais] = useState("all");
  const [estado, setEstado] = useState("all");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const fetchGastos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (pais !== "all") params.set("pais", pais);
      if (estado !== "all") params.set("estado", estado);
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);

      const res = await fetch(`/api/gastos?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Error ${res.status}`);
        setLoading(false);
        return;
      }
      setGastos(data);
    } catch (err) {
      setError(String(err));
    }
    setLoading(false);
  }, [pais, estado, desde, hasta]);

  useEffect(() => {
    fetchGastos();
  }, [fetchGastos]);

  async function toggleEstado(id: string, currentEstado: EstadoPago) {
    setTogglingId(id);
    const newEstado = currentEstado === "Pagado" ? "Impago" : "Pagado";
    setGastos((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, fields: { ...g.fields, Estado: newEstado } } : g
      )
    );

    await fetch(`/api/gastos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Estado: newEstado }),
    });
    setTogglingId(null);
  }

  async function deleteGasto(id: string) {
    if (!confirm("¿Eliminar este gasto?")) return;
    await fetch(`/api/gastos/${id}`, { method: "DELETE" });
    setGastos((prev) => prev.filter((g) => g.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gastos</h2>
        <Link href="/gastos/nuevo">
          <Button>+ Nuevo Gasto</Button>
        </Link>
      </div>

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

      {loading ? (
        <p className="text-muted-foreground py-8 text-center">Cargando...</p>
      ) : error ? (
        <div className="text-center py-8 space-y-2">
          <p className="text-red-500">Error al cargar gastos</p>
          <p className="text-xs text-muted-foreground font-mono break-all max-w-lg mx-auto">{error}</p>
        </div>
      ) : gastos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No hay gastos registrados</p>
          <Link href="/gastos/nuevo">
            <Button variant="outline" className="mt-4">
              Registrar primer gasto
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gastos.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="whitespace-nowrap">
                    {g.fields.Fecha ? formatDate(g.fields.Fecha) : "-"}
                  </TableCell>
                  <TableCell>{g.fields.Proveedor || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {g.fields.Descripcion || "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono whitespace-nowrap">
                    {formatCurrency(g.fields.Monto, g.fields.Moneda as Moneda)}
                  </TableCell>
                  <TableCell>{g.fields.Pais}</TableCell>
                  <TableCell>
                    <StatusBadge
                      estado={g.fields.Estado as EstadoPago}
                      loading={togglingId === g.id}
                      onToggle={() =>
                        toggleEstado(g.id, g.fields.Estado as EstadoPago)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => deleteGasto(g.id)}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
