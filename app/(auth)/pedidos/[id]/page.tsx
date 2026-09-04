"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/client";
import type { Pedido } from "@/lib/types";
import { BadgeEstado } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatearFecha } from "@/lib/utils";
import { ArrowLeft, Check, X, Truck, PackageCheck, Loader2 } from "lucide-react";

export default function DetallePedidoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pedido, setPedido] = React.useState<Pedido | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [cargando, setCargando] = React.useState(true);
  const [accion, setAccion] = React.useState<string | null>(null);

  const id = Number(params.id);

  React.useEffect(() => {
    api
      .pedido(id)
      .then(setPedido)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [id]);

  async function ejecutar(fn: () => Promise<Pedido>, nombre: string) {
    setAccion(nombre);
    setError(null);
    try {
      const actualizado = await fn();
      setPedido(actualizado);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Error inesperado");
    } finally {
      setAccion(null);
    }
  }

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>
        <p className="text-sm text-muted-foreground">{error ?? "Pedido no encontrado"}</p>
      </div>
    );
  }

  const enAccion = accion !== null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-md border bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold">Detalle del pedido</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>{pedido.codigo}</CardTitle>
            <BadgeEstado estado={pedido.estado} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Empresa</p>
            <p className="font-medium">{pedido.empresa}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">
              Dirección de recojo
            </p>
            <p className="font-medium">{pedido.direccionRecojo}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">
              Dirección de entrega
            </p>
            <p className="font-medium">{pedido.direccionEntrega}</p>
          </div>
          {pedido.observaciones && (
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Observaciones
              </p>
              <p>{pedido.observaciones}</p>
            </div>
          )}
          <div>
            <p className="text-xs uppercase text-muted-foreground">Fecha</p>
            <p>{formatearFecha(pedido.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {pedido.estado === "PENDIENTE" && (
          <>
            <Button
              size="lg"
              disabled={enAccion}
              onClick={() =>
                ejecutar(() => api.aceptar(pedido.id), "aceptar")
              }
            >
              {accion === "aceptar" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Check className="h-5 w-5" />
              )}
              Aceptar pedido
            </Button>
            <Button
              size="lg"
              variant="outline"
              disabled={enAccion}
              onClick={() =>
                ejecutar(() => api.rechazar(pedido.id), "rechazar")
              }
            >
              {accion === "rechazar" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <X className="h-5 w-5" />
              )}
              Rechazar pedido
            </Button>
          </>
        )}

        {pedido.estado === "ASIGNADO" && (
          <Button
            size="lg"
            disabled={enAccion}
            onClick={() =>
              ejecutar(() => api.estado(pedido.id, "EN_CAMINO"), "iniciar")
            }
          >
            {accion === "iniciar" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Truck className="h-5 w-5" />
            )}
            Iniciar entrega
          </Button>
        )}

        {pedido.estado === "EN_CAMINO" && (
          <Button
            size="lg"
            disabled={enAccion}
            onClick={() =>
              ejecutar(() => api.estado(pedido.id, "ENTREGADO"), "entregar")
            }
          >
            {accion === "entregar" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <PackageCheck className="h-5 w-5" />
            )}
            Marcar como entregado
          </Button>
        )}

        {pedido.estado === "ENTREGADO" && (
          <p className="rounded-md bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
            Pedido entregado · solo consulta
          </p>
        )}
      </div>
    </div>
  );
}
