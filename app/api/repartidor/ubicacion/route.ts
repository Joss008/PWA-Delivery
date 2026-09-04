import { getRepartidorByToken } from "@/lib/auth";
import { guardarUbicacion } from "@/lib/repositorio";
import { fail, ok, readJson } from "@/lib/api";

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? null;
  const repartidor = getRepartidorByToken(token);
  if (!repartidor) {
    return fail("No autorizado", 401);
  }

  const body = await readJson<{
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    timestamp?: string;
  }>(req);

  const { latitude, longitude } = body;
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return fail("Latitud y longitud son obligatorias", 400);
  }

  guardarUbicacion(
    repartidor.id,
    latitude,
    longitude,
    typeof body.accuracy === "number" ? body.accuracy : 0,
    body.timestamp ?? new Date().toISOString()
  );

  return ok({ recibido: true });
}
