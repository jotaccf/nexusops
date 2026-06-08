"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import AppShell from "../../../components/AppShell";
import { Card, SectionHeader, KPICard } from "../../../components/shared";
import { COLORS, mono } from "../../../lib/colors";
import { useSession } from "../../../lib/SessionContext";

const REGIOES = [
  { id: "CON", label: "Continente" },
  { id: "RAM", label: "Madeira" },
  { id: "RAA", label: "Açores" },
];

const inputStyle = {
  width: "100%", padding: "7px 10px", fontSize: 12,
  background: COLORS.elevated, border: `1px solid ${COLORS.border}`,
  borderRadius: 6, color: COLORS.text, outline: "none", boxSizing: "border-box",
};

const labelStyle = { fontSize: 11, color: COLORS.textMuted, display: "block", marginBottom: 3 };

// Marca derivada do nome
function getMarca(nome) {
  const n = (nome || "").toUpperCase();
  if (n.startsWith("ELFBAR CR")) return "ELFBAR CR";
  if (n.startsWith("ELFBAR"))    return "ELFBAR";
  if (n.startsWith("LOST MARY")) return "LOST MARY";
  return "Outros";
}

// Estado de prontidão para e-DA
function getProntidao(p) {
  const regioes = ["CON", "RAM", "RAA"];
  const ctabs = p.ctab || [];
  const ctabsCompletos = regioes.every(r => ctabs.find(c => c.regiao === r));
  const massasCompletas = p.massa_bruta && p.massa_liquida && p.massa_tributavel;

  if (!p.active) return { nivel: "off", label: "Inactivo", cor: COLORS.textDim };
  if (ctabsCompletos && massasCompletas) return { nivel: "ok", label: "Pronto", cor: COLORS.green };
  if (ctabs.length > 0 || massasCompletas) return { nivel: "parcial", label: "Parcial", cor: COLORS.amber };
  return { nivel: "ko", label: "Incompleto", cor: COLORS.coral };
}

export default function DashboardArtigos() {
  const user = useSession();
  const canEdit = user?.role === "admin";

  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);

  // Filtros
  const [search, setSearch]         = useState("");
  const [marcaFiltro, setMarcaFiltro] = useState("");
  const [showInactivos, setShowInactivos] = useState(false);
  const [missingCtab, setMissingCtab] = useState(""); // "" | "CON" | "RAM" | "RAA"

  // Modal criar
  const [createOpen, setCreateOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ sku: "", nome: "", descricao: "", unidade: "un" });
  const [createSaving, setCreateSaving] = useState(false);
  const [createErr, setCreateErr]   = useState("");

  // Status save (drawer)
  const [savedAt, setSavedAt] = useState(null);

  const reload = useCallback(() => {
    setLoading(true);
    fetch("/api/products").then(r => r.ok ? r.json() : []).then(d => {
      setProducts(d || []);
      setLoading(false);
      // refresh selected
      if (selected) {
        const updated = (d || []).find(p => p.id === selected.id);
        if (updated) setSelected(updated);
      }
    });
  }, [selected]);

  useEffect(() => {
    fetch("/api/products").then(r => r.ok ? r.json() : []).then(d => {
      setProducts(d || []);
      setLoading(false);
    });
  }, []);

  // Lista de marcas únicas
  const marcas = useMemo(() => {
    const s = new Set(products.map(p => getMarca(p.nome)));
    return Array.from(s).sort();
  }, [products]);

  // Produtos filtrados
  const filtered = useMemo(() => {
    let list = products;
    if (!showInactivos) list = list.filter(p => p.active);
    if (marcaFiltro)    list = list.filter(p => getMarca(p.nome) === marcaFiltro);
    if (missingCtab)    list = list.filter(p => !(p.ctab || []).find(c => c.regiao === missingCtab));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.nome.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.descricao || "").toLowerCase().includes(q) ||
        (p.ctab || []).some(c => c.ctab_code.toLowerCase().includes(q))
      );
    }
    return list;
  }, [products, search, marcaFiltro, showInactivos, missingCtab]);

  // KPIs
  const stats = useMemo(() => {
    const total = products.length;
    const activos = products.filter(p => p.active).length;
    const prontos = products.filter(p => getProntidao(p).nivel === "ok").length;
    const semCtab = products.filter(p => (p.ctab || []).length < 3).length;
    return { total, activos, prontos, semCtab };
  }, [products]);

  // ── Acções ────────────────────────────────────────────────────

  async function handleCreate() {
    setCreateErr(""); setCreateSaving(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });
      const data = await res.json();
      if (!res.ok) { setCreateErr(data.error || "Erro"); return; }
      setCreateOpen(false);
      setNewProduct({ sku: "", nome: "", descricao: "", unidade: "un" });
      reload();
      // Selecciona o novo produto
      setTimeout(() => {
        fetch("/api/products").then(r => r.json()).then(arr => {
          const fresh = arr.find(p => p.id === data.id);
          if (fresh) setSelected(fresh);
        });
      }, 200);
    } catch (e) { setCreateErr(e.message); }
    finally { setCreateSaving(false); }
  }

  async function updateField(id, fields) {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (res.ok) {
      setSavedAt(new Date());
      reload();
    }
  }

  async function upsertCtab(productId, regiao, fields) {
    const product = products.find(p => p.id === productId);
    const existing = (product?.ctab || []).find(c => c.regiao === regiao);
    const body = {
      regiao,
      ctab_code: fields.ctab_code ?? existing?.ctab_code ?? "",
      descricao: fields.descricao ?? existing?.descricao,
      taxa:      fields.taxa ?? existing?.taxa,
      unidade_iec: fields.unidade_iec ?? existing?.unidade_iec,
    };
    if (!body.ctab_code) {
      // sem código → eliminar
      if (existing) {
        await fetch(`/api/products/${productId}/ctab?regiao=${regiao}`, { method: "DELETE" });
        setSavedAt(new Date());
        reload();
      }
      return;
    }
    const res = await fetch(`/api/products/${productId}/ctab`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setSavedAt(new Date());
      reload();
    }
  }

  async function deleteProduct(id, sku) {
    const confirm = prompt(`Para eliminar este produto, escreve o SKU exacto:\n${sku}`);
    if (confirm !== sku) {
      if (confirm !== null) alert("SKU não confere. Eliminação cancelada.");
      return;
    }
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setSelected(null);
    reload();
  }

  return (
    <AppShell activeTab="artigos">
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16, marginBottom: 20 }}>
        <KPICard title="Total artigos"     value={stats.total}     delay={0}   />
        <KPICard title="Activos"           value={stats.activos}   delay={60}  />
        <KPICard title="Prontos para e-DA" value={stats.prontos}   delay={120} />
        <KPICard title="Sem CTAB completo" value={stats.semCtab}   delay={180} />
      </div>

      {/* Layout master-detail */}
      <div style={{ display: "grid", gridTemplateColumns: selected ? "minmax(0, 1fr) 420px" : "1fr", gap: 16 }}>
        {/* Master — tabela */}
        <Card>
          {/* Toolbar */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14, alignItems: "center" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar por nome, SKU, CTAB..."
              style={{ ...inputStyle, flex: 1, minWidth: 200 }}
            />
            <select value={marcaFiltro} onChange={e => setMarcaFiltro(e.target.value)} style={{ ...inputStyle, width: 150 }}>
              <option value="">Todas as marcas</option>
              {marcas.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={missingCtab} onChange={e => setMissingCtab(e.target.value)} style={{ ...inputStyle, width: 150 }}>
              <option value="">CTAB: todos</option>
              <option value="CON">Sem CTAB CON</option>
              <option value="RAM">Sem CTAB RAM</option>
              <option value="RAA">Sem CTAB RAA</option>
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.textMuted, cursor: "pointer" }}>
              <input type="checkbox" checked={showInactivos} onChange={e => setShowInactivos(e.target.checked)} />
              Mostrar inactivos
            </label>
            {canEdit && (
              <button
                onClick={() => { setCreateOpen(true); setCreateErr(""); }}
                style={{
                  padding: "7px 14px", fontSize: 12, fontWeight: 500,
                  color: COLORS.teal, background: COLORS.tealDim,
                  border: `1px solid ${COLORS.teal}40`, borderRadius: 6, cursor: "pointer",
                }}
              >+ Novo artigo</button>
            )}
          </div>

          {/* Contador */}
          <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 8 }}>
            {filtered.length} de {products.length} artigos
          </div>

          {/* Tabela */}
          <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 16, fontSize: 13, color: COLORS.textMuted }}>A carregar...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 16, fontSize: 13, color: COLORS.textMuted }}>Sem resultados.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${COLORS.border}`, background: COLORS.elevated }}>
                    <th style={{ textAlign: "left", padding: "8px 10px", color: COLORS.textDim, fontWeight: 500 }}>Estado</th>
                    <th style={{ textAlign: "left", padding: "8px 6px", color: COLORS.textDim, fontWeight: 500, width: 120, fontFamily: mono }}>SKU</th>
                    <th style={{ textAlign: "left", padding: "8px 6px", color: COLORS.textDim, fontWeight: 500 }}>Nome</th>
                    <th style={{ textAlign: "center", padding: "8px 6px", color: COLORS.textDim, fontWeight: 500, width: 130 }}>CTAB</th>
                    <th style={{ textAlign: "center", padding: "8px 6px", color: COLORS.textDim, fontWeight: 500, width: 60 }}>Massas</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const prontidao = getProntidao(p);
                    const isSelected = selected?.id === p.id;
                    const temMassas = p.massa_bruta && p.massa_liquida && p.massa_tributavel;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelected(p)}
                        style={{
                          borderBottom: `1px solid ${COLORS.border}`,
                          background: isSelected ? COLORS.tealDim : "transparent",
                          cursor: "pointer", transition: "background 0.15s",
                          opacity: p.active ? 1 : 0.55,
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = COLORS.elevated; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                      >
                        <td style={{ padding: "7px 10px" }}>
                          <div title={prontidao.label} style={{ width: 10, height: 10, borderRadius: "50%", background: prontidao.cor, display: "inline-block" }} />
                        </td>
                        <td style={{ padding: "7px 6px", fontFamily: mono, color: COLORS.textMuted, fontSize: 11 }}>{p.sku}</td>
                        <td style={{ padding: "7px 6px", color: COLORS.text }}>{p.nome}</td>
                        <td style={{ padding: "7px 6px", textAlign: "center" }}>
                          {REGIOES.map(r => {
                            const has = (p.ctab || []).some(c => c.regiao === r.id);
                            return (
                              <span key={r.id} title={`CTAB ${r.id}`} style={{
                                display: "inline-block", width: 24, padding: "1px 0",
                                margin: "0 1px", fontSize: 9, fontFamily: mono, borderRadius: 3,
                                background: has ? COLORS.tealDim : COLORS.elevated,
                                color: has ? COLORS.teal : COLORS.textDim,
                                border: `1px solid ${has ? COLORS.teal + "40" : COLORS.border}`,
                              }}>{r.id}</span>
                            );
                          })}
                        </td>
                        <td style={{ padding: "7px 6px", textAlign: "center", fontSize: 14 }}>
                          {temMassas ? <span style={{ color: COLORS.teal }}>●</span> : <span style={{ color: COLORS.textDim }}>○</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Detalhe — drawer lateral */}
        {selected && (
          <Card style={{ alignSelf: "start", maxHeight: "calc(100vh - 160px)", overflowY: "auto" }}>
            {/* Cabeçalho */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 2 }}>{selected.nome}</div>
                <div style={{ fontSize: 11, fontFamily: mono, color: COLORS.textDim }}>{selected.sku}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>

            {savedAt && (
              <div style={{ fontSize: 10, color: COLORS.green, marginBottom: 10, fontFamily: mono }}>
                ✓ Guardado às {savedAt.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            )}

            {!canEdit && (
              <div style={{ padding: 8, marginBottom: 12, background: COLORS.elevated, borderRadius: 6, fontSize: 11, color: COLORS.textMuted }}>
                Modo só-leitura — só admin pode editar
              </div>
            )}

            {/* Identificação */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>Identificação</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <label style={labelStyle}>SKU</label>
                  <input
                    defaultValue={selected.sku}
                    disabled={!canEdit}
                    onBlur={e => e.target.value !== selected.sku && updateField(selected.id, { sku: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Nome</label>
                  <input
                    defaultValue={selected.nome}
                    disabled={!canEdit}
                    onBlur={e => e.target.value !== selected.nome && updateField(selected.id, { nome: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Descrição</label>
                  <input
                    defaultValue={selected.descricao || ""}
                    disabled={!canEdit}
                    onBlur={e => e.target.value !== (selected.descricao || "") && updateField(selected.id, { descricao: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={labelStyle}>Unidade</label>
                    <input
                      defaultValue={selected.unidade || "un"}
                      disabled={!canEdit}
                      onBlur={e => e.target.value !== selected.unidade && updateField(selected.id, { unidade: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Estado</label>
                    <button
                      onClick={() => canEdit && updateField(selected.id, { active: !selected.active })}
                      disabled={!canEdit}
                      style={{
                        ...inputStyle,
                        cursor: canEdit ? "pointer" : "default",
                        color: selected.active ? COLORS.green : COLORS.coral,
                        textAlign: "left",
                      }}
                    >{selected.active ? "● Activo" : "○ Inactivo"}</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Massas */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>Massas unitárias (kg)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {["massa_bruta", "massa_liquida", "massa_tributavel"].map(field => {
                  const labels = { massa_bruta: "Bruta", massa_liquida: "Líquida", massa_tributavel: "Tributável" };
                  return (
                    <div key={field}>
                      <label style={labelStyle}>{labels[field]}</label>
                      <input
                        type="number" step="0.0001"
                        defaultValue={selected[field] || ""}
                        disabled={!canEdit}
                        onBlur={e => {
                          const v = e.target.value || null;
                          if (String(v) !== String(selected[field] || ""))
                            updateField(selected.id, { [field]: v });
                        }}
                        style={inputStyle}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTAB por região */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>Códigos CTAB por região</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {REGIOES.map(r => {
                  const c = (selected.ctab || []).find(x => x.regiao === r.id);
                  return (
                    <div key={r.id} style={{ padding: 10, background: COLORS.elevated, borderRadius: 6, border: `1px solid ${COLORS.border}` }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>
                        {r.label} <span style={{ fontFamily: mono, color: COLORS.textDim, fontWeight: 400 }}>({r.id})</span>
                        {c && <span style={{ marginLeft: 8, fontSize: 10, color: COLORS.teal }}>✓</span>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <input
                          placeholder="Código CTAB"
                          defaultValue={c?.ctab_code || ""}
                          disabled={!canEdit}
                          onBlur={e => e.target.value !== (c?.ctab_code || "") && upsertCtab(selected.id, r.id, { ctab_code: e.target.value })}
                          style={inputStyle}
                        />
                        <div style={{ display: "flex", gap: 6 }}>
                          <input
                            placeholder="Taxa"
                            type="number" step="0.0001"
                            defaultValue={c?.taxa || ""}
                            disabled={!canEdit || !c}
                            onBlur={e => c && String(e.target.value) !== String(c?.taxa || "") && upsertCtab(selected.id, r.id, { taxa: e.target.value || null })}
                            style={{ ...inputStyle, flex: 1 }}
                          />
                          <input
                            placeholder="Unidade IEC"
                            defaultValue={c?.unidade_iec || ""}
                            disabled={!canEdit || !c}
                            onBlur={e => c && e.target.value !== (c?.unidade_iec || "") && upsertCtab(selected.id, r.id, { unidade_iec: e.target.value })}
                            style={{ ...inputStyle, flex: 1 }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Eliminar */}
            {canEdit && (
              <div style={{ paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
                <button
                  onClick={() => deleteProduct(selected.id, selected.sku)}
                  style={{
                    width: "100%", padding: "8px 0", fontSize: 12,
                    color: COLORS.coral, background: "transparent",
                    border: `1px solid ${COLORS.coral}40`, borderRadius: 6, cursor: "pointer",
                  }}
                >Eliminar artigo</button>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Modal criar */}
      {createOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={e => { if (e.target === e.currentTarget) setCreateOpen(false); }}
        >
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 28, width: 440, maxWidth: "92vw" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, margin: 0, marginBottom: 6 }}>Novo artigo</h2>
            <p style={{ fontSize: 11, color: COLORS.textMuted, margin: 0, marginBottom: 18 }}>Cria primeiro o produto. Massas e CTAB são definidos no painel de edição.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={labelStyle}>SKU *</label>
                <input value={newProduct.sku} onChange={e => setNewProduct(p => ({ ...p, sku: e.target.value }))} style={inputStyle} autoFocus />
              </div>
              <div>
                <label style={labelStyle}>Nome *</label>
                <input value={newProduct.nome} onChange={e => setNewProduct(p => ({ ...p, nome: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Descrição</label>
                <input value={newProduct.descricao} onChange={e => setNewProduct(p => ({ ...p, descricao: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Unidade</label>
                <input value={newProduct.unidade} onChange={e => setNewProduct(p => ({ ...p, unidade: e.target.value }))} style={inputStyle} placeholder="un, kg, lt..." />
              </div>
              {createErr && <div style={{ fontSize: 11, color: COLORS.coral }}>{createErr}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button
                  onClick={handleCreate}
                  disabled={createSaving || !newProduct.sku || !newProduct.nome}
                  style={{ flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 600, background: COLORS.teal, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", opacity: createSaving ? 0.6 : 1 }}
                >{createSaving ? "A criar…" : "Criar artigo"}</button>
                <button
                  onClick={() => setCreateOpen(false)}
                  style={{ padding: "9px 18px", fontSize: 13, color: COLORS.textMuted, background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, cursor: "pointer" }}
                >Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
