import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "../../../lib/auth";
import { getAllProductsWithCtab, createProduct } from "../../../lib/db/products";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const products = await getAllProductsWithCtab();
  return NextResponse.json(products);
}

export async function POST(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = await request.json();
  if (!body.sku || !body.nome) {
    return NextResponse.json({ error: "SKU e nome obrigatórios" }, { status: 400 });
  }

  try {
    const product = await createProduct(body);
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    if (err.code === "23505") return NextResponse.json({ error: "SKU já existe" }, { status: 409 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
