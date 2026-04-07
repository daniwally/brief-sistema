"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { ExtractedInvoice } from "@/lib/types";

interface PdfUploaderProps {
  onExtracted: (data: ExtractedInvoice, file: File) => void;
}

export function PdfUploader({ onExtracted }: PdfUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    if (file.type !== "application/pdf") {
      setError("El archivo debe ser un PDF");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("El archivo no puede superar 4MB");
      return;
    }

    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/extract-invoice", {
        method: "POST",
        body: formData,
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Respuesta inválida del servidor: ${text.substring(0, 200)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Error al procesar el PDF");
      }

      onExtracted(data, file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el PDF");
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        {loading ? (
          <div className="space-y-2">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            <p className="text-sm text-muted-foreground">
              Extrayendo datos de la factura...
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-lg font-medium">Arrastrá un PDF aquí</p>
            <p className="text-sm text-muted-foreground">
              o hacé click para seleccionar un archivo
            </p>
            <p className="text-xs text-muted-foreground">PDF, máximo 4MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
