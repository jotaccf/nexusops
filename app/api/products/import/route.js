import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "../../../../lib/auth";
import { parseWorkbook } from "../../../../lib/xlsxProducts";
import getDb from "../../../../lib/db";

export const dynamic = "force-dynamic";

// POST /api/products/import
// FormData: file (XLSX) + dryRun (true/false)
// dryRun=true → apenas valida e devolve preview
// dryRun=false → executa import (upsert)
export async function POST(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  let formData;
  try { formData = await request.formData(); }
  catch { return NextResponse.json({ error: "FormData inválido" }, { status: 400 }); }

  const file = formData.get("file");
  const dryRun = formData.get("dryRun") === "true";

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Ficheiro em falta" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let parsed;
  try {
    parsed = await parseWorkbook(buffer);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { rows, errors } = parsed;

  if (rows.length === 0) {
    return NextResponse.json({
      summary: { total: 0, criados: 0, actualizados: 0, ctabs: 0, errors: errors.length },
      errors,
      preview: [],
    });
  }

  const sql = getDb();

  // Pré-fetch SKUs existentes para distinguir criar vs actualizar
  const skus = rows.map(r => r.sku);
  const existing = await sql`SELECT id, sku FROM products WHERE sku = ANY(${skus})`;
  const existingMap = new Map(existing.map(p => [p.sku, p.id]));

  const preview = rows.map(r => ({
    row: r.row,
    sku: r.sku,
    nome: r.nome,
    action: existingMap.has(r.sku) ? "update" : "create",
    ctabs: ["CON", "RAM", "RAA"].filter(reg => r[`ctab_${reg.toLowerCase()}`]).length,
  }));

  if (dryRun) {
    return NextResponse.json({
      summary: {
        total: rows.length,
        criados: preview.filter(p => p.action === "create").length,
        actualizados: preview.filter(p => p.action === "update").length,
        ctabs: preview.reduce((s, p) => s + p.ctabs, 0),
        errors: errors.length,
      },
      errors,
      preview,
    });
  }

  // ── EXECUÇÃO REAL (upsert) ──
  let criados = 0, actualizados = 0, ctabs = 0;

  for (const r of rows) {
    const [prod] = await sql`
      INSERT INTO products (sku, nome, descricao, unidade, massa_bruta, massa_liquida, massa_tributavel, active)
      VALUES (${r.sku}, ${r.nome}, ${r.descricao}, ${r.unidade || "un"},
              ${r.massa_bruta}, ${r.massa_liquida}, ${r.massa_tributavel}, ${r.active})
      ON CONFLICT (sku) DO UPDATE SET
        nome = EXCLUDED.nome,
        descricao = EXCLUDED.descricao,
        unidade = EXCLUDED.unidade,
        massa_bruta = EXCLUDED.massa_bruta,
        massa_liquida = EXCLUDED.massa_liquida,
        massa_tributavel = EXCLUDED.massa_tributavel,
        active = EXCLUDED.active,
        updated_at = NOW()
      RETURNING id, (xmax = 0) AS inserted
    `;

    if (prod.inserted) criados++; else actualizados++;

    // CTABs
    for (const reg of ["CON", "RAM", "RAA"]) {
      const code = r[`ctab_${reg.toLowerCase()}`];
      if (code) {
        await sql`
          INSERT INTO product_ctab (product_id, regiao, ctab_code)
          VALUES (${prod.id}, ${reg}, ${code})
          ON CONFLICT (product_id, regiao) DO UPDATE SET
            ctab_code = EXCLUDED.ctab_code,
            updated_at = NOW()
        `;
        ctabs++;
      }
    }
  }

  return NextResponse.json({
    summary: { total: rows.length, criados, actualizados, ctabs, errors: errors.length },
    errors,
    preview,
  });
}
