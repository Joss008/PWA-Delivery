import { getRepartidorByToken } from "@/lib/auth";
import { aceptarPedido } from "@/lib/repositorio";
import { getDb } from "@/lib/db";
import { enviarAlertaTelegram } from "@/lib/telegram";
import { fail, ok } from "@/lib/api";

export async function POST(
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

  const pedido = aceptarPedido(id, repartidor);
  if (!pedido) {
    return fail("No se pudo aceptar el pedido", 409);
  }

  getDb()
    .prepare("UPDATE repartidores SET estado = 'OCUPADO' WHERE id = ?")
    .run(repartidor.id);

  await enviarAlertaTelegram(
    `🚚 Pedido <b>${pedido.codigo}</b> asignado a ${repartidor.nombre}.`
  );

  return ok(pedido);
}
