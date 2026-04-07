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
    Monto: "",
    Moneda: "USD",
    Fecha: new Date().toISOString().split("T")[0],
    Emisor: "",
    CUIT_RUT_RUC: "",
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
      Monto: data.monto != null ? String(data.monto) : prev.Monto,
      Moneda: data.moneda || prev.Moneda,
      Fecha: data.fecha || prev.Fecha,
      Emisor: data.emisor || prev.Emisor,
      CUIT_RUT_RUC: data.cuit_rut_ruc || prev.CUIT_RUT_RUC,
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
      Monto: parseFloat(form.Monto),
      Moneda: form.Moneda,
      Fecha: form.Fecha,
      Emisor: form.Emisor,
      CUIT_RUT_RUC: form.CUIT_RUT_RUC || null,
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
          <Label>Emisor *</Label>
          <Input
            placeholder="Empresa emisora"
            value={form.Emisor}
            onChange={(e) => updateField("Emisor", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Monto *</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={form.Monto}
            onChange={(e) => updateField("Monto", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Moneda</Label>
          <Select value={form.Moneda} onValueChange={(v) => updateField("Moneda", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ARS">ARS</SelectItem>
              <SelectItem value="CLP">CLP</SelectItem>
              <SelectItem value="PYG">PYG</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>CUIT / RUT / RUC</Label>
          <Input
            placeholder="ID fiscal"
            value={form.CUIT_RUT_RUC}
            onChange={(e) => updateField("CUIT_RUT_RUC", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>País</Label>
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
