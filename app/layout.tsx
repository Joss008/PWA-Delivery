import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { GeoProvider } from "@/components/geo-provider";
import { ServiceWorkerRegister } from "@/components/service-worker";

export const metadata: Metadata = {
  title: "Delivery Repartidor",
  description: "PWA para repartidores de delivery",
  applicationName: "Delivery Repartidor",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Delivery Repartidor",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-dvh antialiased">
        <AuthProvider>
          <GeoProvider>{children}</GeoProvider>
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
