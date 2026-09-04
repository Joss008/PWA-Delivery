import { randomBytes } from "node:crypto";
import { getDb } from "@/lib/db";
import type { Repartidor, RepartidorPublico } from "@/lib/types";
import { toRepartidorPublico } from "@/lib/types";

export function login(usuario: string, password: string): RepartidorPublico | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM repartidores WHERE usuario = ? AND password = ?")
    .get(usuario, password) as unknown as Repartidor | undefined;

  if (!row) return null;

  const token = randomBytes(32).toString("hex");
  db.prepare("DELETE FROM sesiones WHERE repartidorId = ?").run(row.id);
  db.prepare(
    "INSERT INTO sesiones (token, repartidorId, createdAt) VALUES (?, ?, ?)"
  ).run(token, row.id, new Date().toISOString());

  const publico = toRepartidorPublico(row);
  return { ...publico, token: token } as RepartidorPublico & { token: string };
}

export function getRepartidorByToken(token: string | null): Repartidor | null {
  if (!token) return null;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT r.* FROM repartidores r
       INNER JOIN sesiones s ON s.repartidorId = r.id
       WHERE s.token = ?`
    )
    .get(token) as unknown as Repartidor | undefined;
  return row ?? null;
}

export function logout(token: string | null): void {
  if (!token) return;
  getDb().prepare("DELETE FROM sesiones WHERE token = ?").run(token);
}
