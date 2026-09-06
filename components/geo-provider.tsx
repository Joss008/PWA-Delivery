"use client";

import * as React from "react";
import { useAuth } from "@/components/auth-provider";
import { api, ApiError } from "@/lib/client";

interface GeoContextValue {
  estado: "sin_permiso" | "pendiente" | "activo" | "error";
  detalle: string | null;
  ultimaUbicacion: { latitude: number; longitude: number } | null;
  ultimoEnvio: { lat: number; lng: number; ts: number } | null;
  /**
   * Última ubicación que el backend tiene registrada para el repartidor.
   * Se hidrata desde /api/auth/me al abrir la PWA, y se actualiza con cada
   * envío. Se muestra en la UI como punto de partida mientras se captura
   * la nueva coordenada.
   */
  ultimaConocida: {
    lat: number;
    lng: number;
    ts: number;
  } | null;
  habilitado: boolean;
  setHabilitado: (habilitado: boolean) => void;
  enviarUbicacionPrueba: (lat: number, lng: number) => Promise<void>;
  /** Captura la posición actual del navegador y la envía al backend ya mismo. */
  enviarUbicacionAhora: () => Promise<void>;
}

const GeoContext = React.createContext<GeoContextValue>({
  estado: "pendiente",
  detalle: null,
  ultimaUbicacion: null,
  ultimoEnvio: null,
  ultimaConocida: null,
  habilitado: true,
  setHabilitado: () => {},
  enviarUbicacionPrueba: async () => {},
  enviarUbicacionAhora: async () => {},
});

const MIN_DISTANCIA_METROS = 30;
const STORAGE_KEY = "gps_habilitado";

// Modo híbrido: una captura real al abrir/cuando se reactiva el GPS y luego
// una captura cada 2 minutos mientras la app siga abierta. Si la app se cierra
// o queda en segundo plano, dejamos de enviar: el panel mostrará la última
// ubicación conocida que ya quedó guardada en el backend.
const INTERVALO_ENVIO_MS = 2 * 60 * 1000;

export function GeoProvider({ children }: { children: React.ReactNode }) {
  const { repartidor } = useAuth();
  const [estado, setEstado] =
    React.useState<GeoContextValue["estado"]>("pendiente");
  const [detalle, setDetalle] = React.useState<string | null>(null);
  const [ultimaUbicacion, setUltimaUbicacion] =
    React.useState<GeoContextValue["ultimaUbicacion"]>(null);
  const [ultimoEnvio, setUltimoEnvio] =
    React.useState<GeoContextValue["ultimoEnvio"]>(null);
  const [ultimaConocida, setUltimaConocida] =
    React.useState<GeoContextValue["ultimaConocida"]>(null);
  const [habilitado, setHabilitadoState] = React.useState(true);

  // Hidratamos la "última ubicación conocida" desde el repartidor que nos
  // devuelve /api/auth/me al iniciar sesión. Así la PWA muestra la última
  // coordenada que el backend tiene registrada antes de capturar una nueva.
  React.useEffect(() => {
    if (
      repartidor &&
      typeof repartidor.lat === "number" &&
      typeof repartidor.lng === "number" &&
      repartidor.ubicacion_recibida_en
    ) {
      const ts = new Date(repartidor.ubicacion_recibida_en).getTime();
      if (Number.isFinite(ts)) {
        setUltimaConocida({ lat: repartidor.lat, lng: repartidor.lng, ts });
      }
    }
  }, [repartidor]);

  React.useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado !== null) setHabilitadoState(guardado === "1");
  }, []);

  const setHabilitado = React.useCallback((valor: boolean) => {
    localStorage.setItem(STORAGE_KEY, valor ? "1" : "0");
    setHabilitadoState(valor);

    // NO borramos la última ubicación en el backend al apagar el GPS.
    // El panel web debe seguir mostrando al repartidor en su última
    // coordenada conocida (con un marcador atenuado) para que la empresa
    // tenga continuidad visual aunque la PWA esté en pausa. Marcamos el
    // estado de "GPS en pausa" en el backend solo si hay sesión activa.
    if (!valor && repartidor) {
      api.clearLocation().catch(() => {
        // Si falla (sin red, etc.) no bloqueamos el toggle: la próxima
        // conexión actualizará el estado.
      });
    }
  }, [repartidor]);

  const ultimaEnviada = React.useRef<{
    lat: number;
    lon: number;
    ts: number;
  } | null>(null);

  const enviarUbicacion = React.useCallback(
    async (lat: number, lng: number) => {
      const ts = Date.now();
      console.log(`[geo] Enviando ubicación ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      try {
        await api.ubicacion({ lat, lng });
        ultimaEnviada.current = { lat, lon: lng, ts };
        setUltimoEnvio({ lat, lng, ts });
        setUltimaConocida({ lat, lng, ts });
        setDetalle(`Último envío: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setEstado("activo");
        console.log(`[geo] Ubicación enviada OK`);
      } catch (err) {
        const mensaje =
          err instanceof ApiError ? err.message : "Error de red";
        setDetalle(`Fallo al enviar ubicación: ${mensaje}`);
        setEstado("error");
        console.warn(`[geo] Error enviando ubicación:`, err);
      }
    },
    []
  );

  const obtenerYEnviar = React.useCallback(() => {
    return new Promise<{ lat: number; lng: number } | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUltimaUbicacion({ latitude, longitude });
          setEstado("activo");
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
          const cambiaSuficiente =
            !anterior ||
            distancia === null ||
            distancia >= MIN_DISTANCIA_METROS ||
            ahora - anterior.ts >= INTERVALO_ENVIO_MS;

          if (cambiaSuficiente) {
            void enviarUbicacion(latitude, longitude);
          }
          resolve({ lat: latitude, lng: longitude });
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
          resolve(null);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 }
      );
    });
  }, [enviarUbicacion]);

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

    let cancelado = false;
    let temporizador: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelado) return;
      try {
        await obtenerYEnviar();
      } catch (err) {
        console.warn("[geo] tick falló:", err);
      }
      if (cancelado) return;
      temporizador = setTimeout(tick, INTERVALO_ENVIO_MS);
    };

    void tick();
    console.log("[geo] Polling iniciado (cada 2 min mientras la PWA esté abierta)");

    return () => {
      cancelado = true;
      if (temporizador) clearTimeout(temporizador);
      console.log("[geo] Polling detenido");
    };
  }, [repartidor, habilitado, obtenerYEnviar]);

  const enviarUbicacionPrueba = React.useCallback(
    async (lat: number, lng: number) => {
      await enviarUbicacion(lat, lng);
    },
    [enviarUbicacion]
  );

  const enviarUbicacionAhora = React.useCallback(async () => {
    if (!("geolocation" in navigator)) {
      setEstado("error");
      setDetalle("Tu navegador no soporta geolocalización");
      return;
    }
    setEstado("pendiente");
    setDetalle("Capturando ubicación actual…");
    await obtenerYEnviar();
  }, [obtenerYEnviar]);

  return (
    <GeoContext.Provider
      value={{
        estado,
        detalle,
        ultimaUbicacion,
        ultimoEnvio,
        ultimaConocida,
        habilitado,
        setHabilitado,
        enviarUbicacionPrueba,
        enviarUbicacionAhora,
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