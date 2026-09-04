import { existeRepartidor, guardarUbicacion } from "@/lib/repositorio";
import { fail, ok, readJson } from "@/lib/api";

export async function POST(req: Request) {
  const body = await readJson<{
    repartidor_id?: number;
    lat?: number;
    lng?: number;
    accuracy?: number;
    timestamp?: string;
  }>(req);

  const { repartidor_id, lat, lng } = body;
  if (
    typeof repartidor_id !== "number" ||
    typeof lat !== "number" ||
    typeof lng !== "number"
  ) {
    return fail("repartidor_id, lat y lng son obligatorios", 400);
  }

  if (!existeRepartidor(repartidor_id)) {
    return fail("Repartidor no encontrado", 404);
  }

  guardarUbicacion(
    repartidor_id,
    lat,
    lng,
    typeof body.accuracy === "number" ? body.accuracy : 0,
    body.timestamp ?? new Date().toISOString()
  );

  return ok({ recibido: true });
}
