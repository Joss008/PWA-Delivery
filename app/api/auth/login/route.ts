import { login } from "@/lib/auth";
import { seed } from "@/lib/db";
import { fail, ok, readJson } from "@/lib/api";

export async function POST(req: Request) {
  seed();

  const body = await readJson<{ usuario?: string; password?: string }>(req);
  const usuario = body.usuario?.trim();
  const password = body.password ?? "";

  if (!usuario || !password) {
    return fail("Usuario y contraseña son obligatorios", 400);
  }

  const repartidor = login(usuario, password);
  if (!repartidor) {
    return fail("Credenciales inválidas", 401);
  }

  return ok(repartidor);
}
