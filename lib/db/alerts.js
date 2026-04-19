import getDb from "../db.js";

export async function getAlerts() {
  const sql = getDb();
  const rows = await sql`SELECT * FROM alerts WHERE resolved = false ORDER BY severity, created_at DESC`;
  return rows.map(r => ({ text: r.text, severity: r.severity }));
}

export async function getPartners() {
  const sql = getDb();
  const rows = await sql`SELECT * FROM partners ORDER BY sla DESC`;
  return rows.map(r => ({ nome: r.nome, sla: r.sla, encomendas: r.encomendas }));
}

export async function getStockCritico() {
  const sql = getDb();
  const rows = await sql`SELECT * FROM stock_critico ORDER BY quantidade ASC`;
  return rows.map(r => ({ sku: r.sku, quantidade: r.quantidade, nivel: r.nivel }));
}
