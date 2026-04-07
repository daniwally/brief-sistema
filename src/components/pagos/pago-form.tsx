"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PdfUploaderPago } from "./pdf-uploader-pago";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ExtractedPayment, Moneda } from "@/lib/types";

interface FacturaImpaga {
  id: string;
  fields: {
    Numero: string | null;
    Monto: number;
    Moneda: string;
    Fecha: string;
    Emisor: string;
    Cliente: string | null;
    Estado: string;
  };
}

function formatEuropean(value: string): string {
  if (!value) return "";
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return num.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseEuropean(formatted: string): string {
  if (!formatted) return "";
  const clean = formatted.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(clean);
  if (isNaN(num)) return "";
  return String(num);
}

export function PagoForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [facturasImpagas, setFacturasImpagas] = useState<FacturaImpaga[]>([]);
  const [selectedFacturaId, setSelectedFacturaId] = useState<string | null>(null);
  const [loadingFacturas, setLoadingFacturas] = useState(true);

  const [form, setForm] = useState({
    Monto: "",
    Moneda: "USD",
    Fecha: new Date().toISOString().split("T")[0],
    Pagador: "",
    FacturaRef: "",
    Descripcion: "",
    Pais: "Argentina",
    Notas: "",
  });

  useEffect(() => {
    fetch("/api/facturas?estado=Impago")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setFacturasImpagas(data);
      })
      .catch(() => {})
      .finally(() => setLoadingFacturas(false));
  }, []);

  function updateField(field: string, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
  }

  function handleExtracted(data: ExtractedPayment, file: File) {
    setPdfFile(file);
    setPdfName(file.name);
    setForm((prev) => ({
      ...prev,
      Monto: data.monto != null ? formatEuropean(String(data.monto)) : prev.Monto,
      Moneda: data.moneda || prev.Moneda,
      Fecha: data.fecha || prev.Fecha,
      Pagador: data.pagador || prev.Pagador,
      FacturaRef: data.numero_factura || prev.FacturaRef,
      Descripcion: data.descripcion || prev.Descripcion,
      Pais: data.pais || prev.Pais,
    }));

    // Try to auto-match unpaid invoice by number
    if (data.numero_factura) {
      const match = facturasImpagas.find(
        (f) => f.fields.Numero && f.fields.Numero.includes(data.numero_factura!)
      );
      if (match) {
        setSelectedFacturaId(match.id);
        toast.success(`Factura ${match.fields.Numero} detectada automaticamente`);
      }
    }

    toast.success("Datos extraidos del comprobante. Revisa y selecciona la factura.");
  }

  function selectFactura(facturaId: string | null) {
    setSelectedFacturaId(facturaId);
    if (facturaId) {
      const f = facturasImpagas.find((fac) => fac.id === facturaId);
      if (f) {
        updateField("FacturaRef", f.fields.Numero || facturaId);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.Monto || !form.Pagador) {
      toast.error("Completa monto y pagador");
      return;
    }

    setLoading(true);
    const montoNum = parseEuropean(form.Monto);
    const fields: Record<string, unknown> = {
      Monto: parseFloat(montoNum),
      Moneda: form.Moneda,
      Fecha: form.Fecha,
      Pagador: form.Pagador,
      FacturaRef: form.FacturaRef || null,
      Descripcion: form.Descripcion || null,
      Pais: form.Pais,
      Notas: form.Notas || null,
    };

    const formData = new FormData();
    formData.append("fields", JSON.stringify(fields));
    if (pdfFile) formData.append("file", pdfFile);

    const res = await fetch("/api/pagos", { method: "POST", body: formData });
    if (!res.ok) {
      toast.error("Error al guardar el pago");
      setLoading(false);
      return;
    }

    // Mark matched invoice as Pagado
    if (selectedFacturaId) {
      await fetch(`/api/facturas/${selectedFacturaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Estado: "Pagado" }),
      });
      toast.success("Factura marcada como Pagada");
    }

    toast.success("Pago registrado");
    router.push("/pagos");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold">Nuevo Pago</h2>

      <PdfUploaderPago onExtracted={handleExtracted} />

      {pdfName && (
        <p className="text-sm text-muted-foreground">
          PDF cargado: <span className="font-medium">{pdfName}</span>
        </p>
      )}

      {/* Facturas impagas para vincular */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold border-b pb-2">Vincular a Factura Impaga</h3>
        {loadingFacturas ? (
          <p className="text-sm text-gray-400">Cargando facturas impagas...</p>
        ) : facturasImpagas.length === 0 ? (
          <p className="text-sm text-gray-400">No hay facturas impagas</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {facturasImpagas.map((f) => (
              <div
                key={f.id}
                onClick={() => selectFactura(selectedFacturaId === f.id ? null : f.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedFacturaId === f.id
                    ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                    : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{f.fields.Cliente || f.fields.Emisor}</span>
                    {f.fields.Numero && (
                      <span className="text-xs text-gray-400 ml-2">#{f.fields.Numero}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-semibold">
                      {formatCurrency(f.fields.Monto, f.fields.Moneda as Moneda)}
                    </span>
                    <p className="text-xs text-gray-400">{formatDate(f.fields.Fecha)}</p>
                  </div>
                </div>
                {selectedFacturaId === f.id && (
                  <p className="text-xs text-emerald-600 mt-1">Se marcara como Pagada al guardar</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <h3 className="text-lg font-semibold border-b pb-2">Datos del Pago</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Pagador *</Label>
          <Input
            placeholder="Quien realizo el pago"
            value={form.Pagador}
            onChange={(e) => updateField("Pagador", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Fecha</Label>
          <Input
            type="date"
            value={form.Fecha}
            onChange={(e) => updateField("Fecha", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Monto *</Label>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={form.Monto}
            onChange={(e) => updateField("Monto", e.target.value)}
            onBlur={() => updateField("Monto", formatEuropean(parseEuropean(form.Monto)))}
            required
            className="font-semibold"
          />
        </div>
        <div className="space-y-2">
          <Label>Moneda</Label>
          <Select value={form.Moneda} onValueChange={(v) => updateField("Moneda", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
              <SelectItem value="CLP">CLP - Peso Chileno</SelectItem>
              <SelectItem value="PYG">PYG - Guarani</SelectItem>
              <SelectItem value="USD">USD - Dolar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Pais</Label>
          <Select value={form.Pais} onValueChange={(v) => updateField("Pais", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Argentina">Argentina</SelectItem>
              <SelectItem value="Chile">Chile</SelectItem>
              <SelectItem value="Paraguay">Paraguay</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ref. Factura</Label>
          <Input
            placeholder="Numero de factura pagada"
            value={form.FacturaRef}
            onChange={(e) => updateField("FacturaRef", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descripcion</Label>
        <Textarea
          placeholder="Concepto o detalle del pago"
          value={form.Descripcion}
          onChange={(e) => updateField("Descripcion", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Notas</Label>
        <Textarea
          placeholder="Notas adicionales"
          value={form.Notas}
          onChange={(e) => updateField("Notas", e.target.value)}
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          {loading ? "Guardando..." : "Registrar Pago"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/pagos")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
