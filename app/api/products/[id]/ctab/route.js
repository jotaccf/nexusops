import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "../../../../../lib/auth";
import { upsertCtab, deleteCtab, getCtabByProduct } from "../../../../../lib/db/products";

// GET /api/products/[id]/ctab — lista CTAB do produto
export async function GET(request, { params }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const ctab = await getCtabByProduct(id);
  return NextResponse.json(ctab);
}

// POST /api/products/[id]/ctab — upsert CTAB por região
// body: { regiao: "CON"|"RAM"|"RAA", ctab_code, descricao?, taxa?, unidade_iec? }
export async function POST(request, { params }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  const body   = await request.json();

  if (!body.regiao || !body.ctab_code) {
    return NextResponse.json({ error: "Região e código CTAB obrigatórios" }, { status: 400 });
  }

  if (!["CON", "RAM", "RAA"].includes(body.regiao)) {
    return NextResponse.json({ error: "Região inválida (CON, RAM ou RAA)" }, { status: 400 });
  }

  const row = await upsertCtab(id, body.regiao, body);
  return NextResponse.json(row, { status: 201 });
}

// DELETE /api/products/[id]/ctab?regiao=CON
export async function DELETE(request, { params }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const regiao = searchParams.get("regiao");

  if (!regiao || !["CON", "RAM", "RAA"].includes(regiao)) {
    return NextResponse.json({ error: "Região inválida" }, { status: 400 });
  }

  await deleteCtab(id, regiao);
  return NextResponse.json({ ok: true });
}
