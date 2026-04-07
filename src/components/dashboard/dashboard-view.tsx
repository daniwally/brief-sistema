"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function wrapHandler(fn: (v: string) => void) {
  return (v: string | null) => fn(v ?? "all");
}

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pais, setPais] = useState("all");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

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
    ? MONEDAS.filter(
        (m) => data.ingresos[m] > 0 || data.gastos[m] > 0
      )
    : [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-xs">País</Label>
          <Select value={pais} onValueChange={wrapHandler(setPais)}>
            <SelectTrigger className="w-[140px]">
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
          <Label className="text-xs">Desde</Label>
          <Input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="w-[160px]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Hasta</Label>
          <Input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="w-[160px]"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setPais("all");
            setDesde("");
            setHasta("");
          }}
        >
          Limpiar
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground py-8 text-center">Cargando...</p>
      ) : error ? (
        <div className="text-center py-8 space-y-2">
          <p className="text-red-500">Error al cargar datos</p>
          <p className="text-xs text-muted-foreground font-mono break-all max-w-lg mx-auto">{error}</p>
        </div>
      ) : !data ? (
        <p className="text-muted-foreground py-8 text-center">
          Sin datos
        </p>
      ) : (
        <>
          {/* Pending items */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Facturas Impagas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-500">
                  {data.pendientes.facturas_impagas}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Gastos Impagos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-500">
                  {data.pendientes.gastos_impagos}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Per-currency breakdown */}
          {activeMonedas.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay movimientos registrados
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeMonedas.map((moneda) => (
                <Card key={moneda}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{moneda}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ingresos</span>
                      <span className="font-mono text-green-600">
                        {formatCurrency(data.ingresos[moneda], moneda)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gastos</span>
                      <span className="font-mono text-red-500">
                        {formatCurrency(data.gastos[moneda], moneda)}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Balance</span>
                      <span
                        className={`font-mono ${
                          data.balance[moneda] >= 0
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {formatCurrency(data.balance[moneda], moneda)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
