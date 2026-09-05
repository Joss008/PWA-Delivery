"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { api, ApiError } from "@/lib/client";

interface GeoContextValue {
  estado: "sin_permiso" | "pendiente" | "activo" | "error";
  detalle: string | null;
  ultimaUbicacion: { latitude: number; longitude: number } | null;
  ultimoEnvio: { lat: number; lng: number; ts: number } | null;
  habilitado: boolean;
  setHabilitado: (habilitado: boolean) => void;
  enviarUbicacionPrueba: (lat: number, lng: number) => Promise<void>;
}

const GeoContext = React.createContext<GeoContextValue>({
  estado: "pendiente",
  detalle: null,
  ultimaUbicacion: null,
  ultimoEnvio: null,
  habilitado: true,
  setHabilitado: () => {},
  enviarUbicacionPrueba: async () => {},
});

const MIN_DISTANCIA_METROS = 30;
const INTERVALO_MIN_MS = 15_000;
const STORAGE_KEY = "gps_habilitado";

export function GeoProvider({ children }: { children: React.ReactNode }) {
  const { repartidor } = useAuth();
  const [estado, setEstado] =
    React.useState<GeoContextValue["estado"]>("pendiente");
  const [detalle, setDetalle] = React.useState<string | null>(null);
  const [ultimaUbicacion, setUltimaUbicacion] =
    React.useState<GeoContextValue["ultimaUbicacion"]>(null);
  const [ultimoEnvio, setUltimoEnvio] =
    React.useState<GeoContextValue["ultimoEnvio"]>(null);
  const [habilitado, setHabilitadoState] = React.useState(true);

  React.useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado !== null) setHabilitadoState(guardado === "1");
  }, []);

  const setHabilitado = React.useCallback((valor: boolean) => {
    localStorage.setItem(STORAGE_KEY, valor ? "1" : "0");
    setHabilitadoState(valor);
  }, []);

  const ultimaEnviada = React.useRef<{
    lat: number;
    lon: number;
    ts: number;
  } | null>(null);

  const enviarUbicacion = React.useCallback(
    async (lat: number, lng: number) => {
      const ts = Date.now();
      try {
        await api.ubicacion({ lat, lng });
        ultimaEnviada.current = { lat, lon: lng, ts };
        setUltimoEnvio({ lat, lng, ts });
        setDetalle(`Último envío: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setEstado("activo");
      } catch (err) {
        const mensaje =
          err instanceof ApiError ? err.message : "Error de red";
        setDetalle(`Fallo al enviar ubicación: ${mensaje}`);
        setEstado("error");
      }
    },
    []
  );

  React.useEffect(() => {
    if (!repartidor || !habilitado) {
      setEstado("pendiente");
      return;
    }

    if (!("geolocation" in navigator)) {
      setEstado("error");
      setDetalle("Tu navegador no soporta geolocalización");
      return;
    }

    setEstado("pendiente");
    setDetalle("Solicitando permiso de ubicación…");

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setEstado("activo");
        const { latitude, longitude } = pos.coords;
        setUltimaUbicacion({ latitude, longitude });
        setDetalle(
          `GPS activo: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(
            pos.coords.accuracy ?? 0
          )}m)`
        );

        const anterior = ultimaEnviada.current;
        const ahora = Date.now();

        const distancia =
          anterior &&
          haversine(anterior.lat, anterior.lon, latitude, longitude);

        if (
          !anterior ||
          distancia === null ||
          distancia >= MIN_DISTANCIA_METROS ||
          ahora - anterior.ts >= INTERVALO_MIN_MS
        ) {
          void enviarUbicacion(latitude, longitude);
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setEstado("sin_permiso");
          setDetalle("Permiso de ubicación denegado por el navegador");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setEstado("error");
          setDetalle("No se pudo determinar la ubicación (POSITION_UNAVAILABLE)");
        } else if (err.code === err.TIMEOUT) {
          setEstado("error");
          setDetalle("Tiempo agotado al obtener la ubicación");
        } else {
          setEstado("error");
          setDetalle(`Error de geolocalización: ${err.message}`);
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [repartidor, habilitado, enviarUbicacion]);

  const enviarUbicacionPrueba = React.useCallback(
    async (lat: number, lng: number) => {
      await enviarUbicacion(lat, lng);
    },
    [enviarUbicacion]
  );

  return (
    <GeoContext.Provider
      value={{
        estado,
        detalle,
        ultimaUbicacion,
        ultimoEnvio,
        habilitado,
        setHabilitado,
        enviarUbicacionPrueba,
      }}
    >
      {children}
    </GeoContext.Provider>
  );
}

export function useGeo(): GeoContextValue {
  return React.useContext(GeoContext);
}

function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}