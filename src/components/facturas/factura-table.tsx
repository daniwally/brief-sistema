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

export function FacturaTable() {
  const [facturas, setFacturas] = useState<FacturaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [pais, setPais] = useState("all");
  const [estado, setEstado] = useState("all");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const fetchFacturas = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (pais !== "all") params.set("pais", pais);
    if (estado !== "all") params.set("estado", estado);
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);

    const res = await fetch(`/api/facturas?${params}`);
    const data = await res.json();
    setFacturas(data);
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
        <h2 className="text-2xl font-bold">Facturas</h2>
        <Link href="/facturas/nueva">
          <Button>+ Nueva Factura</Button>
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Nro</TableHead>
                <TableHead>Emisor</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>PDF</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facturas.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="whitespace-nowrap">
                    {f.fields.Fecha ? formatDate(f.fields.Fecha) : "-"}
                  </TableCell>
                  <TableCell>{f.fields.Numero || "-"}</TableCell>
                  <TableCell>{f.fields.Emisor || "-"}</TableCell>
                  <TableCell className="text-right font-mono whitespace-nowrap">
                    {formatCurrency(f.fields.Monto, f.fields.Moneda as Moneda)}
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
