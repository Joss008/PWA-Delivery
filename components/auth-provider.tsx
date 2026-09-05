"use client";

import * as React from "react";
import type { RepartidorPublico } from "@/lib/types";
import { api, EVENTO_SESION_EXPIRADA } from "@/lib/client";

interface AuthContextValue {
  repartidor: RepartidorPublico | null;
  token: string | null;
  iniciarSesion: (r: RepartidorPublico, t: string) => void;
  cerrarSesion: () => void;
  listo: boolean;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [repartidor, setRepartidor] = React.useState<RepartidorPublico | null>(
    null
  );
  const [token, setToken] = React.useState<string | null>(null);
  const [listo, setListo] = React.useState(false);

  React.useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) {
      setListo(true);
      return;
    }
    setToken(t);
    api
      .me()
      .then((res) => setRepartidor(res.repartidor))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("repartidor");
        setToken(null);
      })
      .finally(() => setListo(true));
  }, []);

  const iniciarSesion = React.useCallback(
    (r: RepartidorPublico, t: string) => {
      localStorage.setItem(TOKEN_KEY, t);
      localStorage.setItem("repartidor", JSON.stringify(r));
      setToken(t);
      setRepartidor(r);
    },
    []
  );

  const cerrarSesion = React.useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("repartidor");
    setToken(null);
    setRepartidor(null);
  }, []);

  React.useEffect(() => {
    const onExpirada = () => {
      setToken(null);
      setRepartidor(null);
    };
    window.addEventListener(EVENTO_SESION_EXPIRADA, onExpirada);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, onExpirada);
  }, []);

  return (
    <AuthContext.Provider
      value={{ repartidor, token, iniciarSesion, cerrarSesion, listo }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}