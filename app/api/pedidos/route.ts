import { getRepartidorByToken } from "@/lib/auth";
import { listarPedidos } from "@/lib/repositorio";
import { seed } from "@/lib/db";
import { fail, ok } from "@/lib/api";

export async function GET(req: Request) {
  seed();

  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? null;
  const repartidor = getRepartidorByToken(token);
  if (!repartidor) {
    return fail("No autorizado", 401);
  }

  const pedidos = listarPedidos(repartidor.id);
  return ok(pedidos);
}
