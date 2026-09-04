"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Home, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/inicio", label: "Inicio", icon: Home },
  { href: "/solicitudes", label: "Solicitudes", icon: ClipboardList },
  { href: "/perfil", label: "Perfil", icon: User },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { repartidor, listo } = useAuth();

  React.useEffect(() => {
    if (listo && !repartidor) router.replace("/");
  }, [listo, repartidor, router]);

  if (!listo || !repartidor) return null;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <main className="flex-1 px-4 pb-24 pt-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t bg-card/95 backdrop-blur">
        <div className="grid grid-cols-3">
          {nav.map((item) => {
            const activo = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                  activo
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
