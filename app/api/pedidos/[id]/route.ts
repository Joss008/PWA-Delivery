import { getRepartidorByToken } from "@/lib/auth";
import { obtenerPedido } from "@/lib/repositorio";
import { fail, ok } from "@/lib/api";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? null;
  const repartidor = getRepartidorByToken(token);
  if (!repartidor) {
    return fail("No autorizado", 401);
  }

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return fail("ID inválido", 400);
  }

  const pedido = obtenerPedido(id);
  if (!pedido) {
    return fail("Pedido no encontrado", 404);
  }

  return ok(pedido);
}
