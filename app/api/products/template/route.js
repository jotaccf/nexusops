import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "../../../../lib/auth";
import { buildWorkbook } from "../../../../lib/xlsxProducts";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // Template com uma linha de exemplo
  const example = [{
    sku: "EXEMPLO 001",
    nome: "Nome do produto",
    descricao: "Descrição opcional",
    unidade: "un",
    massa_bruta: 0.0375,
    massa_liquida: 0.035,
    massa_tributavel: 0.002,
    ctab: [
      { regiao: "CON", ctab_code: "B00000C0" },
      { regiao: "RAM", ctab_code: "B00000M0" },
      { regiao: "RAA", ctab_code: "B00000A0" },
    ],
    active: true,
  }];

  const wb = buildWorkbook(example);
  const buffer = await wb.xlsx.writeBuffer();

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="nexusops_artigos_template.xlsx"`,
    },
  });
}
