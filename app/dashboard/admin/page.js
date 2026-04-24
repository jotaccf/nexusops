"use client";

import { useState, useEffect, useMemo } from "react";
import AppShell from "../../../components/AppShell";
import {
  Badge, Card, SectionHeader, KPICard, StatusDot,
  MiniBar, MetricTile, AlertBanner, ActionButton
} from "../../../components/shared";
import { COLORS, mono } from "../../../lib/colors";
import { LEADS, PARTNERS, ORDERS } from "../../../lib/mockData";
import MailWidget from "../../../components/MailWidget";
import TasksWidget from "../../../components/TasksWidget";

const edaInputStyle = {
  width: "100%", padding: "8px 10px", fontSize: 13,
  background: COLORS.elevated, border: `1px solid ${COLORS.border}`,
  borderRadius: 8, color: COLORS.text, outline: "none", boxSizing: "border-box",
};

const edaLabelStyle = { fontSize: 11, color: COLORS.textMuted, display: "block", marginBottom: 3 };

function tomorrowDate() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function todayDate() {
  const d = new Date();
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function EdaModal({ onClose }) {
  const [products, setProducts]   = useState([]);
  const [filter, setFilter]       = useState("");
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading]     = useState(true);
  const [generating, setGenerating] = useState(false);
  const [step, setStep]           = useState(1); // 1 = artigos, 2 = dados documento

  // Região
  const [regiao, setRegiao]       = useState("CON");

  // Documento (step 2)
  const [tempoExp, setTempoExp]     = useState("D05");
  const [numFatura, setNumFatura]   = useState("");
  const [dataFatura, setDataFatura] = useState(todayDate());

  // Destinatário CON (pré-preenchido)
  const [nifDest, setNifDest]       = useState("PT01510667481");
  const [nifEstabDest, setNifEstabDest] = useState("PT51066748102");

  // Transportador
  const [trNif, setTrNif]           = useState("");
  const [trNome, setTrNome]         = useState("");
  const [trMorada, setTrMorada]     = useState("");
  const [trCp, setTrCp]             = useState("");
  const [trLocalidade, setTrLocalidade] = useState("");
  const [trLocal, setTrLocal]       = useState("");

  useEffect(() => {
    fetch("/api/products").then(r => r.ok ? r.json() : []).then(d => { setProducts(d || []); setLoading(false); });
  }, []);

  const isIlhas = regiao === "RAM" || regiao === "RAA";

  const filtered = useMemo(() => {
    if (!filter.trim()) return products;
    const q = filter.toLowerCase();
    return products.filter(p =>
      p.nome.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.ctab || []).some(c => c.ctab_code.toLowerCase().includes(q))
    );
  }, [products, filter]);

  const selectedItems = useMemo(() => {
    return products
      .filter(p => quantities[p.id] > 0)
      .map(p => {
        const ctab = (p.ctab || []).find(c => c.regiao === regiao);
        const qty = quantities[p.id];
        return {
          ...p, qty,
          ctab_code: ctab?.ctab_code || "—",
          total_bruta: (parseFloat(p.massa_bruta || 0) * qty).toFixed(4),
          total_liquida: (parseFloat(p.massa_liquida || 0) * qty).toFixed(4),
          total_tributavel: (parseFloat(p.massa_tributavel || 0) * qty).toFixed(4),
        };
      });
  }, [products, quantities, regiao]);

  const totals = useMemo(() => ({
    bruta:      selectedItems.reduce((s, i) => s + parseFloat(i.total_bruta), 0).toFixed(4),
    liquida:    selectedItems.reduce((s, i) => s + parseFloat(i.total_liquida), 0).toFixed(4),
    tributavel: selectedItems.reduce((s, i) => s + parseFloat(i.total_tributavel), 0).toFixed(4),
    items:      selectedItems.reduce((s, i) => s + i.qty, 0),
  }), [selectedItems]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/eda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regiao,
          dataExpedicao: tomorrowDate(),
          tempoExpedicao: tempoExp,
          numFatura,
          dataFatura,
          nifDestinatario: nifDest,
          nifEstabDestinatario: nifEstabDest,
          nifBase: "509950540",
          nifEstabExpedidor: "PT50995054001",
          transportador: { nif: trNif, nome: trNome, morada: trMorada, cp: trCp, localidade: trLocalidade, local: trLocal },
          items: selectedItems.map(p => ({ productId: p.id, qty: p.qty })),
        }),
      });
      if (!res.ok) { alert("Erro ao gerar XML"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eDA_${numFatura.replace(/[^a-zA-Z0-9_-]/g, "_")}_${tomorrowDate()}.xml`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: COLORS.surface, border: `1px solid ${COLORS.border}`,
        borderRadius: 16, padding: 28, width: 780, maxWidth: "95vw",
        maxHeight: "92vh", display: "flex", flexDirection: "column",
      }}>
        {/* Cabeçalho */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, margin: 0 }}>
              Gerar e-DA {step === 2 ? "— Dados do documento" : "— Artigos"}
            </h2>
            <p style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3, margin: 0 }}>
              {step === 1 ? "Selecciona artigos e indica quantidades." : "Preenche os dados de expedição e transporte."}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {step === 1 && (<>
          {/* Região + Filtro */}
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[
                { id: "CON", label: "Continente" },
                { id: "RAM", label: "Madeira" },
                { id: "RAA", label: "Açores" },
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setRegiao(r.id)}
                  style={{
                    padding: "6px 12px", fontSize: 11, borderRadius: 6, cursor: "pointer",
                    background: regiao === r.id ? COLORS.teal : "transparent",
                    color: regiao === r.id ? "#fff" : COLORS.textMuted,
                    border: `1px solid ${regiao === r.id ? COLORS.teal : COLORS.border}`,
                    transition: "all 0.15s",
                  }}
                >{r.label}</button>
              ))}
            </div>
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filtrar por nome, SKU ou CTAB..."
              style={{ ...edaInputStyle, flex: 1 }}
              autoFocus
            />
          </div>

          {/* Lista de produtos */}
          <div style={{ flex: 1, overflowY: "auto", marginBottom: 14, border: `1px solid ${COLORS.border}`, borderRadius: 10 }}>
            {loading ? (
              <div style={{ padding: 16, fontSize: 13, color: COLORS.textMuted }}>A carregar produtos...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 16, fontSize: 13, color: COLORS.textMuted }}>Sem resultados.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${COLORS.border}`, position: "sticky", top: 0, background: COLORS.surface, zIndex: 1 }}>
                    <th style={{ textAlign: "left", padding: "8px 10px", color: COLORS.textDim, fontWeight: 500 }}>Produto</th>
                    <th style={{ textAlign: "left", padding: "8px 6px", color: COLORS.textDim, fontWeight: 500, width: 90, fontFamily: mono }}>CTAB {regiao}</th>
                    <th style={{ textAlign: "center", padding: "8px 6px", color: COLORS.textDim, fontWeight: 500, width: 80 }}>Qtd.</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const ctab = (p.ctab || []).find(c => c.regiao === regiao);
                    const qty = quantities[p.id] || "";
                    const hasQty = qty > 0;
                    return (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${COLORS.border}`, background: hasQty ? COLORS.tealDim : "transparent", transition: "background 0.15s" }}>
                        <td style={{ padding: "6px 10px", color: COLORS.text }}>{p.nome}</td>
                        <td style={{ padding: "6px 6px", fontFamily: mono, color: ctab ? COLORS.teal : COLORS.textDim, fontSize: 11 }}>{ctab?.ctab_code || "—"}</td>
                        <td style={{ padding: "4px 6px", textAlign: "center" }}>
                          <input type="number" min="0" value={qty}
                            onChange={e => { const v = parseInt(e.target.value) || 0; setQuantities(prev => ({ ...prev, [p.id]: v > 0 ? v : undefined })); }}
                            style={{ width: 60, padding: "5px 6px", fontSize: 12, fontFamily: mono, textAlign: "center", background: COLORS.elevated, border: `1px solid ${hasQty ? COLORS.teal : COLORS.border}`, borderRadius: 6, color: COLORS.text, outline: "none" }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Resumo */}
          {selectedItems.length > 0 && (
            <div style={{ padding: "12px 14px", background: COLORS.elevated, borderRadius: 10, border: `1px solid ${COLORS.border}`, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>
                Resumo — {selectedItems.length} artigo{selectedItems.length !== 1 ? "s" : ""}, {totals.items} unidades ({regiao})
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 11, fontFamily: mono, color: COLORS.textMuted }}>
                <span>M. Bruta: <span style={{ color: COLORS.text }}>{totals.bruta} kg</span></span>
                <span>M. Líquida: <span style={{ color: COLORS.text }}>{totals.liquida} kg</span></span>
                <span>M. Tributável: <span style={{ color: COLORS.text }}>{totals.tributavel} kg</span></span>
              </div>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                {selectedItems.map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textMuted }}>
                    <span>{item.nome}</span>
                    <span style={{ fontFamily: mono, color: COLORS.text }}>{item.qty} × {item.ctab_code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avançar para step 2 */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              disabled={selectedItems.length === 0}
              onClick={() => setStep(2)}
              style={{ flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 600, background: selectedItems.length > 0 ? COLORS.teal : COLORS.border, color: selectedItems.length > 0 ? "#fff" : COLORS.textDim, border: "none", borderRadius: 8, cursor: selectedItems.length > 0 ? "pointer" : "not-allowed" }}
            >Seguinte — Dados do documento</button>
            <button onClick={onClose} style={{ padding: "10px 20px", fontSize: 13, color: COLORS.textMuted, background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, cursor: "pointer" }}>Cancelar</button>
          </div>
        </>)}

        {step === 2 && (<>
          <div style={{ flex: 1, overflowY: "auto", marginBottom: 14 }}>
            {/* Fatura */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 10 }}>Fatura</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={edaLabelStyle}>N.º da fatura *</label>
                  <input value={numFatura} onChange={e => setNumFatura(e.target.value)} style={edaInputStyle} placeholder="FA DIS_26/24" />
                </div>
                <div>
                  <label style={edaLabelStyle}>Data da fatura *</label>
                  <input type="date" value={dataFatura} onChange={e => setDataFatura(e.target.value)} style={edaInputStyle} />
                </div>
                <div>
                  <label style={edaLabelStyle}>Tempo de expedição *</label>
                  <select value={tempoExp} onChange={e => setTempoExp(e.target.value)} style={edaInputStyle}>
                    {[1,2,3,5,7,10,15,20,30].map(n => (
                      <option key={n} value={`D${String(n).padStart(2,"0")}`}>D{String(n).padStart(2,"0")} — {n} dia{n > 1 ? "s" : ""}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Expedição */}
            <div style={{ padding: "10px 14px", background: COLORS.elevated, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                Data de expedição: <span style={{ fontFamily: mono, color: COLORS.text }}>{tomorrowDate()}</span> (hoje + 1, automático)
                 · Região: <span style={{ fontFamily: mono, color: COLORS.teal }}>{regiao}</span>
                 · Finalidade: <span style={{ fontFamily: mono, color: COLORS.text }}>{isIlhas ? "2 (Ilhas)" : "1 (Continente)"}</span>
              </div>
            </div>

            {/* Destinatário CON (pré-preenchido, editável) */}
            {!isIlhas && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 10 }}>Destinatário</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={edaLabelStyle}>NIF destinatário *</label>
                    <input value={nifDest} onChange={e => setNifDest(e.target.value)} style={edaInputStyle} />
                  </div>
                  <div>
                    <label style={edaLabelStyle}>NIF estabelecimento *</label>
                    <input value={nifEstabDest} onChange={e => setNifEstabDest(e.target.value)} style={edaInputStyle} />
                  </div>
                </div>
              </div>
            )}

            {isIlhas && (
              <div style={{ padding: "10px 14px", background: COLORS.elevated, borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                  Destinatário (ilhas): <span style={{ fontFamily: mono, color: COLORS.text }}>PT02509950540</span> (automático — mesma empresa, prefixo 02)
                </div>
              </div>
            )}

            {/* Transportador */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 10 }}>Transportador</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={edaLabelStyle}>NIF</label>
                  <input value={trNif} onChange={e => setTrNif(e.target.value)} style={edaInputStyle} placeholder="PT509950540" />
                </div>
                <div>
                  <label style={edaLabelStyle}>Nome</label>
                  <input value={trNome} onChange={e => setTrNome(e.target.value)} style={edaInputStyle} placeholder="Nome da empresa" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginTop: 8 }}>
                <div>
                  <label style={edaLabelStyle}>Morada</label>
                  <input value={trMorada} onChange={e => setTrMorada(e.target.value)} style={edaInputStyle} />
                </div>
                <div>
                  <label style={edaLabelStyle}>Código postal</label>
                  <input value={trCp} onChange={e => setTrCp(e.target.value)} style={edaInputStyle} placeholder="0000-000" />
                </div>
                <div>
                  <label style={edaLabelStyle}>Localidade</label>
                  <input value={trLocalidade} onChange={e => setTrLocalidade(e.target.value)} style={edaInputStyle} />
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <label style={edaLabelStyle}>Local específico</label>
                <input value={trLocal} onChange={e => setTrLocal(e.target.value)} style={edaInputStyle} placeholder="B3, R/C" />
              </div>
            </div>

            {/* Resumo artigos */}
            <div style={{ padding: "10px 14px", background: COLORS.elevated, borderRadius: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>
                {selectedItems.length} artigo{selectedItems.length !== 1 ? "s" : ""}, {totals.items} un — M.Bruta: {totals.bruta} kg · M.Líq: {totals.liquida} kg · M.Trib: {totals.tributavel} kg
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {selectedItems.map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: COLORS.textMuted }}>
                    <span>{item.nome}</span>
                    <span style={{ fontFamily: mono, color: COLORS.text }}>{item.qty} × {item.ctab_code}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Acções */}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setStep(1)} style={{ padding: "10px 20px", fontSize: 13, color: COLORS.textMuted, background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, cursor: "pointer" }}>← Voltar</button>
            <button
              disabled={generating || !numFatura || (!isIlhas && (!nifDest || !nifEstabDest))}
              onClick={handleGenerate}
              style={{
                flex: 1, padding: "10px 0", fontSize: 13, fontWeight: 600,
                background: generating ? COLORS.border : COLORS.teal,
                color: "#fff", border: "none", borderRadius: 8,
                cursor: generating ? "wait" : "pointer",
                opacity: (!numFatura || (!isIlhas && (!nifDest || !nifEstabDest))) ? 0.5 : 1,
              }}
            >{generating ? "A gerar..." : "Gerar e-DA (XML)"}</button>
          </div>
        </>)}
      </div>
    </div>
  );
}

const estadoLeadCor = {
  "Qualificado": COLORS.green,
  "Em análise":  COLORS.amber,
  "Encaminhado": COLORS.blue,
  "Novo":        COLORS.teal,
};

const ESTADOS_DEFAULT = [
  { label: "Em picking",       count: 18 },
  { label: "Pendente stock",   count: 6  },
  { label: "Pronta a expedir", count: 14 },
  { label: "A validar",        count: 4  },
];

export default function DashboardAdmin() {
  const [leads, setLeads]       = useState(LEADS);
  const [partners, setPartners] = useState(PARTNERS);
  const [estados, setEstados]   = useState(ESTADOS_DEFAULT);
  const [showEda, setShowEda]   = useState(false);

  useEffect(() => {
    fetch("/api/leads").then(r => r.ok ? r.json() : null).then(d => d && setLeads(d));
    fetch("/api/alerts?type=partners").then(r => r.ok ? r.json() : null).then(d => d && setPartners(d));
    fetch("/api/orders?groupBy=estado")
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setEstados(d.map(r => ({ label: r.estado, count: r.total }))));
  }, []);

  return (
    <AppShell activeTab="admin">
      {/* 1. KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <KPICard title="Encomendas hoje" value="148" delta="+12%" delay={0}   />
        <KPICard title="Leads novos"     value="36"  delta="+8%"  delay={60}  />
        <KPICard title="Docs emitidos"   value="64"               delay={120} />
        <KPICard title="XML pendentes"   value="5"                delay={180} />
      </div>

      {/* 2. Grid 1fr + 1fr — Leads + Docs fiscais */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Pipeline de leads */}
        <Card delay={240}>
          <SectionHeader title="Pipeline de leads" badge="36 hoje" badgeColor={COLORS.green} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {leads.map(lead => (
              <div
                key={lead.id}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 12px", borderRadius: 10,
                  border: `1px solid ${COLORS.border}`,
                  transition: "background 0.15s, border-color 0.15s",
                  cursor: "pointer",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.borderColor = COLORS.borderHover;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = COLORS.border;
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <StatusDot color={estadoLeadCor[lead.estado] || COLORS.textMuted} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{lead.nome}</div>
                    <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>
                      {lead.origem} → {lead.destino}
                    </div>
                  </div>
                </div>
                <Badge color={estadoLeadCor[lead.estado] || COLORS.textMuted}>{lead.estado}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Documentação fiscal */}
        <Card delay={300}>
          <SectionHeader title="Documentação fiscal" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <MetricTile label="Falhas integração" value="2" color={COLORS.coral} />
            <MetricTile label="Reconciliação"     value="91%" color={COLORS.teal}  />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <AlertBanner text="2 SAF-T com erro de validação" severity="high" />
            <AlertBanner text="5 XML por submeter" severity="medium" />
          </div>
        </Card>
      </div>

      {/* 3. Grid 3 colunas — Parceiros + Encomendas + Ações */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {/* Performance parceiros */}
        <Card delay={360}>
          <SectionHeader title="Performance parceiros" />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {partners.map(p => {
              const cor = p.sla >= 90 ? COLORS.teal : p.sla >= 80 ? COLORS.amber : COLORS.coral;
              return (
                <div key={p.nome}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{p.nome}</div>
                      <div style={{ fontSize: 11, color: COLORS.textDim }}>{p.encomendas} encomendas</div>
                    </div>
                    <span style={{ fontSize: 12, fontFamily: mono, fontWeight: 700, color: cor }}>{p.sla}%</span>
                  </div>
                  <MiniBar value={p.sla} max={100} color={cor} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Encomendas por estado */}
        <Card delay={420}>
          <SectionHeader title="Encomendas por estado" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {estados.map((item, i) => (
              <div
                key={item.label}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 12px",
                  background: i % 2 === 0 ? COLORS.elevated : "transparent",
                  borderRadius: 8,
                }}
              >
                <span style={{ fontSize: 13 }}>{item.label}</span>
                <span style={{ fontSize: 14, fontFamily: mono, fontWeight: 600, color: COLORS.text }}>{item.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Ações rápidas */}
        <Card delay={480}>
          <SectionHeader title="Ações rápidas" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <ActionButton label="Gerar e-DA"         icon="◆" onClick={() => setShowEda(true)} />
            <ActionButton label="Nova encomenda"    icon="+" />
            <ActionButton label="Validar XML / AT"  icon="✓" />
            <ActionButton label="Encaminhar lead"   icon="→" />
            <ActionButton label="Relatório diário"  icon="◎" />
          </div>
        </Card>
      </div>

      {/* 4. Caixa de entrada */}
      <Card delay={540} style={{ marginBottom: 24 }}>
        <MailWidget maxEmails={6} />
      </Card>

      {/* 5. TasksWidget */}
      <Card delay={600}>
        <TasksWidget role="gestor" max={3} />
      </Card>
      {showEda && <EdaModal onClose={() => setShowEda(false)} />}
    </AppShell>
  );
}
