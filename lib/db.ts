import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = process.env.DATABASE_PATH || path.join(DATA_DIR, "delivery.db");

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  migrate(db);
  return db;
}

function migrate(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS repartidores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      telefono TEXT NOT NULL,
      usuario TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'DISPONIBLE',
      latitude REAL,
      longitude REAL,
      ultimaUbicacion TEXT
    );

    CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT NOT NULL UNIQUE,
      empresa TEXT NOT NULL,
      direccionRecojo TEXT NOT NULL,
      direccionEntrega TEXT NOT NULL,
      observaciones TEXT,
      estado TEXT NOT NULL DEFAULT 'PENDIENTE',
      repartidorId INTEGER,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (repartidorId) REFERENCES repartidores(id)
    );

    CREATE TABLE IF NOT EXISTS ubicaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repartidorId INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      accuracy REAL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (repartidorId) REFERENCES repartidores(id)
    );

    CREATE TABLE IF NOT EXISTS sesiones (
      token TEXT PRIMARY KEY,
      repartidorId INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (repartidorId) REFERENCES repartidores(id)
    );

    CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
    CREATE INDEX IF NOT EXISTS idx_pedidos_repartidor ON pedidos(repartidorId);
    CREATE INDEX IF NOT EXISTS idx_ubicaciones_repartidor ON ubicaciones(repartidorId);
  `);
}

export function seed(): void {
  const database = getDb();

  const repartidores = database
    .prepare("SELECT COUNT(*) as total FROM repartidores")
    .get() as unknown as { total: number };

  if (repartidores.total === 0) {
    const ahora = new Date().toISOString();
    const insertRepartidor = database.prepare(
      `INSERT INTO repartidores (nombre, telefono, usuario, password, estado)
       VALUES (?, ?, ?, ?, ?)`
    );
    insertRepartidor.run("Carlos Mendoza", "+51987654321", "carlos", "123456", "DISPONIBLE");
    insertRepartidor.run("Lucía Torres", "+51912345678", "lucia", "123456", "DISPONIBLE");
  }

  const pedidos = database
    .prepare("SELECT COUNT(*) as total FROM pedidos")
    .get() as unknown as { total: number };

  if (pedidos.total === 0) {
    const ahora = new Date().toISOString();
    const insertPedido = database.prepare(
      `INSERT INTO pedidos
        (codigo, empresa, direccionRecojo, direccionEntrega, observaciones, estado, repartidorId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    insertPedido.run(
      "PD-1001",
      "La Casa del Pollo",
      "Av. Arequipa 1234, Miraflores",
      "Jr. Los Pinos 567, San Isidro",
      "Cliente pide llamar al llegar",
      "PENDIENTE",
      null,
      ahora,
      ahora
    );
    insertPedido.run(
      "PD-1002",
      "Farmacia Vida",
      "Av. Brasil 890, Jesús María",
      "Calle Las Flores 234, Lince",
      "Entregar en recepción",
      "PENDIENTE",
      null,
      ahora,
      ahora
    );
    insertPedido.run(
      "PD-1003",
      "Dulces Mariana",
      "Jr. Huancavelica 456, Cercado de Lima",
      "Av. Petit Thouars 1122, Lince",
      null,
      "PENDIENTE",
      null,
      ahora,
      ahora
    );
    insertPedido.run(
      "PD-1004",
      "ElectroMax",
      "Av. La Marina 2345, San Miguel",
      "Calle Los Cedros 89, Magdalena",
      "Frágil, manipular con cuidado",
      "PENDIENTE",
      null,
      ahora,
      ahora
    );
  }
}
