"use client";

import * as React from "react";
import type { RepartidorPublico } from "@/lib/types";

interface AuthContextValue {
  repartidor: RepartidorPublico | null;
  token: string | null;
  iniciarSesion: (r: RepartidorPublico, token: string) => void;
  cerrarSesion: () => void;
  listo: boolean;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [repartidor, setRepartidor] = React.useState<RepartidorPublico | null>(
    null
  );
  const [token, setToken] = React.useState<string | null>(null);
  const [listo, setListo] = React.useState(false);

  React.useEffect(() => {
    const t = localStorage.getItem("token");
    const r = localStorage.getItem("repartidor");
    if (t && r) {
      try {
        setToken(t);
        setRepartidor(JSON.parse(r) as RepartidorPublico);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("repartidor");
      }
    }
    setListo(true);
  }, []);

  const iniciarSesion = React.useCallback(
    (r: RepartidorPublico, t: string) => {
      localStorage.setItem("token", t);
      localStorage.setItem("repartidor", JSON.stringify(r));
      setToken(t);
      setRepartidor(r);
    },
    []
  );

  const cerrarSesion = React.useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("repartidor");
    setToken(null);
    setRepartidor(null);
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
