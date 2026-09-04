import type { EstadoPedido, Pedido, RepartidorPublico } from "@/lib/types";

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  const body = (await res.json().catch(() => ({}))) as ApiResponse<T>;

  if (!res.ok || body.ok === false) {
    throw new ApiError(body.error ?? "Error de red", res.status);
  }

  return body.data as T;
}

export const api = {
  login: (usuario: string, password: string) =>
    request<RepartidorPublico & { token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ usuario, password }),
    }),

  pedidos: () => request<Pedido[]>("/api/pedidos"),

  pedido: (id: number) => request<Pedido>(`/api/pedidos/${id}`),

  aceptar: (id: number) =>
    request<Pedido>(`/api/pedidos/${id}/aceptar`, { method: "POST" }),

  rechazar: (id: number) =>
    request<Pedido>(`/api/pedidos/${id}/rechazar`, { method: "POST" }),

  estado: (id: number, estado: EstadoPedido) =>
    request<Pedido>(`/api/pedidos/${id}/estado`, {
      method: "POST",
      body: JSON.stringify({ estado }),
    }),

  ubicacion: (payload: {
    repartidor_id: number;
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: string;
  }) =>
    request<{ recibido: boolean }>("/api/ubicaciones", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
