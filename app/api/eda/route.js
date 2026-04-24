import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "../../../lib/auth";
import { getProductWithCtab } from "../../../lib/db/products";

export async function POST(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const user  = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await request.json();
  const {
    regiao,            // "CON" | "RAM" | "RAA"
    dataExpedicao,     // "YYYY-MM-DD"
    tempoExpedicao,    // "D05", "D10", etc.
    numFatura,         // "FA DIS_26/24"
    dataFatura,        // "YYYY-MM-DD"
    nifDestinatario,   // NIF cliente (CON)
    nifEstabDestinatario, // NIF estabelecimento cliente (CON)
    nifBase,           // "509950540"
    nifEstabExpedidor, // "PT50995054001"
    transportador,     // { nif, nome, morada, cp, localidade, local }
    items,             // [{ productId, qty }]
  } = body;

  if (!items?.length) return NextResponse.json({ error: "Sem artigos" }, { status: 400 });

  const isIlhas = regiao === "RAM" || regiao === "RAA";
  const finalidade = isIlhas ? "2" : "1";
  const tipoExpedicao = isIlhas ? "1" : "3";
  const anoFatura = dataFatura ? dataFatura.split("-")[0] : new Date().getFullYear().toString();

  // NIF expedidor
  const prefixoExp = isIlhas ? "02" : "01";
  const nifExpedidor = `PT${prefixoExp}${nifBase}`;

  // Carregar produtos com CTAB
  const adicoes = [];
  for (let i = 0; i < items.length; i++) {
    const { productId, qty } = items[i];
    const product = await getProductWithCtab(productId);
    if (!product) continue;

    const ctab = (product.ctab || []).find(c => c.regiao === regiao);
    if (!ctab) continue;

    const massaBruta = (parseFloat(product.massa_bruta || 0) * qty).toFixed(4).replace(/\.?0+$/, "") || "0";
    const massaLiquida = (parseFloat(product.massa_liquida || 0) * qty).toFixed(4).replace(/\.?0+$/, "") || "0";
    const massaTributavel = (parseFloat(product.massa_tributavel || 0) * qty).toFixed(4).replace(/\.?0+$/, "") || "0";

    adicoes.push({
      id: i + 1,
      nome: product.nome,
      ctabCode: ctab.ctab_code,
      qty,
      massaBruta,
      massaLiquida,
      massaTributavel,
      ano: anoFatura,
    });
  }

  // Gerar XML
  let xml = `<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>\n`;
  xml += `<eDAA xmlns="http://www.dgci.gov.pt/2008/eDAA">\n`;

  // ── Cabeçalho ──
  xml += `\t<Cabecalho>\n`;

  // t1
  xml += `\t\t<t1>\n`;
  xml += `\t\t\t<Q01-00></Q01-00>\n`;
  xml += `\t\t\t<Q01-01></Q01-01>\n`;
  xml += `\t\t\t<Q01-02></Q01-02>\n`;
  xml += `\t\t\t<Q01-03></Q01-03>\n`;
  xml += `\t\t\t<Q01-04>${dataExpedicao}</Q01-04>\n`;
  xml += `\t\t\t<Q01-05></Q01-05>\n`;
  xml += `\t\t\t<Q01-06>${tempoExpedicao}</Q01-06>\n`;
  xml += `\t\t\t<Q01-07></Q01-07>\n`;
  xml += `\t\t\t<Q01-08>${numFatura}</Q01-08>\n`;
  xml += `\t\t\t<Q01-09>${dataFatura}</Q01-09>\n`;
  xml += `\t\t\t<Q01-10>${numFatura}</Q01-10>\n`;
  xml += `\t\t\t<Q01-11>1</Q01-11>\n`;
  xml += `\t\t\t<Q01-12>${finalidade}</Q01-12>\n`;
  xml += `\t\t\t<Q01-14>1</Q01-14>\n`;
  xml += `\t\t</t1>\n`;

  // t2 — expedidor
  xml += `\t\t<t2>\n`;
  xml += `\t\t\t<Q02-01>${nifExpedidor}</Q02-01>\n`;
  xml += `\t\t\t<Q02-02></Q02-02>\n`;
  xml += `\t\t\t<Q02-03></Q02-03>\n`;
  xml += `\t\t\t<Q02-04></Q02-04>\n`;
  xml += `\t\t\t<Q02-05></Q02-05>\n`;
  xml += `\t\t\t<Q02-08>${nifEstabExpedidor}</Q02-08>\n`;
  xml += `\t\t\t<Q02-09></Q02-09>\n`;
  xml += `\t\t\t<Q02-10></Q02-10>\n`;
  xml += `\t\t\t<Q02-15></Q02-15>\n`;
  xml += `\t\t\t<Q02-11></Q02-11>\n`;
  xml += `\t\t\t<Q02-12></Q02-12>\n`;
  xml += `\t\t</t2>\n`;

  // t3 — destinatário
  xml += `\t\t<t3>\n`;
  if (isIlhas) {
    xml += `\t\t\t<Q03-01>PT02${nifBase}</Q03-01>\n`;
    xml += `\t\t\t<Q03-09></Q03-09>\n`;
    xml += `\t\t\t<Q03-10></Q03-10>\n`;
    xml += `\t\t\t<Q03-11></Q03-11>\n`;
    xml += `\t\t\t<Q03-12></Q03-12>\n`;
  } else {
    xml += `\t\t\t<Q03-01>${nifDestinatario}</Q03-01>\n`;
    xml += `\t\t\t<Q03-08>${nifEstabDestinatario}</Q03-08>\n`;
  }
  xml += `\t\t</t3>\n`;

  // t4 — transporte (constante)
  xml += `\t\t<t4>\n`;
  xml += `\t\t\t<Q04-01-1>1</Q04-01-1>\n`;
  xml += `\t\t\t<Q04-01-2>0</Q04-01-2>\n`;
  xml += `\t\t\t<Q04-01-3>0</Q04-01-3>\n`;
  xml += `\t\t\t<Q04-01-4>0</Q04-01-4>\n`;
  xml += `\t\t</t4>\n`;

  // t5 — local expedição / transportador
  const t = transportador || {};
  xml += `\t\t<t5>\n`;
  xml += `\t\t\t<Q05-01>${tipoExpedicao}</Q05-01>\n`;
  xml += `\t\t\t<Q05-07>${t.nif || ""}</Q05-07>\n`;
  xml += `\t\t\t<Q05-08>${t.nome || ""}</Q05-08>\n`;
  xml += `\t\t\t<Q05-09>${t.morada || ""}</Q05-09>\n`;
  xml += `\t\t\t<Q05-10>${t.cp || ""}</Q05-10>\n`;
  xml += `\t\t\t<Q05-11>${t.localidade || ""}</Q05-11>\n`;
  xml += `\t\t\t<Q05-14>${t.local || ""}</Q05-14>\n`;
  xml += `\t\t\t<Q05-12>\n`;
  xml += `\t\t\t\t<Q05-12L row="1">\n`;
  xml += `\t\t\t\t\t<Q05-12-2></Q05-12-2>\n`;
  xml += `\t\t\t\t\t<Q05-12-3></Q05-12-3>\n`;
  xml += `\t\t\t\t</Q05-12L>\n`;
  xml += `\t\t\t</Q05-12>\n`;
  xml += `\t\t</t5>\n`;

  // t6
  xml += `\t\t<t6>\n`;
  xml += `\t\t\t<Q06-13></Q06-13>\n`;
  xml += `\t\t</t6>\n`;

  xml += `\t</Cabecalho>\n`;

  // ── Adições (linhas de produto) ──
  for (const ad of adicoes) {
    xml += `\t<Adicao tipo="I" id="${ad.id}">\n`;

    // t1 produto
    xml += `\t\t<t1>\n`;
    xml += `\t\t\t<Q01-01>${ad.id}</Q01-01>\n`;
    xml += `\t\t\t<Q01-02>TN20</Q01-02>\n`;
    xml += `\t\t\t<Q01-03>24041200</Q01-03>\n`;
    xml += `\t\t\t<Q01-03-01>00</Q01-03-01>\n`;
    xml += `\t\t\t<Q01-05>1710</Q01-05>\n`;
    xml += `\t\t\t<Q01-06>${ad.massaBruta}</Q01-06>\n`;
    xml += `\t\t\t<Q01-07>${ad.massaLiquida}</Q01-07>\n`;
    xml += `\t\t\t<Q01-08>${ad.massaTributavel}</Q01-08>\n`;
    xml += `\t\t\t<Q01-09>${ad.nome}</Q01-09>\n`;
    xml += `\t\t\t<Q01-08D>7</Q01-08D>\n`;
    xml += `\t\t</t1>\n`;

    xml += `\t\t<t2/>\n`;
    xml += `\t\t<t6/>\n`;

    // t3 — mercadoria
    xml += `\t\t<t3>\n`;
    xml += `\t\t\t<Q03-01>0</Q03-01>\n`;
    xml += `\t\t\t<Q03-03>\n`;
    xml += `\t\t\t\t<Q03-03L row="1">\n`;
    xml += `\t\t\t\t\t<Q03-03-01></Q03-03-01>\n`;
    xml += `\t\t\t\t\t<Q03-03-02>${ad.qty}</Q03-03-02>\n`;
    xml += `\t\t\t\t\t<Q03-03-05>\n`;
    xml += `\t\t\t\t\t\t<Q03-03-05L row="1">\n`;
    xml += `\t\t\t\t\t\t\t<Q03-03-05-1>${ad.ctabCode}</Q03-03-05-1>\n`;
    xml += `\t\t\t\t\t\t\t<Q03-03-05-2></Q03-03-05-2>\n`;
    xml += `\t\t\t\t\t\t\t<Q03-03-05-3>${ad.qty}</Q03-03-05-3>\n`;
    xml += `\t\t\t\t\t\t\t<Q03-03-05-4>${ad.ano}</Q03-03-05-4>\n`;
    xml += `\t\t\t\t\t\t</Q03-03-05L>\n`;
    xml += `\t\t\t\t\t</Q03-03-05>\n`;
    xml += `\t\t\t\t</Q03-03L>\n`;
    xml += `\t\t\t</Q03-03>\n`;
    xml += `\t\t</t3>\n`;

    // t4 — espelho
    xml += `\t\t<t4>\n`;
    xml += `\t\t\t<Q04-02>\n`;
    xml += `\t\t\t\t<Q04-02L row="1">\n`;
    xml += `\t\t\t\t\t<Q04-02-01></Q04-02-01>\n`;
    xml += `\t\t\t\t\t<Q04-02-02></Q04-02-02>\n`;
    xml += `\t\t\t\t\t<Q04-02-06>\n`;
    xml += `\t\t\t\t\t\t<Q04-02-06L row="1">\n`;
    xml += `\t\t\t\t\t\t\t<Q04-02-06-1>${ad.ctabCode}</Q04-02-06-1>\n`;
    xml += `\t\t\t\t\t\t\t<Q04-02-06-3>${ad.qty}</Q04-02-06-3>\n`;
    xml += `\t\t\t\t\t\t\t<Q04-02-06-7>${ad.ano}</Q04-02-06-7>\n`;
    xml += `\t\t\t\t\t\t</Q04-02-06L>\n`;
    xml += `\t\t\t\t\t</Q04-02-06>\n`;
    xml += `\t\t\t\t</Q04-02L>\n`;
    xml += `\t\t\t</Q04-02>\n`;
    xml += `\t\t\t<Q04-26>0</Q04-26>\n`;
    xml += `\t\t\t<Q04-27>0</Q04-27>\n`;
    xml += `\t\t</t4>\n`;

    xml += `\t\t<t5/>\n`;
    xml += `\t</Adicao>\n`;
  }

  xml += `</eDAA>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=ISO-8859-1",
      "Content-Disposition": `attachment; filename="eDA_${numFatura.replace(/[^a-zA-Z0-9_-]/g, "_")}_${dataExpedicao}.xml"`,
    },
  });
}
