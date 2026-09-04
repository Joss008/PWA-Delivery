import { getRepartidorByToken } from "@/lib/auth";
import { rechazarPedido } from "@/lib/repositorio";
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

  const pedido = rechazarPedido(id, repartidor);
  if (!pedido) {
    return fail("No se pudo rechazar el pedido", 409);
  }

  await enviarAlertaTelegram(
    `⚠️ Pedido <b>${pedido.codigo}</b> rechazado por ${repartidor.nombre}.`
  );

  return ok(pedido);
}
