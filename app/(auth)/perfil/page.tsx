"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useGeo } from "@/components/geo-provider";
import { api } from "@/lib/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  MapPin,
  LogOut,
  PackageCheck,
  Truck,
  Clock,
  CheckCircle2,
  Inbox,
  TrendingUp,
} from "lucide-react";
import type { Pedido } from "@/lib/types";

export default function PerfilPage() {
  const router = useRouter();
  const { repartidor, cerrarSesion } = useAuth();
  const { estado } = useGeo();
  const [stats, setStats] = React.useState({
    entregados: 0,
    enCurso: 0,
    pendientes: 0,
    aceptados: 0,
    total: 0,
  });
  const [cargandoStats, setCargandoStats] = React.useState(true);

  React.useEffect(() => {
    if (!repartidor) return;
    let cancelado = false;
    api.pedidos()
      .then((lista) => {
        if (cancelado) return;
        const mios = lista.filter(
          (p) =>
            p.estado === "pendiente" || p.repartidor_id === repartidor.id,
        );
        const entregados = mios.filter((p) => p.estado === "entregado").length;
        const enCurso = mios.filter(
          (p) => p.estado === "asignado" || p.estado === "en_camino",
        ).length;
        const pendientes = mios.filter((p) => p.estado === "pendiente").length;
        const aceptados = mios.filter(
          (p) =>
            p.estado === "asignado" ||
            p.estado === "en_camino" ||
            p.estado === "entregado",
        ).length;
        setStats({
          entregados,
          enCurso,
          pendientes,
          aceptados,
          total: mios.length,
        });
      })
      .catch(() => {
        if (!cancelado) setStats({ entregados: 0, enCurso: 0, pendientes: 0, aceptados: 0, total: 0 });
      })
      .finally(() => {
        if (!cancelado) setCargandoStats(false);
      });
    return () => {
      cancelado = true;
    };
  }, [repartidor]);

  async function salir() {
    await api.logout().catch(() => {});
    cerrarSesion();
    router.replace("/");
  }

  const estadoCapitalizado = repartidor?.estado
    ? repartidor.estado.charAt(0).toUpperCase() + repartidor.estado.slice(1)
    : "";

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold">Perfil</h1>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <CardTitle>{repartidor?.nombre}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {repartidor?.telefono}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between border-t pt-3">
            <span className="text-muted-foreground">Teléfono</span>
            <span className="font-medium">{repartidor?.telefono}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estado</span>
            <span className="font-medium">{estadoCapitalizado}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">GPS</span>
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="h-4 w-4 text-primary" />
              {estado === "activo" ? "Activo" : "Inactivo"}
            </span>
          </div>
        </CardContent>
      </Card>

      <section>
        <div className="mb-3 flex items-center gap-2 px-1">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Estadísticas</h2>
        </div>

        {cargandoStats ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Cargando estadísticas…
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={PackageCheck}
              label="Entregados"
              value={stats.entregados}
              tone="bg-emerald-100 text-emerald-700"
            />
            <StatCard
              icon={Truck}
              label="En curso"
              value={stats.enCurso}
              tone="bg-blue-100 text-blue-700"
            />
            <StatCard
              icon={Inbox}
              label="Pendientes"
              value={stats.pendientes}
              tone="bg-amber-100 text-amber-700"
            />
            <StatCard
              icon={CheckCircle2}
              label="Aceptados"
              value={stats.aceptados}
              tone="bg-primary/10 text-primary"
            />
          </div>
        )}
      </section>

      <Button variant="outline" size="lg" onClick={salir}>
        <LogOut className="h-5 w-5" />
        Cerrar sesión
      </Button>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Clock;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
