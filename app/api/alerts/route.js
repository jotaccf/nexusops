import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "../../../lib/auth";
import { getAlerts, getPartners, getStockCritico } from "../../../lib/db/alerts";

export async function GET(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "partners")     return NextResponse.json(await getPartners());
  if (type === "stock")        return NextResponse.json(await getStockCritico());
  return NextResponse.json(await getAlerts());
}
