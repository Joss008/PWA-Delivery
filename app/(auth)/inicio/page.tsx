"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useGeo } from "@/components/geo-provider";
import { api } from "@/lib/client";
import type { Pedido } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeEstado } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, MapPinOff, ArrowRight, ClipboardList, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const WEB_BASE_URL = "http://localhost:3001";

const UBICACIONES = [
  { nombre: "Plaza de Armas", lat: -13.07777, lng: -76.38745 },
  { nombre: "Mercado Central", lat: -13.0791, lng: -76.3852 },
  { nombre: "Av. Los Libertadores", lat: -13.0749, lng: -76.3901 },
];

interface RepartidorWeb {
  id: number;
  nombre: string;
  lat: number;
  lng: number;
}

export default function InicioPage() {
  const { repartidor } = useAuth();
  const { estado: estadoGps } = useGeo();
  const [activo, setActivo] = React.useState<Pedido | null>(null);
  const [enviando, setEnviando] = React.useState(false);
  const [mensaje, setMensaje] = React.useState<string | null>(null);
  const indice = React.useRef(0);

  async function enviarUbicacion() {
    if (!repartidor) return;
    setEnviando(true);
    setMensaje(null);
    try {
      const ubicacion = UBICACIONES[indice.current % UBICACIONES.length];
      indice.current += 1;

      const listaRes = await fetch(`${WEB_BASE_URL}/api/repartidores`);
      if (!listaRes.ok) {
        throw new Error(`Error al listar repartidores (${listaRes.status})`);
      }
      const repartidores = (await listaRes.json()) as RepartidorWeb[];

      const destino =
        repartidores.find((r) => r.id === repartidor.id) ??
        repartidores.find((r) => r.nombre.toLowerCase().includes(repartidor.nombre.toLowerCase())) ??
        repartidores[0];

      if (!destino) {
        throw new Error("No hay repartidores en la plataforma web");
      }

      const res = await fetch(`${WEB_BASE_URL}/api/ubicaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repartidor_id: destino.id,
          lat: ubicacion.lat,
          lng: ubicacion.lng,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Error ${res.status}`);
      }

      setMensaje(
        `Ubicación enviada: ${ubicacion.nombre} (${destino.nombre}, id ${destino.id})`
      );
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : "Error al enviar");
    } finally {
      setEnviando(false);
    }
  }

  React.useEffect(() => {
    api
      .pedidos()
      .then((pedidos) => {
        const p = pedidos.find(
          (x) =>
            x.repartidorId === repartidor?.id &&
            (x.estado === "ASIGNADO" || x.estado === "EN_CAMINO")
        );
        setActivo(p ?? null);
      })
      .catch(() => setActivo(null));
  }, [repartidor]);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-bold">Hola, {repartidor?.nombre.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">
          Estado:{" "}
          <span className="font-medium text-foreground">{repartidor?.estado}</span>
        </p>
      </header>

      <Button
        onClick={enviarUbicacion}
        disabled={enviando}
        variant="secondary"
        className="w-full"
      >
        {enviando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Enviar ubicación a la web (San Vicente)
      </Button>

      {mensaje && (
        <p className="rounded-md bg-accent px-3 py-2 text-sm text-muted-foreground">
          {mensaje}
        </p>
      )}

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              estadoGps === "activo"
                ? "bg-green-100 text-green-600"
                : "bg-amber-100 text-amber-600"
            )}
          >
            {estadoGps === "activo" ? (
              <MapPin className="h-5 w-5" />
            ) : (
              <MapPinOff className="h-5 w-5" />
            )}
          </div>
          <div>
            <p className="font-medium">GPS</p>
            <p className="text-sm text-muted-foreground">
              {estadoGps === "activo"
                ? "Enviando ubicación en tiempo real"
                : estadoGps === "sin_permiso"
                ? "Permiso de ubicación denegado"
                : estadoGps === "error"
                ? "Error al obtener ubicación"
                : "Solicitando ubicación…"}
            </p>
          </div>
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
                {activo.direccionRecojo} → {activo.direccionEntrega}
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
