export type EstadoPedido = "PENDIENTE" | "ASIGNADO" | "EN_CAMINO" | "ENTREGADO";

export type EstadoRepartidor = "DISPONIBLE" | "OCUPADO" | "INACTIVO";

export interface Repartidor {
  id: number;
  nombre: string;
  telefono: string;
  usuario: string;
  password: string;
  estado: EstadoRepartidor;
  latitude: number | null;
  longitude: number | null;
  ultimaUbicacion: string | null;
}

export interface RepartidorPublico {
  id: number;
  nombre: string;
  telefono: string;
  usuario: string;
  estado: EstadoRepartidor;
  latitude: number | null;
  longitude: number | null;
  ultimaUbicacion: string | null;
}

export interface Pedido {
  id: number;
  codigo: string;
  empresa: string;
  direccionRecojo: string;
  direccionEntrega: string;
  observaciones: string | null;
  estado: EstadoPedido;
  repartidorId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UbicacionInput {
  repartidorId: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

export function toRepartidorPublico(r: Repartidor): RepartidorPublico {
  const { password: _password, ...resto } = r;
  return resto;
}
