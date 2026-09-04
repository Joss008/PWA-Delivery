import type { EstadoPedido, Pedido, RepartidorPublico } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
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

  pedidos: () => request<Pedido[]>("/api/pedidos"),

  pedido: (id: number) => request<Pedido>(`/api/pedidos/${id}`),

  aceptar: (id: number) => request<Pedido>(`/api/pedidos/${id}/aceptar`, { method: "POST" }),

  rechazar: (id: number) => request<Pedido>(`/api/pedidos/${id}/rechazar`, { method: "POST" }),

  estado: (id: number, estado: EstadoPedido) =>
    request<Pedido>(`/api/pedidos/${id}/estado`, {
      method: "POST",
      body: JSON.stringify({ estado }),
    }),

  ubicacion: (payload: { lat: number; lng: number }) =>
    request<RepartidorPublico & { lat: number; lng: number }>("/api/ubicaciones", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
