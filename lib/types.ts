export type EstadoPedido = "pendiente" | "asignado" | "en_camino" | "entregado";

export type EstadoRepartidor = "disponible" | "ocupado" | "inactivo";

export interface RepartidorPublico {
  id: number;
  nombre: string;
  telefono: string;
  estado: EstadoRepartidor;
}

export interface Pedido {
  id: number;
  codigo: string;
  empresa: string;
  direccion_recojo: string;
  direccion_entrega: string;
  observaciones: string | null;
  estado: EstadoPedido;
  repartidor_id: number | null;
  repartidor_nombre: string | null;
  lat: number;
  lng: number;
  creado_en: string;
  actualizado_en: string;
}
