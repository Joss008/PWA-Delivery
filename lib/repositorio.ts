import { getDb } from "@/lib/db";
import type { EstadoPedido, Pedido, Repartidor } from "@/lib/types";

export function listarPedidos(repartidorId: number | null): Pedido[] {
  const db = getDb();

  const filas = db
    .prepare(
      `SELECT * FROM pedidos
       WHERE estado != 'PENDIENTE' OR repartidorId IS NULL OR repartidorId = ?
       ORDER BY
         CASE estado
           WHEN 'PENDIENTE' THEN 1
           WHEN 'ASIGNADO' THEN 2
           WHEN 'EN_CAMINO' THEN 3
           WHEN 'ENTREGADO' THEN 4
         END,
         updatedAt DESC`
    )
    .all(repartidorId ?? 0) as unknown as Pedido[];

  return filas;
}

export function obtenerPedido(id: number): Pedido | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM pedidos WHERE id = ?").get(id) as
    | Pedido
    | undefined
    | null;
  return row ?? null;
}

export function existeRepartidor(id: number): boolean {
  const db = getDb();
  return !!db.prepare("SELECT id FROM repartidores WHERE id = ?").get(id);
}

export function aceptarPedido(id: number, repartidor: Repartidor): Pedido | null {
  const db = getDb();
  const pedido = obtenerPedido(id);
  if (!pedido || pedido.estado !== "PENDIENTE") return null;

  const ahora = new Date().toISOString();
  db.prepare(
    `UPDATE pedidos
     SET estado = 'ASIGNADO', repartidorId = ?, updatedAt = ?
     WHERE id = ? AND estado = 'PENDIENTE'`
  ).run(repartidor.id, ahora, id);

  return obtenerPedido(id);
}

export function rechazarPedido(id: number, repartidor: Repartidor): Pedido | null {
  const db = getDb();
  const pedido = obtenerPedido(id);
  if (!pedido || pedido.estado !== "PENDIENTE") return null;

  const ahora = new Date().toISOString();
  db.prepare(
    `UPDATE pedidos
     SET repartidorId = NULL, updatedAt = ?
     WHERE id = ? AND estado = 'PENDIENTE'`
  ).run(ahora, id);

  return obtenerPedido(id);
}

export function actualizarEstado(
  id: number,
  repartidor: Repartidor,
  nuevoEstado: EstadoPedido
): Pedido | null {
  const db = getDb();
  const pedido = obtenerPedido(id);
  if (!pedido) return null;

  const transiciones: Record<EstadoPedido, EstadoPedido[]> = {
    PENDIENTE: [],
    ASIGNADO: ["EN_CAMINO"],
    EN_CAMINO: ["ENTREGADO"],
    ENTREGADO: [],
  };

  if (pedido.repartidorId !== repartidor.id) return null;
  if (!transiciones[pedido.estado].includes(nuevoEstado)) return null;

  const ahora = new Date().toISOString();
  db.prepare(
    "UPDATE pedidos SET estado = ?, updatedAt = ? WHERE id = ?"
  ).run(nuevoEstado, ahora, id);

  if (nuevoEstado === "ENTREGADO") {
    db.prepare("UPDATE repartidores SET estado = 'DISPONIBLE' WHERE id = ?").run(
      repartidor.id
    );
  }

  return obtenerPedido(id);
}

export function guardarUbicacion(
  repartidorId: number,
  latitude: number,
  longitude: number,
  accuracy: number,
  timestamp: string
): void {
  const db = getDb();
  db.prepare(
    `UPDATE repartidores
     SET latitude = ?, longitude = ?, ultimaUbicacion = ?
     WHERE id = ?`
  ).run(latitude, longitude, timestamp, repartidorId);

  db.prepare(
    `INSERT INTO ubicaciones (repartidorId, latitude, longitude, accuracy, timestamp)
     VALUES (?, ?, ?, ?, ?)`
  ).run(repartidorId, latitude, longitude, accuracy, timestamp);
}
