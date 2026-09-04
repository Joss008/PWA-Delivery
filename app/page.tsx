"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { api, ApiError } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { repartidor, iniciarSesion, listo } = useAuth();
  const [usuario, setUsuario] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [cargando, setCargando] = React.useState(false);

  React.useEffect(() => {
    if (listo && repartidor) router.replace("/inicio");
  }, [listo, repartidor, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const res = await api.login(usuario, password);
      const { token, ...repartidorPublico } = res;
      iniciarSesion(repartidorPublico, token);
      router.replace("/inicio");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error inesperado");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-blue-600 to-blue-800 px-6">
      <div className="mb-8 flex flex-col items-center text-white">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
          <Truck className="h-9 w-9" />
        </div>
        <h1 className="text-2xl font-bold">Delivery Repartidor</h1>
        <p className="text-sm text-blue-100">Inicia sesión para comenzar</p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Usuario
              </label>
              <input
                className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                Contraseña
              </label>
              <input
                type="password"
                className="h-10 rounded-md border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" disabled={cargando}>
              {cargando ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Demo: usuario <span className="font-medium">carlos</span> · clave{" "}
            <span className="font-medium">123456</span>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
