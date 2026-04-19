import getDb from "../db.js";

export async function getOrders() {
  const sql = getDb();
  const rows = await sql`SELECT * FROM orders ORDER BY created_at DESC`;
  return rows.map(r => ({
    id:         r.reference,
    cliente:    r.cliente,
    estado:     r.estado,
    prioridade: r.prioridade,
    parceiro:   r.parceiro,
  }));
}

export async function getOrderCountByEstado() {
  const sql = getDb();
  const rows = await sql`
    SELECT estado, COUNT(*)::int AS total FROM orders GROUP BY estado ORDER BY total DESC
  `;
  return rows;
}
