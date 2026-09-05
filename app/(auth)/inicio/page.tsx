"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useGeo } from "@/components/geo-provider";
import { api } from "@/lib/client";
import type { Pedido } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeEstado } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MapPin, MapPinOff, ArrowRight, ClipboardList, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InicioPage() {
  const { repartidor } = useAuth();
  const {
    detalle: detalleGeo,
    ultimoEnvio,
    habilitado,
    setHabilitado,
    enviarUbicacionPrueba,
  } = useGeo();
  const [activo, setActivo] = React.useState<Pedido | null>(null);
  const [enviandoPrueba, setEnviandoPrueba] = React.useState(false);

  React.useEffect(() => {
    api
      .pedidos()
      .then((pedidos) => {
        const p = pedidos.find(
          (x) =>
            x.repartidor_id === repartidor?.id &&
            (x.estado === "asignado" || x.estado === "en_camino")
        );
        setActivo(p ?? null);
      })
      .catch(() => setActivo(null));
  }, [repartidor]);

  async function probarUbicacion() {
    setEnviandoPrueba(true);
    try {
      await enviarUbicacionPrueba(-13.0833, -76.3833);
    } finally {
      setEnviandoPrueba(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold">Hola, {repartidor?.nombre.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">
          Estado:{" "}
          <span className="font-medium text-foreground">{repartidor?.estado}</span>
        </p>
      </header>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              habilitado && ultimoEnvio
                ? "bg-green-100 text-green-600"
                : habilitado
                ? "bg-amber-100 text-amber-600"
                : "bg-muted text-muted-foreground"
            )}
          >
            {habilitado && ultimoEnvio ? (
              <MapPin className="h-5 w-5" />
            ) : (
              <MapPinOff className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium">GPS</p>
            <p className="text-sm text-muted-foreground">
              {detalleGeo ?? "Ubicación en pausa"}
            </p>
          </div>
          <Switch checked={habilitado} onCheckedChange={setHabilitado} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div>
            <p className="text-sm font-medium">Prueba de envío</p>
            <p className="text-xs text-muted-foreground">
              Envía una coordenada fija al admin para verificar que la
              comunicación funciona (útil si tu navegador no detecta GPS).
            </p>
          </div>
          <button
            onClick={probarUbicacion}
            disabled={enviandoPrueba}
            className="inline-flex items-center justify-center gap-2 self-start rounded-md border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {enviandoPrueba ? "Enviando…" : "Enviar ubicación de prueba"}
          </button>
          {ultimoEnvio && (
            <p className="text-xs text-muted-foreground">
              Último envío: {ultimoEnvio.lat.toFixed(5)}, {ultimoEnvio.lng.toFixed(5)}{" "}
              ({new Date(ultimoEnvio.ts).toLocaleTimeString()})
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Pedido activo</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {activo ? (
            <Link
              href={`/pedidos/${activo.id}`}
              className="block rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">{activo.codigo}</span>
                <BadgeEstado estado={activo.estado} />
              </div>
              <p className="text-sm">{activo.empresa}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {activo.direccion_recojo} → {activo.direccion_entrega}
              </p>
              <div className="mt-2 flex items-center gap-1 text-sm font-medium text-primary">
                Ver detalle <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">
              No tienes un pedido activo en este momento.
            </p>
          )}
        </CardContent>
      </Card>

      <Link
        href="/solicitudes"
        className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent"
      >
        <div className="flex items-center gap-3">
          <ClipboardList className="h-5 w-5 text-primary" />
          <span className="font-medium">Ver solicitudes</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </div>
  );
}