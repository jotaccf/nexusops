/**
 * Seed de operação — NexusOps
 * Executar após criar o schema:  node db/seed.js
 *
 * Contas criadas (password: nexus2026):
 *   admin     → ana@empresa.pt
 *   gestor    → pedro@empresa.pt
 *   logistica → carlos@empresa.pt
 *   logistica → rita@empresa.pt
 */

import postgres from "postgres";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL não definida.");
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

// Datas relativas a hoje
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}
const D0 = daysFromNow(0);   // hoje
const D1 = daysFromNow(1);   // amanhã
const D2 = daysFromNow(2);
const D7 = daysFromNow(7);
const Dm1 = daysFromNow(-1); // ontem

async function seed() {
  console.log("A iniciar seed...");

  // ── Utilizadores ──────────────────────────────────────────────────────────
  const hash = await bcrypt.hash("nexus2026", 12);

  await sql`
    INSERT INTO users (name, initials, email, password_hash, role, active) VALUES
      ('Ana Duarte',     'AD', 'ana@empresa.pt',    ${hash}, 'admin',     true),
      ('Pedro Ferreira', 'PF', 'pedro@empresa.pt',  ${hash}, 'gestor',    true),
      ('Carlos Mendes',  'CM', 'carlos@empresa.pt', ${hash}, 'logistica', true),
      ('Rita Sousa',     'RS', 'rita@empresa.pt',   ${hash}, 'logistica', true)
    ON CONFLICT (email) DO UPDATE
      SET name = EXCLUDED.name,
          initials = EXCLUDED.initials,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          active = EXCLUDED.active
  `;
  console.log("✓ Utilizadores (ana, pedro, carlos, rita) — password: nexus2026");

  // ── IDs para foreign keys ──────────────────────────────────────────────────
  const users = await sql`SELECT id, email FROM users ORDER BY id`;
  const uid = {};
  for (const u of users) uid[u.email] = u.id;

  // ── Encomendas ─────────────────────────────────────────────────────────────
  await sql`
    INSERT INTO orders (reference, cliente, estado, prioridade, parceiro) VALUES
      ('ENC-2401', 'Distribuidor Norte', 'Em picking',       'Alta',  'Parceiro LX'),
      ('ENC-2402', 'Retail Hub',         'Pendente stock',   'Média', 'Parceiro PT Centro'),
      ('ENC-2403', 'Canal Farma',        'Pronta a expedir', 'Alta',  'Parceiro Porto'),
      ('ENC-2404', 'Market Sul',         'A validar',        'Baixa', 'Parceiro Algarve'),
      ('ENC-2405', 'Pharma Direct',      'Em picking',       'Alta',  'Parceiro LX')
    ON CONFLICT (reference) DO NOTHING
  `;
  console.log("✓ Encomendas");

  // ── Leads ──────────────────────────────────────────────────────────────────
  await sql`
    INSERT INTO leads (nome, origem, estado, destino) VALUES
      ('Lead Campanha Abril',     'Landing page', 'Qualificado', 'Parceiro Norte'),
      ('Pedido Distribuição B2B', 'Email',        'Em análise',  'Por atribuir'),
      ('Lead Promo Novo SKU',     'Meta Ads',     'Encaminhado', 'Parceiro Lisboa'),
      ('Lead Orgânico SEO',       'Website',      'Novo',        'Por atribuir')
    ON CONFLICT DO NOTHING
  `;
  console.log("✓ Leads");

  // ── Alertas ────────────────────────────────────────────────────────────────
  await sql`
    INSERT INTO alerts (text, severity) VALUES
      ('Divergência de receção no lote LT-8821',    'high'),
      ('Falha XML em 2 docs para validação fiscal',  'high'),
      ('Rutura prevista SKU AX-440 em 48h',          'medium'),
      ('3 encomendas acima do SLA de expedição',     'medium'),
      ('Parceiro Algarve sem resposta há 72h',       'low')
    ON CONFLICT DO NOTHING
  `;
  console.log("✓ Alertas");

  // ── Parceiros ──────────────────────────────────────────────────────────────
  await sql`
    INSERT INTO partners (nome, sla, encomendas) VALUES
      ('Parceiro LX',      97, 42),
      ('Parceiro Porto',   93, 28),
      ('Parceiro Centro',  89, 19),
      ('Parceiro Algarve', 78,  8)
    ON CONFLICT DO NOTHING
  `;
  console.log("✓ Parceiros");

  // ── Stock crítico ──────────────────────────────────────────────────────────
  await sql`
    INSERT INTO stock_critico (sku, quantidade, nivel) VALUES
      ('AX-440',  2, 'danger'),
      ('BK-112',  8, 'warning'),
      ('CL-903', 11, 'warning')
    ON CONFLICT (sku) DO NOTHING
  `;
  console.log("✓ Stock crítico");

  // ── Tarefas (datas relativas a hoje) ──────────────────────────────────────
  await sql`
    INSERT INTO tasks (title, date, time, type, assignee_id, role, priority, done) VALUES
      ('Conferir receção lote LT-8820',  ${Dm1}, '09:00', 'tarefa',    ${uid['carlos@empresa.pt']}, 'logistica', 'normal', true),
      ('Validar SAF-T com erro',         ${D0},  '10:00', 'urgente',   ${uid['pedro@empresa.pt']},  'gestor',    'urgent', false),
      ('Rotulagem lote BK-112',          ${D0},  '11:00', 'tarefa',    ${uid['rita@empresa.pt']},   'logistica', 'normal', false),
      ('Encaminhar lead campanha',       ${D0},  '14:00', 'tarefa',    ${uid['pedro@empresa.pt']},  'gestor',    'normal', false),
      ('Preparar expedição Dist. Norte', ${D0},  '16:00', 'expedição', ${uid['carlos@empresa.pt']}, 'logistica', 'normal', false),
      ('Reunião revisão stock',          ${D1},  '09:00', 'reunião',   ${uid['ana@empresa.pt']},    'admin',     'normal', false),
      ('Auditoria lote BK-112',          ${D1},  '11:00', 'tarefa',    ${uid['rita@empresa.pt']},   'logistica', 'normal', false),
      ('Review pipeline leads',          ${D2},  '10:00', 'tarefa',    ${uid['pedro@empresa.pt']},  'gestor',    'normal', false),
      ('Expedição Canal Farma',          ${D2},  '14:00', 'expedição', ${uid['carlos@empresa.pt']}, 'logistica', 'urgent', false),
      ('Reunião parceiro LX',            ${D7},  '15:00', 'reunião',   ${uid['ana@empresa.pt']},    'admin',     'normal', false)
    ON CONFLICT DO NOTHING
  `;
  console.log("✓ Tarefas");

  // ── Eventos de calendário ──────────────────────────────────────────────────
  await sql`
    INSERT INTO calendar_events (title, date, time, type) VALUES
      ('Reunião equipa',    ${D0}, '09:00', 'reunião'),
      ('Receção lote',      ${D1}, '14:00', 'tarefa'),
      ('Call parceiro LX',  ${D2}, '10:00', 'reunião'),
      ('Contagem cíclica',  ${D2}, '09:00', 'tarefa'),
      ('Review leads',      ${D7}, '15:00', 'reunião'),
      ('Expedição Centro',  ${D7}, '10:00', 'expedição')
    ON CONFLICT DO NOTHING
  `;
  console.log("✓ Eventos de calendário");

  // ── Produtos IEC + CTAB por região ────────────────────────────────────────
  const PRODUTOS_IEC = [
    { nome: 'ELFBAR 600 APPLE PEACH 20MG',                 con: 'B60212C0', ram: 'B12045M0', raa: 'B04972A0' },
    { nome: 'ELFBAR 600 BLUE RAZZ LEMONADE 20MG',          con: 'B60208C0', ram: 'B12041M0', raa: 'B05075A0' },
    { nome: 'ELFBAR 600 BLUEBERRY 20MG',                   con: 'B60202C0', ram: 'B12035M0', raa: 'B04962A0' },
    { nome: 'ELFBAR 600 BLUEBERRY SOUR RASPBERRY 20MG',    con: 'B60226C0', ram: 'B12059M0', raa: 'B04986A0' },
    { nome: 'ELFBAR 600 KIWI PASSION FRUIT GUAVA 20MG',    con: 'B60209C0', ram: 'B12042M0', raa: 'B04969A0' },
    { nome: 'ELFBAR 600 MANGO 20MG',                       con: 'B60206C0', ram: 'B12039M0', raa: 'B04966A0' },
    { nome: 'ELFBAR 600 PEACH ICE 20MG',                   con: 'B60221C0', ram: 'B12054M0', raa: 'B04981A0' },
    { nome: 'ELFBAR 600 PINK LEMONADE 20MG',               con: 'B60210C0', ram: 'B12043M0', raa: 'B04970A0' },
    { nome: 'ELFBAR 600 SPEARMINT 20MG',                   con: 'B60219C0', ram: 'B12052M0', raa: 'B04979A0' },
    { nome: 'ELFBAR 600 STRAWBERRY ICE 20MG',              con: 'B60201C0', ram: 'B12034M0', raa: 'B04961A0' },
    { nome: 'ELFBAR 600 STRAWBERRY KIWI 20MG',             con: 'B60225C0', ram: 'B12058M0', raa: 'B04985A0' },
    { nome: 'ELFBAR 600 WATERMELON 20MG',                  con: 'B60204C0', ram: 'B12037M0', raa: 'B04964A0' },
    { nome: 'LOST MARY BM600 - Blueberry 20mg',            con: 'B60534C0', ram: 'B12125M0', raa: 'B05018A0' },
    { nome: 'LOST MARY BM600 - Blueberry Sour Raspberry 20mg', con: 'B60535C0', ram: 'B12126M0', raa: 'B05019A0' },
    { nome: 'LOST MARY BM600 - Kiwi Passionfruit Guava 20mg',  con: 'B60539C0', ram: 'B12130M0', raa: 'B05023A0' },
    { nome: 'LOST MARY BM600 - Pink Lemonade 20mg',        con: 'B60540C0', ram: 'B12131M0', raa: 'B05024A0' },
    { nome: 'LOST MARY BM600 - Strawberry Ice 20mg',       con: 'B60541C0', ram: 'B12132M0', raa: 'B05025A0' },
    { nome: 'LOST MARY BM600 - Triple Mango 20mg',         con: 'B60542C0', ram: 'B12133M0', raa: 'B05026A0' },
    { nome: 'LOST MARY BM600 - Triple Melon 20mg',         con: 'B60543C0', ram: 'B12134M0', raa: 'B05027A0' },
    { nome: 'LOST MARY BM600 - Watermelon Ice 20mg',       con: 'B60544C0', ram: 'B12135M0', raa: 'B05028A0' },
    { nome: 'ELFBAR CR600 - BLUE RAZZ LEMONADE 20 mg (2ml)', con: 'B60662C0', ram: 'B12220M0', raa: 'B05047A0' },
    { nome: 'ELFBAR CR600 - LEMON LIME 20 mg (2ml)',       con: 'B60671C0', ram: 'B12229M0', raa: 'B05056A0' },
    { nome: 'ELFBAR CR600 - MENTHOL 20 mg (2ml)',          con: 'B60672C0', ram: 'B12230M0', raa: 'B05057A0' },
    { nome: 'ELFBAR CR600 - STRAWBERRY ICE 20 mg (2ml)',   con: 'B60684C0', ram: 'B12242M0', raa: 'B05069A0' },
    { nome: 'ELFBAR CR600 - TRIPLE MANGO 20 mg (2ml)',     con: 'B60687C0', ram: 'B12245M0', raa: 'B05072A0' },
    { nome: 'ELFBAR CR600 - WATERMELON 20 mg (2ml)',       con: 'B60689C0', ram: 'B12247M0', raa: 'B05074A0' },
  ];
  for (const p of PRODUTOS_IEC) {
    const [row] = await sql`
      INSERT INTO products (sku, nome, descricao, unidade, massa_bruta, massa_liquida, massa_tributavel)
      VALUES (${p.nome}, ${p.nome}, ${p.nome}, 'un', 0.0375, 0.035, 0.002)
      ON CONFLICT (sku) DO NOTHING
      RETURNING id
    `;
    if (!row) continue; // já existe, skip CTAB
    for (const [reg, code] of [['CON', p.con], ['RAM', p.ram], ['RAA', p.raa]]) {
      await sql`
        INSERT INTO product_ctab (product_id, regiao, ctab_code) VALUES (${row.id}, ${reg}, ${code})
        ON CONFLICT (product_id, regiao) DO NOTHING
      `;
    }
  }
  console.log(`✓ Produtos IEC (${PRODUTOS_IEC.length} produtos, ${PRODUTOS_IEC.length * 3} CTAB)`);

  console.log("\n✅ Seed concluído.");
  console.log("   Contas disponíveis (password: nexus2026):");
  console.log("   admin     → ana@empresa.pt");
  console.log("   gestor    → pedro@empresa.pt");
  console.log("   logistica → carlos@empresa.pt");
  console.log("   logistica → rita@empresa.pt");

  await sql.end();
}

seed().catch(err => {
  console.error("Erro no seed:", err.message);
  process.exit(1);
});
