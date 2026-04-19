import getDb from "../db.js";

export async function getLeads() {
  const sql = getDb();
  const rows = await sql`SELECT * FROM leads ORDER BY created_at DESC`;
  return rows.map(r => ({
    id:      String(r.id),
    nome:    r.nome,
    origem:  r.origem,
    estado:  r.estado,
    destino: r.destino,
  }));
}

export async function createLead({ nome, origem, estado, destino }) {
  const sql = getDb();
  const [row] = await sql`
    INSERT INTO leads (nome, origem, estado, destino)
    VALUES (${nome}, ${origem || null}, ${estado}, ${destino || null})
    RETURNING *
  `;
  return { id: String(row.id), nome: row.nome, origem: row.origem, estado: row.estado, destino: row.destino };
}
