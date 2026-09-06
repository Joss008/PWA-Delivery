export type EstadoPedido = "pendiente" | "asignado" | "en_camino" | "entregado";
export type EstadoRepartidor = "disponible" | "ocupado" | "inactivo";

export interface RepartidorPublico {
  id: number;
  nombre: string;
  telefono: string;
  estado: EstadoRepartidor;
  /**
   * Última coordenada conocida del backend (lat/lng) y timestamp de cuándo
   * se recibió. Puede ser null si el repartidor nunca ha enviado su GPS.
   */
  lat?: number;
  lng?: number;
  ubicacion_recibida_en?: string | null;
}

export interface Pedido {
  id: number;
  codigo: string;
  empresa: string;
  empresa_id: number | null;
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