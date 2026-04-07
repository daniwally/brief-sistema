"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/shared/date-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface CategoriaRecord {
  id: string;
  fields: { Nombre: string };
}

export function GastoForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaRecord[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    Monto: "",
    Moneda: "USD",
    Fecha: new Date().toISOString().split("T")[0],
    Proveedor: "",
    Categoria: "",
    Descripcion: "",
    Pais: "Argentina",
    Estado: "Impago",
    Notas: "",
  });

  useEffect(() => {
    fetch("/api/categorias")
      .then((r) => r.json())
      .then(setCategorias)
      .catch(() => {});
  }, []);

  function updateField(field: string, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.Monto || !form.Proveedor) {
      toast.error("Completá monto y proveedor");
      return;
    }

    setLoading(true);
    const fields: Record<string, unknown> = {
      Monto: parseFloat(form.Monto),
      Moneda: form.Moneda,
      Fecha: form.Fecha,
      Proveedor: form.Proveedor,
      Descripcion: form.Descripcion || null,
      Pais: form.Pais,
      Estado: form.Estado,
      Notas: form.Notas || null,
    };
    if (form.Categoria) {
      fields.Categoria = [form.Categoria];
    }

    const formData = new FormData();
    formData.append("fields", JSON.stringify(fields));
    if (file) formData.append("file", file);

    const res = await fetch("/api/gastos", { method: "POST", body: formData });
    if (res.ok) {
      toast.success("Compra registrada");
      router.push("/gastos");
    } else {
      toast.error("Error al guardar la compra");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nueva Compra</h2>
          <p className="text-sm text-gray-400">Registrar gasto o compra</p>
        </div>
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => router.push("/gastos")}>
          Volver a Compras
        </Button>
      </div>

    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
      <div className="grid grid-cols-2 gap-4">
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fecha</Label>
          <DateInput
            value={form.Fecha}
            onChange={(v) => updateField("Fecha", v)}
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Proveedor *</Label>
          <Input
            placeholder="Nombre del proveedor"
            value={form.Proveedor}
            onChange={(e) => updateField("Proveedor", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Categoría</Label>
          <Select value={form.Categoria} onValueChange={(v) => updateField("Categoria", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.fields.Nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descripción</Label>
        <Textarea
          placeholder="Detalle del gasto"
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
        <div className="space-y-2">
          <Label>Comprobante (PDF)</Label>
          <Input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
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

      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading} className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white shadow-sm">
          {loading ? "Guardando..." : "Guardar Compra"}
        </Button>
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => router.push("/gastos")}>
          Cancelar
        </Button>
      </div>
    </form>
    </div>
  );
}
