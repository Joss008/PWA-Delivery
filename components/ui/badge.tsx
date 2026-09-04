import * as React from "react";
import { cn } from "@/lib/utils";
import type { EstadoPedido } from "@/lib/types";

const estilos: Record<EstadoPedido, string> = {
  pendiente: "bg-amber-100 text-amber-700 border-amber-200",
  asignado: "bg-blue-100 text-blue-700 border-blue-200",
  en_camino: "bg-violet-100 text-violet-700 border-violet-200",
  entregado: "bg-green-100 text-green-700 border-green-200",
};

const etiquetas: Record<EstadoPedido, string> = {
  pendiente: "Pendiente",
  asignado: "Asignado",
  en_camino: "En camino",
  entregado: "Entregado",
};

export function BadgeEstado({ estado }: { estado: EstadoPedido }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        estilos[estado]
      )}
    >
      {etiquetas[estado]}
    </span>
  );
}
