import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "../../../../lib/auth";
import { getAllProductsWithCtab } from "../../../../lib/db/products";
import { buildWorkbook } from "../../../../lib/xlsxProducts";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const products = await getAllProductsWithCtab();
  const wb = buildWorkbook(products);
  const buffer = await wb.xlsx.writeBuffer();

  const filename = `nexusops_artigos_${new Date().toISOString().split("T")[0]}.xlsx`;

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
