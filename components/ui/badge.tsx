import * as React from "react";
import { cn } from "@/lib/utils";
import type { EstadoPedido } from "@/lib/types";

const estilos: Record<EstadoPedido, string> = {
  PENDIENTE: "bg-amber-100 text-amber-700 border-amber-200",
  ASIGNADO: "bg-blue-100 text-blue-700 border-blue-200",
  EN_CAMINO: "bg-violet-100 text-violet-700 border-violet-200",
  ENTREGADO: "bg-green-100 text-green-700 border-green-200",
};

const etiquetas: Record<EstadoPedido, string> = {
  PENDIENTE: "Pendiente",
  ASIGNADO: "Asignado",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
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
