import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "../../../lib/auth";
import { getOrders, getOrderCountByEstado } from "../../../lib/db/orders";

export async function GET(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  if (searchParams.get("groupBy") === "estado") {
    const counts = await getOrderCountByEstado();
    return NextResponse.json(counts);
  }

  const orders = await getOrders();
  return NextResponse.json(orders);
}
