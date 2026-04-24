import getDb from "../db.js";

// ── Produtos ────────────────────────────────────────────────────────────

export async function getAllProducts() {
  const sql = getDb();
  return await sql`SELECT * FROM products ORDER BY nome`;
}

export async function getProductById(id) {
  const sql = getDb();
  const [row] = await sql`SELECT * FROM products WHERE id = ${id}`;
  return row || null;
}

export async function createProduct({ sku, nome, descricao, unidade, massa_bruta, massa_liquida, massa_tributavel }) {
  const sql = getDb();
  const [row] = await sql`
    INSERT INTO products (sku, nome, descricao, unidade, massa_bruta, massa_liquida, massa_tributavel)
    VALUES (${sku}, ${nome}, ${descricao || null}, ${unidade || "un"}, ${massa_bruta || null}, ${massa_liquida || null}, ${massa_tributavel || null})
    RETURNING *
  `;
  return row;
}

export async function updateProduct(id, fields) {
  const sql = getDb();
  const allowed = ["sku", "nome", "descricao", "unidade", "active", "massa_bruta", "massa_liquida", "massa_tributavel"];
  const sets = [];
  const values = [id];
  for (const f of allowed) {
    if (f in fields) {
      sets.push(`${f} = $${values.length + 1}`);
      values.push(fields[f]);
    }
  }
  if (!sets.length) throw new Error("Nenhum campo para actualizar");
  sets.push(`updated_at = NOW()`);
  const [row] = await sql.unsafe(
    `UPDATE products SET ${sets.join(", ")} WHERE id = $1 RETURNING *`,
    values
  );
  return row;
}

export async function deleteProduct(id) {
  const sql = getDb();
  await sql`DELETE FROM products WHERE id = ${id}`;
}

// ── CTAB (IEC por região) ───────────────────────────────────────────────

export async function getCtabByProduct(productId) {
  const sql = getDb();
  return await sql`SELECT * FROM product_ctab WHERE product_id = ${productId} ORDER BY regiao`;
}

export async function getProductWithCtab(productId) {
  const sql = getDb();
  const [product] = await sql`SELECT * FROM products WHERE id = ${productId}`;
  if (!product) return null;
  const ctab = await sql`SELECT * FROM product_ctab WHERE product_id = ${productId} ORDER BY regiao`;
  return { ...product, ctab };
}

export async function getAllProductsWithCtab() {
  const sql = getDb();
  const products = await sql`SELECT * FROM products ORDER BY nome`;
  const ctab = await sql`SELECT * FROM product_ctab ORDER BY product_id, regiao`;
  const ctabMap = {};
  for (const c of ctab) {
    if (!ctabMap[c.product_id]) ctabMap[c.product_id] = [];
    ctabMap[c.product_id].push(c);
  }
  return products.map(p => ({ ...p, ctab: ctabMap[p.id] || [] }));
}

export async function upsertCtab(productId, regiao, { ctab_code, descricao, taxa, unidade_iec }) {
  const sql = getDb();
  const [row] = await sql`
    INSERT INTO product_ctab (product_id, regiao, ctab_code, descricao, taxa, unidade_iec)
    VALUES (${productId}, ${regiao}, ${ctab_code}, ${descricao || null}, ${taxa || null}, ${unidade_iec || null})
    ON CONFLICT (product_id, regiao) DO UPDATE SET
      ctab_code   = EXCLUDED.ctab_code,
      descricao   = EXCLUDED.descricao,
      taxa        = EXCLUDED.taxa,
      unidade_iec = EXCLUDED.unidade_iec,
      updated_at  = NOW()
    RETURNING *
  `;
  return row;
}

export async function deleteCtab(productId, regiao) {
  const sql = getDb();
  await sql`DELETE FROM product_ctab WHERE product_id = ${productId} AND regiao = ${regiao}`;
}
