"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { useGeo } from "@/components/geo-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, MapPin, LogOut } from "lucide-react";

export default function PerfilPage() {
  const router = useRouter();
  const { repartidor, cerrarSesion } = useAuth();
  const { estado } = useGeo();

  function salir() {
    cerrarSesion();
    router.replace("/");
  }

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
            <div>
              <CardTitle>{repartidor?.nombre}</CardTitle>
              <p className="text-sm text-muted-foreground">
                @{repartidor?.usuario}
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
            <span className="font-medium">{repartidor?.estado}</span>
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

      <Button variant="outline" size="lg" onClick={salir}>
        <LogOut className="h-5 w-5" />
        Cerrar sesión
      </Button>
    </div>
  );
}
