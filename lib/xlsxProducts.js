import ExcelJS from "exceljs";

// Definição das colunas — usada em export, template e import
export const COLUMNS = [
  { header: "SKU",              key: "sku",              width: 35, required: true },
  { header: "Nome",             key: "nome",             width: 40, required: true },
  { header: "Descrição",        key: "descricao",        width: 30 },
  { header: "Unidade",          key: "unidade",          width: 10 },
  { header: "Massa Bruta (kg)", key: "massa_bruta",      width: 16, numeric: true },
  { header: "Massa Líquida (kg)", key: "massa_liquida",  width: 18, numeric: true },
  { header: "Massa Tributável (kg)", key: "massa_tributavel", width: 20, numeric: true },
  { header: "CTAB CON",         key: "ctab_con",         width: 14 },
  { header: "CTAB RAM",         key: "ctab_ram",         width: 14 },
  { header: "CTAB RAA",         key: "ctab_raa",         width: 14 },
  { header: "Activo",           key: "active",           width: 8, boolean: true },
];

// Build de workbook (export ou template)
export function buildWorkbook(products) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "NexusOps";
  wb.created = new Date();

  const ws = wb.addWorksheet("Produtos IEC");
  ws.columns = COLUMNS.map(c => ({ header: c.header, key: c.key, width: c.width }));

  // Estilo do header
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A4D5C" } };
  ws.getRow(1).alignment = { vertical: "middle", horizontal: "left" };
  ws.getRow(1).height = 24;
  ws.views = [{ state: "frozen", ySplit: 1 }];

  for (const p of products) {
    const ctabs = p.ctab || [];
    ws.addRow({
      sku: p.sku,
      nome: p.nome,
      descricao: p.descricao || "",
      unidade: p.unidade || "un",
      massa_bruta: p.massa_bruta != null ? parseFloat(p.massa_bruta) : null,
      massa_liquida: p.massa_liquida != null ? parseFloat(p.massa_liquida) : null,
      massa_tributavel: p.massa_tributavel != null ? parseFloat(p.massa_tributavel) : null,
      ctab_con: ctabs.find(c => c.regiao === "CON")?.ctab_code || "",
      ctab_ram: ctabs.find(c => c.regiao === "RAM")?.ctab_code || "",
      ctab_raa: ctabs.find(c => c.regiao === "RAA")?.ctab_code || "",
      active: p.active !== false,
    });
  }

  // Formatação de massas com 4 casas decimais
  for (const col of ["massa_bruta", "massa_liquida", "massa_tributavel"]) {
    ws.getColumn(col).numFmt = "0.0000";
  }

  return wb;
}

// Parsing do XLSX para array de produtos
export async function parseWorkbook(buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("Ficheiro sem folhas de cálculo");

  // Detectar header (linha 1)
  const headerRow = ws.getRow(1);
  const headerMap = {};
  headerRow.eachCell((cell, colIndex) => {
    const val = String(cell.value || "").trim();
    const col = COLUMNS.find(c => c.header === val);
    if (col) headerMap[col.key] = colIndex;
  });

  // Validar headers obrigatórios
  for (const col of COLUMNS.filter(c => c.required)) {
    if (!headerMap[col.key]) {
      throw new Error(`Coluna "${col.header}" não encontrada no ficheiro`);
    }
  }

  const rows = [];
  const errors = [];

  // Ler a partir da linha 2
  for (let i = 2; i <= ws.rowCount; i++) {
    const row = ws.getRow(i);
    if (row.cellCount === 0) continue;

    const get = (key) => {
      const idx = headerMap[key];
      if (!idx) return null;
      const cell = row.getCell(idx);
      const v = cell.value;
      if (v == null || v === "") return null;
      return v;
    };

    const sku = String(get("sku") || "").trim();
    const nome = String(get("nome") || "").trim();

    // Linha vazia → ignorar
    if (!sku && !nome) continue;

    // Validações
    if (!sku) { errors.push({ row: i, error: "SKU em falta" }); continue; }
    if (!nome) { errors.push({ row: i, error: "Nome em falta" }); continue; }

    const parseNum = (v) => {
      if (v == null) return null;
      const n = parseFloat(String(v).replace(",", "."));
      return isNaN(n) ? null : n;
    };

    const parseBool = (v) => {
      if (v == null) return true;
      const s = String(v).toLowerCase().trim();
      return !["false", "0", "não", "nao", "no", "n"].includes(s);
    };

    rows.push({
      row: i,
      sku,
      nome,
      descricao: get("descricao") ? String(get("descricao")).trim() : null,
      unidade: get("unidade") ? String(get("unidade")).trim() : "un",
      massa_bruta:      parseNum(get("massa_bruta")),
      massa_liquida:    parseNum(get("massa_liquida")),
      massa_tributavel: parseNum(get("massa_tributavel")),
      ctab_con: get("ctab_con") ? String(get("ctab_con")).trim() : null,
      ctab_ram: get("ctab_ram") ? String(get("ctab_ram")).trim() : null,
      ctab_raa: get("ctab_raa") ? String(get("ctab_raa")).trim() : null,
      active: parseBool(get("active")),
    });
  }

  return { rows, errors };
}
