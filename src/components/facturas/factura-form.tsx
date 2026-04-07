"use client";

import { useState } from "react";
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
import { PdfUploader } from "./pdf-uploader";
import { toast } from "sonner";
import type { ExtractedInvoice } from "@/lib/types";

export function FacturaForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);

  const [form, setForm] = useState({
    Numero: "",
    Neto: "",
    Impuestos: "",
    DetalleImpuestos: "",
    Monto: "",
    Moneda: "USD",
    Fecha: new Date().toISOString().split("T")[0],
    Emisor: "",
    CUIT_RUT_RUC: "",
    Cliente: "",
    CUIT_RUT_RUC_Cliente: "",
    Descripcion: "",
    Pais: "Argentina",
    Estado: "Impago",
    Notas: "",
  });

  function updateField(field: string, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
  }

  function handleExtracted(data: ExtractedInvoice, file: File) {
    setPdfFile(file);
    setPdfName(file.name);
    setForm((prev) => ({
      ...prev,
      Numero: data.numero || prev.Numero,
      Neto: data.neto != null ? String(data.neto) : prev.Neto,
      Impuestos: data.impuestos != null ? String(data.impuestos) : prev.Impuestos,
      DetalleImpuestos: data.detalle_impuestos || prev.DetalleImpuestos,
      Monto: data.monto != null ? String(data.monto) : prev.Monto,
      Moneda: data.moneda || prev.Moneda,
      Fecha: data.fecha || prev.Fecha,
      Emisor: data.emisor || prev.Emisor,
      CUIT_RUT_RUC: data.cuit_rut_ruc || prev.CUIT_RUT_RUC,
      Cliente: data.cliente || prev.Cliente,
      CUIT_RUT_RUC_Cliente: data.cuit_rut_ruc_cliente || prev.CUIT_RUT_RUC_Cliente,
      Descripcion: data.descripcion || prev.Descripcion,
      Pais: data.pais || prev.Pais,
    }));
    toast.success("Datos extraídos del PDF. Revisá y corregí si es necesario.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.Monto || !form.Emisor) {
      toast.error("Completá monto y emisor");
      return;
    }

    setLoading(true);
    const fields: Record<string, unknown> = {
      Numero: form.Numero || null,
      Neto: form.Neto ? parseFloat(form.Neto) : null,
      Impuestos: form.Impuestos ? parseFloat(form.Impuestos) : null,
      DetalleImpuestos: form.DetalleImpuestos || null,
      Monto: parseFloat(form.Monto),
      Moneda: form.Moneda,
      Fecha: form.Fecha,
      Emisor: form.Emisor,
      CUIT_RUT_RUC: form.CUIT_RUT_RUC || null,
      Cliente: form.Cliente || null,
      CUIT_RUT_RUC_Cliente: form.CUIT_RUT_RUC_Cliente || null,
      Descripcion: form.Descripcion || null,
      Pais: form.Pais,
      Estado: form.Estado,
      Notas: form.Notas || null,
    };

    const formData = new FormData();
    formData.append("fields", JSON.stringify(fields));
    if (pdfFile) formData.append("file", pdfFile);

    const res = await fetch("/api/facturas", { method: "POST", body: formData });
    if (res.ok) {
      toast.success("Factura registrada");
      router.push("/facturas");
    } else {
      toast.error("Error al guardar la factura");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold">Nueva Factura</h2>

      <PdfUploader onExtracted={handleExtracted} />

      {pdfName && (
        <p className="text-sm text-muted-foreground">
          PDF cargado: <span className="font-medium">{pdfName}</span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Número de Factura</Label>
          <Input
            placeholder="001-00001234"
            value={form.Numero}
            onChange={(e) => updateField("Numero", e.target.value)}
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

      <h3 className="text-lg font-semibold border-b pb-2">Emisor</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Emisor *</Label>
          <Input
            placeholder="Empresa que emite la factura"
            value={form.Emisor}
            onChange={(e) => updateField("Emisor", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>CUIT / RUT / RUC (Emisor)</Label>
          <Input
            placeholder="ID fiscal del emisor"
            value={form.CUIT_RUT_RUC}
            onChange={(e) => updateField("CUIT_RUT_RUC", e.target.value)}
          />
        </div>
      </div>

      <h3 className="text-lg font-semibold border-b pb-2">Cliente</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cliente</Label>
          <Input
            placeholder="Empresa o persona que recibe la factura"
            value={form.Cliente}
            onChange={(e) => updateField("Cliente", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>CUIT / RUT / RUC (Cliente)</Label>
          <Input
            placeholder="ID fiscal del cliente"
            value={form.CUIT_RUT_RUC_Cliente}
            onChange={(e) => updateField("CUIT_RUT_RUC_Cliente", e.target.value)}
          />
        </div>
      </div>

      <h3 className="text-lg font-semibold border-b pb-2">Importes</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Neto (subtotal)</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={form.Neto}
            onChange={(e) => updateField("Neto", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Impuestos</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={form.Impuestos}
            onChange={(e) => updateField("Impuestos", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Total *</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={form.Monto}
            onChange={(e) => updateField("Monto", e.target.value)}
            required
            className="font-semibold"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Detalle de impuestos</Label>
        <Textarea
          placeholder="Ej: IVA 21%: $2100, IIBB 3%: $300, Percepciones: $150"
          value={form.DetalleImpuestos}
          onChange={(e) => updateField("DetalleImpuestos", e.target.value)}
          className="text-sm"
        />
      </div>

      <h3 className="text-lg font-semibold border-b pb-2">Detalle</h3>
      <div className="grid grid-cols-3 gap-4">
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

      <div className="space-y-2">
        <Label>Descripción</Label>
        <Textarea
          placeholder="Detalle de servicios o bienes"
          value={form.Descripcion}
          onChange={(e) => updateField("Descripcion", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Estado</Label>
          <Select value={form.Estado} onValueChange={(v) => updateField("Estado", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Impago">Impago</SelectItem>
              <SelectItem value="Pagado">Pagado</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar Factura"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/facturas")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
