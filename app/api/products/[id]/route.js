import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "../../../../lib/auth";
import { getProductWithCtab, updateProduct, deleteProduct } from "../../../../lib/db/products";

export async function GET(request, { params }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const product = await getProductWithCtab(id);
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(request, { params }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id }  = await params;
  const body    = await request.json();

  try {
    const product = await updateProduct(id, body);
    return NextResponse.json(product);
  } catch (err) {
    if (err.code === "23505") return NextResponse.json({ error: "SKU já existe" }, { status: 409 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  await deleteProduct(id);
  return NextResponse.json({ ok: true });
}
