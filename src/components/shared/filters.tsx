"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DateInput } from "./date-input";

interface FiltersProps {
  pais: string;
  setPais: (v: string) => void;
  estado: string;
  setEstado: (v: string) => void;
  desde: string;
  setDesde: (v: string) => void;
  hasta: string;
  setHasta: (v: string) => void;
  onClear: () => void;
}

function wrapHandler(fn: (v: string) => void) {
  return (v: string | null) => fn(v ?? "all");
}

export function Filters({
  pais,
  setPais,
  estado,
  setEstado,
  desde,
  setDesde,
  hasta,
  setHasta,
  onClear,
}: FiltersProps) {
  return (
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
        <Label className="text-xs">Estado</Label>
        <Select value={estado} onValueChange={wrapHandler(setEstado)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Pagado">Pagado</SelectItem>
            <SelectItem value="Impago">Impago</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Desde</Label>
        <DateInput
          value={desde}
          onChange={setDesde}
          className="w-[120px]"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Hasta</Label>
        <DateInput
          value={hasta}
          onChange={setHasta}
          className="w-[120px]"
        />
      </div>
      <Button variant="outline" size="sm" onClick={onClear}>
        Limpiar
      </Button>
    </div>
  );
}
