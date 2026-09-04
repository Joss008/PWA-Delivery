import { getRepartidorByToken } from "@/lib/auth";
import { actualizarEstado } from "@/lib/repositorio";
import { enviarAlertaTelegram } from "@/lib/telegram";
import { fail, ok, readJson } from "@/lib/api";
import type { EstadoPedido } from "@/lib/types";

const ESTADOS_VALIDOS: EstadoPedido[] = [
  "PENDIENTE",
  "ASIGNADO",
  "EN_CAMINO",
  "ENTREGADO",
];

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

  const body = await readJson<{ estado?: string }>(req);
  const estado = body.estado as EstadoPedido;
  if (!ESTADOS_VALIDOS.includes(estado)) {
    return fail("Estado inválido", 400);
  }

  const pedido = actualizarEstado(id, repartidor, estado);
  if (!pedido) {
    return fail("No se pudo actualizar el estado", 409);
  }

  await enviarAlertaTelegram(
    `📦 Pedido <b>${pedido.codigo}</b> actualizado a <b>${pedido.estado}</b>.`
  );

  return ok(pedido);
}
