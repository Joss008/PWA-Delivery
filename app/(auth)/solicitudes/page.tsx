"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { useAuth } from "@/components/auth-provider";
import type { EstadoPedido, Pedido } from "@/lib/types";
import { BadgeEstado } from "@/components/ui/badge";
import { formatearFecha, cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Filtro = "TODOS" | EstadoPedido;

const filtros: { key: Filtro; label: string }[] = [
  { key: "TODOS", label: "Todos" },
  { key: "pendiente", label: "Pendientes" },
  { key: "asignado", label: "Asignados" },
  { key: "en_camino", label: "En camino" },
  { key: "entregado", label: "Entregados" },
];

function visiblePara(repartidorId: number, pedido: Pedido): boolean {
  if (pedido.estado === "pendiente") return true;
  return pedido.repartidor_id === repartidorId;
}

export default function SolicitudesPage() {
  const { repartidor } = useAuth();
  const [pedidos, setPedidos] = React.useState<Pedido[]>([]);
  const [filtro, setFiltro] = React.useState<Filtro>("TODOS");
  const [cargando, setCargando] = React.useState(true);

  React.useEffect(() => {
    api
      .pedidos()
      .then(setPedidos)
      .catch(() => setPedidos([]))
      .finally(() => setCargando(false));
  }, []);

  const propios = repartidor
    ? pedidos.filter((p) => visiblePara(repartidor.id, p))
    : [];

  const visibles =
    filtro === "TODOS" ? propios : propios.filter((p) => p.estado === filtro);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">Solicitudes</h1>
        <p className="text-sm text-muted-foreground">Bandeja de pedidos</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filtros.map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              filtro === f.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-card hover:bg-accent"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : visibles.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No hay pedidos en este filtro.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibles.map((p) => (
            <Link
              key={p.id}
              href={`/pedidos/${p.id}`}
              className="block rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">{p.codigo}</span>
                <BadgeEstado estado={p.estado} />
              </div>
              <p className="text-sm font-medium">{p.empresa}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Recoge: {p.direccion_recojo}
              </p>
              <p className="text-xs text-muted-foreground">
                Entrega: {p.direccion_entrega}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {formatearFecha(p.creado_en)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
