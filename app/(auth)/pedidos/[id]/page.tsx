"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/client";
import type { Pedido } from "@/lib/types";
import { BadgeEstado } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatearFecha } from "@/lib/utils";
import {
  ArrowLeft,
  Check,
  X,
  Truck,
  PackageCheck,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export default function DetallePedidoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pedido, setPedido] = React.useState<Pedido | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [cargando, setCargando] = React.useState(true);
  const [accion, setAccion] = React.useState<string | null>(null);

  // --- Estado para confirmar entrega con OTP ---
  const [otp, setOtp] = React.useState("");
  const [capturandoGps, setCapturandoGps] = React.useState(false);
  const [ultimoIntentoFallido, setUltimoIntentoFallido] = React.useState<
    number | null
  >(null);
  const [bloqueadoPorIntentos, setBloqueadoPorIntentos] = React.useState(false);

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

  /**
   * Captura la posición actual del navegador UNA vez para adjuntarla a la
   * entrega como evidencia antifraude. Si falla, devolvemos null: el backend
   * seguirá aceptando la entrega, pero la marcará como alerta.
   */
  function capturarUbicacion(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!("geolocation" in navigator)) {
        resolve(null);
        return;
      }
      setCapturandoGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCapturandoGps(false);
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setCapturandoGps(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
      );
    });
  }

  async function confirmarEntregaConOtp() {
    if (!pedido) return;
    const otpLimpio = otp.replace(/\s+/g, "");
    if (otpLimpio.length < 4) {
      setError("Pídele al cliente el código de verificación antes de confirmar.");
      return;
    }
    setAccion("entregar");
    setError(null);
    try {
      const coords = await capturarUbicacion();
      const actualizado = await api.entregarConOTP(pedido.id, {
        otp: otpLimpio,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      });
      setPedido(actualizado);
      setOtp("");
      setUltimoIntentoFallido(null);
      setBloqueadoPorIntentos(false);
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        const data = (e as ApiError & { intentos?: number; bloqueado?: boolean });
        if (typeof data.intentos === "number") {
          setUltimoIntentoFallido(data.intentos);
        }
        if (data.bloqueado) {
          setBloqueadoPorIntentos(true);
        }
      } else {
        setError("Error inesperado");
      }
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
            <p className="font-medium">{pedido.direccion_recojo}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">
              Dirección de entrega
            </p>
            <p className="font-medium">{pedido.direccion_entrega}</p>
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
            <p>{formatearFecha(pedido.creado_en)}</p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {pedido.estado === "pendiente" && (
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

        {pedido.estado === "asignado" && (
          <Button
            size="lg"
            disabled={enAccion}
            onClick={() =>
              ejecutar(() => api.estado(pedido.id, "en_camino"), "iniciar")
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

        {pedido.estado === "en_camino" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Confirmar entrega con código
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <p className="text-xs text-muted-foreground">
                Pídele al cliente el código de 6 dígitos que recibió de la
                empresa. Al confirmarlo se registra la entrega con tu
                ubicación actual como evidencia.
              </p>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ""));
                  setError(null);
                }}
                disabled={enAccion || bloqueadoPorIntentos}
                className="w-full rounded-md border border-input bg-background px-3 py-3 text-center font-mono text-2xl tracking-[0.4em] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                autoComplete="one-time-code"
              />
              {ultimoIntentoFallido !== null && !bloqueadoPorIntentos && (
                <p className="text-xs text-amber-700">
                  {ultimoIntentoFallido === 1
                    ? "Código incorrecto. Vuelve a intentarlo (máx. 3)."
                    : `Código incorrecto. Te queda${ultimoIntentoFallido === 2 ? " 1" : ""} intento antes de bloquearse.`}
                </p>
              )}
              {bloqueadoPorIntentos && (
                <p className="text-xs text-red-700">
                  Has agotado los intentos. Solicita un nuevo código a la
                  empresa para continuar.
                </p>
              )}
              <Button
                size="lg"
                disabled={enAccion || bloqueadoPorIntentos || otp.length < 4}
                onClick={confirmarEntregaConOtp}
              >
                {accion === "entregar" || capturandoGps ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <PackageCheck className="h-5 w-5" />
                )}
                {capturandoGps
                  ? "Capturando ubicación…"
                  : accion === "entregar"
                    ? "Confirmando…"
                    : "Confirmar entrega"}
              </Button>
            </CardContent>
          </Card>
        )}

        {pedido.estado === "entregado" && (
          <p className="rounded-md bg-muted px-3 py-2 text-center text-sm text-muted-foreground">
            Pedido entregado · solo consulta
          </p>
        )}
      </div>
    </div>
  );
}
