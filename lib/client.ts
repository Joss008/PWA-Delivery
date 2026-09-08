import type { EstadoPedido, Pedido, RepartidorPublico } from "@/lib/types";

const DEFAULT_API_BASE_URL = "http://localhost:3001";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

export const EVENTO_SESION_EXPIRADA = "auth:sesion-expirada";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function limpiarSesion(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("repartidor");
  window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && token) limpiarSesion();
    throw new ApiError(body.error ?? "Error de red", res.status);
  }

  return body as T;
}

export const api = {
  login: (telefono: string, password: string) =>
    request<{ token: string; repartidor: RepartidorPublico }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ telefono, password }),
    }),

  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),

  me: () =>
    request<{ repartidor: RepartidorPublico }>("/api/auth/me", {
      method: "GET",
    }),

  pedidos: () => request<Pedido[]>("/api/pedidos"),

  pedido: async (id: number): Promise<Pedido> => {
    const pedidos = await request<Pedido[]>("/api/pedidos");
    const encontrado = pedidos.find((p) => p.id === id);
    if (!encontrado) throw new ApiError("Pedido no encontrado", 404);
    return encontrado;
  },

  aceptar: (id: number) =>
    request<Pedido>(`/api/pedidos/${id}/aceptar`, { method: "POST" }),

  rechazar: (id: number) =>
    request<Pedido>(`/api/pedidos/${id}/rechazar`, { method: "POST" }),

  estado: (id: number, estado: EstadoPedido) =>
    request<Pedido>(`/api/pedidos/${id}/estado`, {
      method: "POST",
      body: JSON.stringify({ estado }),
    }),

  /**
   * Marca el pedido como entregado validando el OTP que el cliente dictó al
   * repartidor. Envía además la ubicación actual para evidencia antifraude.
   */
  entregarConOTP: (
    id: number,
    args: { otp: string; lat?: number | null; lng?: number | null }
  ) =>
    request<Pedido>(`/api/pedidos/${id}/estado`, {
      method: "POST",
      body: JSON.stringify({
        estado: "entregado",
        otp: args.otp,
        lat: args.lat ?? null,
        lng: args.lng ?? null,
      }),
    }),

  ubicacion: (payload: { lat: number; lng: number }) =>
    request<RepartidorPublico & { lat: number; lng: number }>("/api/ubicaciones", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Se llama cuando el usuario desactiva el GPS desde la PWA. El backend
  // borra la última ubicación recibida para que el panel deje de mostrar al
  // repartidor en el mapa.
  clearLocation: () =>
    request<{ ok: boolean }>("/api/ubicaciones", { method: "DELETE" }),
};