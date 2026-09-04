"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/client";

interface GeoContextValue {
  estado: "sin_permiso" | "pendiente" | "activo" | "error";
  ultimaUbicacion: { latitude: number; longitude: number } | null;
}

const GeoContext = React.createContext<GeoContextValue>({
  estado: "pendiente",
  ultimaUbicacion: null,
});

const MIN_DISTANCIA_METROS = 30;
const INTERVALO_MIN_MS = 15_000;

export function GeoProvider({ children }: { children: React.ReactNode }) {
  const { repartidor } = useAuth();
  const [estado, setEstado] =
    React.useState<GeoContextValue["estado"]>("pendiente");
  const [ultimaUbicacion, setUltimaUbicacion] =
    React.useState<GeoContextValue["ultimaUbicacion"]>(null);

  const ultimaEnviada = React.useRef<{
    lat: number;
    lon: number;
    ts: number;
  } | null>(null);

  React.useEffect(() => {
    if (!repartidor) {
      setEstado("pendiente");
      return;
    }

    if (!("geolocation" in navigator)) {
      setEstado("error");
      return;
    }

    setEstado("pendiente");

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setEstado("activo");
        const { latitude, longitude, accuracy } = pos.coords;
        setUltimaUbicacion({ latitude, longitude });

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
          ultimaEnviada.current = { lat: latitude, lon: longitude, ts: ahora };
          api
            .ubicacion({
              repartidor_id: repartidor.id,
              lat: latitude,
              lng: longitude,
              accuracy,
              timestamp: new Date().toISOString(),
            })
            .catch(() => setEstado("error"));
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setEstado("sin_permiso");
        } else {
          setEstado("error");
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10_000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [repartidor]);

  return (
    <GeoContext.Provider value={{ estado, ultimaUbicacion }}>
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
