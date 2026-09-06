"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useGeo } from "@/components/geo-provider";
import { api, ApiError } from "@/lib/client";
import type { Pedido } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeEstado } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  MapPinOff,
  Inbox,
  Loader2,
  Check,
  X,
  Calendar,
  Building2,
  Sparkles,
  ArrowRight,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

const formatoFechaCorta = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function formatear(ts: number | string): string {
  return formatoFechaCorta.format(new Date(ts));
}

export default function InicioPage() {
  const router = useRouter();
  const { repartidor } = useAuth();
  const {
    estado: estadoGeo,
    ultimoEnvio,
    ultimaConocida,
    habilitado,
    setHabilitado,
    enviarUbicacionAhora,
  } = useGeo();

  const [pedidos, setPedidos] = React.useState<Pedido[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [confirmando, setConfirmando] = React.useState<Pedido | null>(null);
  const [procesando, setProcesando] = React.useState(false);
  const [errorModal, setErrorModal] = React.useState<string | null>(null);

  const cargar = React.useCallback(async () => {
    try {
      const lista = await api.pedidos();
      setPedidos(lista.filter((p) => p.estado === "pendiente"));
    } catch {
      setPedidos([]);
    } finally {
      setCargando(false);
    }
  }, []);

  React.useEffect(() => {
    void cargar();
  }, [cargar]);

  async function aceptarConfirmado() {
    if (!confirmando) return;
    setProcesando(true);
    setErrorModal(null);
    try {
      await api.aceptar(confirmando.id);
      const id = confirmando.id;
      setConfirmando(null);
      router.push(`/pedidos/${id}`);
    } catch (e) {
      setErrorModal(
        e instanceof ApiError ? e.message : "Error al aceptar el pedido"
      );
    } finally {
      setProcesando(false);
    }
  }

  const gpsActivo = habilitado && estadoGeo === "activo";
  const gpsPausado = !habilitado;
  const actualizacion = ultimoEnvio
    ? formatear(ultimoEnvio.ts)
    : gpsPausado
    ? "En pausa"
    : "Esperando señal…";
  // Mientras llega la primera captura, mostramos la última coordenada que el
  // backend tiene guardada para que el repartidor vea continuidad entre
  // sesiones.
  const ultimaConocidaTexto = ultimaConocida
    ? `${ultimaConocida.lat.toFixed(5)}, ${ultimaConocida.lng.toFixed(5)} · ${formatear(ultimaConocida.ts)}`
    : null;

  const estadoCapitalizado = repartidor?.estado
    ? repartidor.estado.charAt(0).toUpperCase() + repartidor.estado.slice(1)
    : "";

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between pt-1">
        <div>
          <p className="text-sm text-muted-foreground">Hola,</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {repartidor?.nombre.split(" ")[0]}
          </h1>
        </div>
        <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {estadoCapitalizado}
        </span>
      </header>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex items-center gap-3 p-4">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
              gpsActivo
                ? "bg-green-100 text-green-600"
                : gpsPausado
                ? "bg-muted text-muted-foreground"
                : "bg-amber-100 text-amber-600"
            )}
          >
            {gpsActivo ? (
              <MapPin className="h-5 w-5" />
            ) : (
              <MapPinOff className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium leading-none">GPS</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Actualización:{" "}
              <span className="font-medium text-foreground/80">
                {actualizacion}
              </span>
            </p>
            {!ultimoEnvio && ultimaConocidaTexto && (
              <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground">
                <History className="h-3 w-3 shrink-0" />
                <span className="font-medium uppercase tracking-wide">
                  No es tiempo real
                </span>
                <span className="text-muted-foreground/70">·</span>
                <span className="truncate">{ultimaConocidaTexto}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => void enviarUbicacionAhora()}
            disabled={!habilitado || estadoGeo === "sin_permiso"}
            className="rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Enviar ahora
          </button>
          <Switch checked={habilitado} onCheckedChange={setHabilitado} />
        </CardContent>
      </Card>

      <section>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Inbox className="h-4 w-4 text-primary" />
            Nuevos pedidos
          </h2>
          {!cargando && pedidos.length > 0 && (
            <span className="text-xs font-medium text-muted-foreground">
              {pedidos.length}{" "}
              {pedidos.length === 1 ? "disponible" : "disponibles"}
            </span>
          )}
        </div>

        {cargando ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : pedidos.length === 0 ? (
          <Card className="border-dashed bg-card/50">
            <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium">No hay pedidos nuevos</p>
              <p className="text-xs text-muted-foreground">
                Te avisaremos cuando llegue uno
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {pedidos.map((p) => (
              <Card
                key={p.id}
                className="overflow-hidden border-border/60 shadow-sm"
              >
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold tracking-tight">
                      {p.codigo}
                    </span>
                    <BadgeEstado estado={p.estado} />
                  </div>
                  <div className="mb-3 flex items-center gap-1.5 text-sm font-medium">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    {p.empresa}
                  </div>
                  <div className="mb-3 space-y-1.5 text-xs">
                    <div className="flex gap-2">
                      <span className="font-semibold uppercase tracking-wide text-muted-foreground w-14 shrink-0">
                        Recojo
                      </span>
                      <span className="text-foreground/90">
                        {p.direccion_recojo}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-semibold uppercase tracking-wide text-muted-foreground w-14 shrink-0">
                        Entrega
                      </span>
                      <span className="text-foreground/90">
                        {p.direccion_entrega}
                      </span>
                    </div>
                    {p.observaciones && (
                      <div className="flex gap-2 pt-1">
                        <span className="font-semibold uppercase tracking-wide text-muted-foreground w-14 shrink-0">
                          Nota
                        </span>
                        <span className="text-foreground/90">
                          {p.observaciones}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatear(p.creado_en)}
                  </div>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => setConfirmando(p)}
                  >
                    <Check className="h-5 w-5" />
                    Aceptar pedido
                    <ArrowRight className="h-4 w-4 opacity-80" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {confirmando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => !procesando && setConfirmando(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-titulo"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex items-start justify-between p-5 pb-3">
              <div>
                <h3
                  id="modal-titulo"
                  className="text-lg font-bold leading-tight"
                >
                  Confirmación de toma de pedido
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Vas a tomar este pedido. Confirma para iniciar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmando(null)}
                disabled={procesando}
                className="ml-3 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5">
              <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-semibold tracking-tight">
                    {confirmando.codigo}
                  </span>
                  <BadgeEstado estado={confirmando.estado} />
                </div>
                <p className="text-sm font-medium">{confirmando.empresa}</p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {confirmando.direccion_recojo}
                  <ArrowRight className="mx-1 inline h-3 w-3" />
                  {confirmando.direccion_entrega}
                </p>
              </div>
            </div>

            {errorModal && (
              <p className="mx-5 mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorModal}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 p-5 pt-3 sm:flex-row">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => setConfirmando(null)}
                disabled={procesando}
              >
                Cancelar
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onClick={aceptarConfirmado}
                disabled={procesando}
              >
                {procesando ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}