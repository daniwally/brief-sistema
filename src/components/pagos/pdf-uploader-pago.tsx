"use client";

import { useState, useRef } from "react";
import type { ExtractedPayment } from "@/lib/types";

interface PdfUploaderPagoProps {
  onExtracted: (data: ExtractedPayment, file: File) => void;
}

export function PdfUploaderPago({ onExtracted }: PdfUploaderPagoProps) {
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
      const res = await fetch("/api/extract-payment", {
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
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? "border-gray-500 bg-gray-50 scale-[1.01] shadow-sm"
            : "border-gray-200 hover:border-gray-400 hover:bg-gray-50/50"
        }`}
      >
        {loading ? (
          <div className="space-y-4 py-4">
            <div className="relative mx-auto w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-gray-500 animate-spin" />
              <div className="absolute inset-3 rounded-full border-4 border-transparent border-b-gray-300 animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
              <svg className="absolute inset-0 m-auto w-5 h-5 text-gray-500 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">
                Analizando comprobante de pago...
              </p>
              <p className="text-xs text-gray-400">
                Extrayendo pagador, monto y factura asociada
              </p>
            </div>
            <div className="mx-auto w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-gray-400 to-gray-500 rounded-full animate-[loading_2s_ease-in-out_infinite]" />
            </div>
          </div>
        ) : (
          <div className="space-y-2 py-2">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="text-base font-medium text-gray-700">Arrastrá un comprobante de pago PDF</p>
            <p className="text-sm text-gray-400">
              o hacé click para seleccionar un archivo
            </p>
            <p className="text-xs text-gray-300">PDF, maximo 4MB</p>
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
