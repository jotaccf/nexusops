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

  // Modal importar
  const [importOpen, setImportOpen]       = useState(false);
  const [importFile, setImportFile]       = useState(null);
  const [importPreview, setImportPreview] = useState(null); // { summary, errors, preview }
  const [importing, setImporting]         = useState(false);
  const [importErr, setImportErr]         = useState("");

  // Status save (drawer)
  const [savedAt, setSavedAt] = useState(null);

  // Draft do drawer — buffer local antes de guardar
  const [draft, setDraft]         = useState(null);
  const [saving, setSaving]       = useState(false);
  const [saveErr, setSaveErr]     = useState("");

  // Inicializa/reinicia o draft sempre que o produto seleccionado muda
  useEffect(() => {
    if (!selected) { setDraft(null); return; }
    setDraft({
      sku:              selected.sku,
      nome:             selected.nome,
      descricao:        selected.descricao || "",
      unidade:          selected.unidade || "un",
      active:           selected.active !== false,
      massa_bruta:      selected.massa_bruta ?? "",
      massa_liquida:    selected.massa_liquida ?? "",
      massa_tributavel: selected.massa_tributavel ?? "",
      ctab: {
        CON: (selected.ctab || []).find(c => c.regiao === "CON") || null,
        RAM: (selected.ctab || []).find(c => c.regiao === "RAM") || null,
        RAA: (selected.ctab || []).find(c => c.regiao === "RAA") || null,
      },
    });
    setSaveErr("");
  }, [selected?.id, selected?.updated_at]);

  // Detecta se há alterações pendentes
  function computeDirty(draft, selected) {
    if (!draft || !selected) return false;
    const norm = v => (v == null ? "" : String(v));
    // Comparação numérica tolerante — evita falsos positivos por normalização
    // do browser (ex: "0.0350" → "0.035" no input type=number)
    const eqNum = (a, b) => {
      const na = a === "" || a == null ? null : parseFloat(a);
      const nb = b === "" || b == null ? null : parseFloat(b);
      if (na === null && nb === null) return true;
      if (na === null || nb === null) return false;
      return Math.abs(na - nb) < 1e-9;
    };
    if (norm(draft.sku) !== norm(selected.sku)) return true;
    if (norm(draft.nome) !== norm(selected.nome)) return true;
    if (norm(draft.descricao) !== norm(selected.descricao || "")) return true;
    if (norm(draft.unidade) !== norm(selected.unidade || "un")) return true;
    if (draft.active !== (selected.active !== false)) return true;
    for (const f of ["massa_bruta", "massa_liquida", "massa_tributavel"]) {
      if (!eqNum(draft[f], selected[f])) return true;
    }
    for (const r of ["CON", "RAM", "RAA"]) {
      const dc = draft.ctab[r], oc = (selected.ctab || []).find(c => c.regiao === r);
      if (norm(dc?.ctab_code) !== norm(oc?.ctab_code)) return true;
      if (norm(dc?.descricao) !== norm(oc?.descricao)) return true;
      if (norm(dc?.unidade_iec) !== norm(oc?.unidade_iec)) return true;
      if (!eqNum(dc?.taxa, oc?.taxa)) return true;
    }
    return false;
  }
  const dirty = computeDirty(draft, selected);

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

  // Guardar todas as alterações pendentes do draft
  async function saveDraft() {
    if (!draft || !selected) return;
    setSaving(true);
    setSaveErr("");
    try {
      // 1. Campos do produto
      const productFields = {};
      const norm = v => (v == null ? "" : String(v));
      const eqNum = (a, b) => {
        const na = a === "" || a == null ? null : parseFloat(a);
        const nb = b === "" || b == null ? null : parseFloat(b);
        if (na === null && nb === null) return true;
        if (na === null || nb === null) return false;
        return Math.abs(na - nb) < 1e-9;
      };
      if (norm(draft.sku) !== norm(selected.sku)) productFields.sku = draft.sku;
      if (norm(draft.nome) !== norm(selected.nome)) productFields.nome = draft.nome;
      if (norm(draft.descricao) !== norm(selected.descricao || "")) productFields.descricao = draft.descricao;
      if (norm(draft.unidade) !== norm(selected.unidade || "un")) productFields.unidade = draft.unidade;
      if (draft.active !== (selected.active !== false)) productFields.active = draft.active;
      for (const f of ["massa_bruta", "massa_liquida", "massa_tributavel"]) {
        if (!eqNum(draft[f], selected[f])) {
          productFields[f] = draft[f] === "" ? null : draft[f];
        }
      }

      if (Object.keys(productFields).length > 0) {
        const r = await fetch(`/api/products/${selected.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productFields),
        });
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          throw new Error(data.error || `Erro ${r.status} ao guardar produto`);
        }
      }

      // 2. CTAB por região
      for (const r of ["CON", "RAM", "RAA"]) {
        const dc = draft.ctab[r];
        const oc = (selected.ctab || []).find(c => c.regiao === r);
        const changed =
          norm(dc?.ctab_code)   !== norm(oc?.ctab_code)   ||
          norm(dc?.descricao)   !== norm(oc?.descricao)   ||
          norm(dc?.unidade_iec) !== norm(oc?.unidade_iec) ||
          !eqNum(dc?.taxa, oc?.taxa);
        if (!changed) continue;

        const newCode = dc?.ctab_code?.trim() || "";
        if (!newCode && oc) {
          // remover
          await fetch(`/api/products/${selected.id}/ctab?regiao=${r}`, { method: "DELETE" });
        } else if (newCode) {
          const res = await fetch(`/api/products/${selected.id}/ctab`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              regiao: r,
              ctab_code: newCode,
              descricao: dc?.descricao || null,
              taxa: dc?.taxa === "" ? null : dc?.taxa,
              unidade_iec: dc?.unidade_iec || null,
            }),
          });
          if (!res.ok) throw new Error(`Erro ao guardar CTAB ${r}`);
        }
      }

      setSavedAt(new Date());
      reload();
    } catch (e) {
      setSaveErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  // Descartar alterações — restaura draft do produto original
  function discardDraft() {
    if (!selected) return;
    setDraft({
      sku:              selected.sku,
      nome:             selected.nome,
      descricao:        selected.descricao || "",
      unidade:          selected.unidade || "un",
      active:           selected.active !== false,
      massa_bruta:      selected.massa_bruta ?? "",
      massa_liquida:    selected.massa_liquida ?? "",
      massa_tributavel: selected.massa_tributavel ?? "",
      ctab: {
        CON: (selected.ctab || []).find(c => c.regiao === "CON") || null,
        RAM: (selected.ctab || []).find(c => c.regiao === "RAM") || null,
        RAA: (selected.ctab || []).find(c => c.regiao === "RAA") || null,
      },
    });
    setSaveErr("");
  }

  // Wrapper para mudar de artigo com aviso se houver alterações
  function selectProduct(p) {
    if (dirty && !window.confirm("Tens alterações não guardadas. Descartá-las?")) return;
    setSelected(p);
  }
  function closeDrawer() {
    if (dirty && !window.confirm("Tens alterações não guardadas. Fechar mesmo assim?")) return;
    setSelected(null);
  }

  async function doImport(dryRun) {
    if (!importFile) return;
    setImporting(true);
    setImportErr("");
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      fd.append("dryRun", String(dryRun));
      const res = await fetch("/api/products/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setImportErr(data.error || "Erro"); return; }
      setImportPreview(data);
      if (!dryRun) {
        // após import real, recarregar lista
        setTimeout(() => reload(), 300);
      }
    } catch (e) { setImportErr(e.message); }
    finally { setImporting(false); }
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
            <a
              href="/api/products/export"
              download
              style={{
                padding: "7px 12px", fontSize: 12, fontWeight: 500,
                color: COLORS.textMuted, background: "transparent",
                border: `1px solid ${COLORS.border}`, borderRadius: 6, cursor: "pointer",
                textDecoration: "none",
              }}
              title="Exportar todos os artigos para Excel"
            >↓ Exportar</a>
            {canEdit && (
              <button
                onClick={() => { setImportOpen(true); setImportFile(null); setImportPreview(null); setImportErr(""); }}
                style={{
                  padding: "7px 12px", fontSize: 12, fontWeight: 500,
                  color: COLORS.textMuted, background: "transparent",
                  border: `1px solid ${COLORS.border}`, borderRadius: 6, cursor: "pointer",
                }}
                title="Importar artigos de Excel"
              >↑ Importar</button>
            )}
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
                        onClick={() => selectProduct(p)}
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
        {selected && draft && (
          <Card style={{ alignSelf: "start", maxHeight: "calc(100vh - 160px)", overflowY: "auto", position: "relative" }}>
            {/* Cabeçalho */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 2 }}>
                  {selected.nome}
                  {dirty && <span style={{ marginLeft: 8, fontSize: 10, color: COLORS.amber, fontWeight: 500 }}>• alterado</span>}
                </div>
                <div style={{ fontSize: 11, fontFamily: mono, color: COLORS.textDim }}>{selected.sku}</div>
              </div>
              <button onClick={closeDrawer} style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>

            {savedAt && !dirty && (
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
                  <input value={draft.sku} disabled={!canEdit}
                    onChange={e => setDraft(d => ({ ...d, sku: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Nome</label>
                  <input value={draft.nome} disabled={!canEdit}
                    onChange={e => setDraft(d => ({ ...d, nome: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Descrição</label>
                  <input value={draft.descricao} disabled={!canEdit}
                    onChange={e => setDraft(d => ({ ...d, descricao: e.target.value }))}
                    style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={labelStyle}>Unidade</label>
                    <input value={draft.unidade} disabled={!canEdit}
                      onChange={e => setDraft(d => ({ ...d, unidade: e.target.value }))}
                      style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Estado</label>
                    <button
                      onClick={() => canEdit && setDraft(d => ({ ...d, active: !d.active }))}
                      disabled={!canEdit}
                      style={{
                        ...inputStyle,
                        cursor: canEdit ? "pointer" : "default",
                        color: draft.active ? COLORS.green : COLORS.coral,
                        textAlign: "left",
                      }}
                    >{draft.active ? "● Activo" : "○ Inactivo"}</button>
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
                        value={draft[field]}
                        disabled={!canEdit}
                        onChange={e => setDraft(d => ({ ...d, [field]: e.target.value }))}
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
                  const dc = draft.ctab[r.id] || {};
                  const hasCode = !!dc.ctab_code?.trim();
                  const setCtabField = (field, value) => {
                    setDraft(d => ({
                      ...d,
                      ctab: {
                        ...d.ctab,
                        [r.id]: { ...(d.ctab[r.id] || { regiao: r.id }), [field]: value },
                      },
                    }));
                  };
                  return (
                    <div key={r.id} style={{ padding: 10, background: COLORS.elevated, borderRadius: 6, border: `1px solid ${COLORS.border}` }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>
                        {r.label} <span style={{ fontFamily: mono, color: COLORS.textDim, fontWeight: 400 }}>({r.id})</span>
                        {hasCode && <span style={{ marginLeft: 8, fontSize: 10, color: COLORS.teal }}>✓</span>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <input
                          placeholder="Código CTAB"
                          value={dc.ctab_code || ""}
                          disabled={!canEdit}
                          onChange={e => setCtabField("ctab_code", e.target.value)}
                          style={inputStyle}
                        />
                        <div style={{ display: "flex", gap: 6 }}>
                          <input
                            placeholder="Taxa"
                            type="number" step="0.0001"
                            value={dc.taxa ?? ""}
                            disabled={!canEdit || !hasCode}
                            onChange={e => setCtabField("taxa", e.target.value)}
                            style={{ ...inputStyle, flex: 1 }}
                          />
                          <input
                            placeholder="Unidade IEC"
                            value={dc.unidade_iec || ""}
                            disabled={!canEdit || !hasCode}
                            onChange={e => setCtabField("unidade_iec", e.target.value)}
                            style={{ ...inputStyle, flex: 1 }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Erro de save */}
            {saveErr && (
              <div style={{ padding: 8, marginBottom: 12, background: COLORS.coral + "15", border: `1px solid ${COLORS.coral}40`, borderRadius: 6, fontSize: 11, color: COLORS.coral }}>
                {saveErr}
              </div>
            )}

            {/* Botões Guardar / Descartar */}
            {canEdit && (
              <div style={{
                position: "sticky", bottom: -24, marginBottom: -24, marginTop: 4,
                padding: "12px 0", background: COLORS.surface,
                borderTop: `1px solid ${dirty ? COLORS.amber + "40" : COLORS.border}`,
                display: "flex", gap: 8,
              }}>
                <button
                  onClick={saveDraft}
                  disabled={!dirty || saving}
                  style={{
                    flex: 1, padding: "9px 0", fontSize: 12, fontWeight: 600,
                    background: dirty ? (saving ? COLORS.border : COLORS.teal) : COLORS.border,
                    color: dirty ? "#fff" : COLORS.textDim,
                    border: "none", borderRadius: 6,
                    cursor: dirty && !saving ? "pointer" : "not-allowed",
                  }}
                >{saving ? "A guardar…" : dirty ? "Guardar alterações" : "Sem alterações"}</button>
                <button
                  onClick={discardDraft}
                  disabled={!dirty || saving}
                  style={{
                    padding: "9px 14px", fontSize: 12,
                    color: dirty ? COLORS.textMuted : COLORS.textDim,
                    background: "transparent",
                    border: `1px solid ${COLORS.border}`, borderRadius: 6,
                    cursor: dirty && !saving ? "pointer" : "not-allowed",
                  }}
                >Descartar</button>
              </div>
            )}

            {/* Eliminar */}
            {canEdit && (
              <div style={{ paddingTop: 16, marginTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
                <button
                  onClick={() => deleteProduct(selected.id, selected.sku)}
                  disabled={saving}
                  style={{
                    width: "100%", padding: "8px 0", fontSize: 12,
                    color: COLORS.coral, background: "transparent",
                    border: `1px solid ${COLORS.coral}40`, borderRadius: 6,
                    cursor: saving ? "not-allowed" : "pointer",
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

      {/* Modal importar */}
      {importOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={e => { if (e.target === e.currentTarget) setImportOpen(false); }}
        >
          <div style={{
            background: COLORS.surface, border: `1px solid ${COLORS.border}`,
            borderRadius: 16, padding: 28, width: 640, maxWidth: "95vw",
            maxHeight: "90vh", display: "flex", flexDirection: "column",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, margin: 0 }}>Importar artigos</h2>
                <p style={{ fontSize: 12, color: COLORS.textMuted, margin: 0, marginTop: 4 }}>
                  Sobrescreve artigos existentes (matching por SKU) e cria os novos.
                </p>
              </div>
              <button onClick={() => setImportOpen(false)} style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>

            {/* Template download */}
            <div style={{ padding: 12, background: COLORS.elevated, borderRadius: 8, marginBottom: 14, fontSize: 12, color: COLORS.textMuted }}>
              Não tens um ficheiro? <a href="/api/products/template" download style={{ color: COLORS.teal, textDecoration: "underline" }}>Descarregar template</a> com a estrutura correcta.
            </div>

            {/* File picker */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: COLORS.textMuted, display: "block", marginBottom: 6 }}>Ficheiro Excel (.xlsx) *</label>
              <input
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={e => { setImportFile(e.target.files?.[0] || null); setImportPreview(null); setImportErr(""); }}
                style={{ width: "100%", padding: 8, fontSize: 12, background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 6, color: COLORS.text }}
              />
              {importFile && (
                <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4, fontFamily: mono }}>
                  {importFile.name} ({Math.round(importFile.size / 1024)} KB)
                </div>
              )}
            </div>

            {importErr && (
              <div style={{ padding: 10, background: COLORS.coral + "15", border: `1px solid ${COLORS.coral}40`, borderRadius: 6, fontSize: 12, color: COLORS.coral, marginBottom: 12 }}>
                {importErr}
              </div>
            )}

            {/* Preview */}
            {importPreview && (
              <div style={{ flex: 1, overflowY: "auto", marginBottom: 14 }}>
                <div style={{ padding: 12, background: COLORS.elevated, borderRadius: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>Resumo</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, fontSize: 11 }}>
                    <div>
                      <div style={{ color: COLORS.textDim }}>Total linhas</div>
                      <div style={{ color: COLORS.text, fontFamily: mono, fontSize: 14 }}>{importPreview.summary.total}</div>
                    </div>
                    <div>
                      <div style={{ color: COLORS.textDim }}>A criar</div>
                      <div style={{ color: COLORS.teal, fontFamily: mono, fontSize: 14 }}>{importPreview.summary.criados}</div>
                    </div>
                    <div>
                      <div style={{ color: COLORS.textDim }}>A actualizar</div>
                      <div style={{ color: COLORS.blue, fontFamily: mono, fontSize: 14 }}>{importPreview.summary.actualizados}</div>
                    </div>
                    <div>
                      <div style={{ color: COLORS.textDim }}>Erros</div>
                      <div style={{ color: importPreview.summary.errors > 0 ? COLORS.coral : COLORS.textDim, fontFamily: mono, fontSize: 14 }}>{importPreview.summary.errors}</div>
                    </div>
                  </div>
                </div>

                {importPreview.errors.length > 0 && (
                  <div style={{ padding: 10, background: COLORS.coral + "15", border: `1px solid ${COLORS.coral}40`, borderRadius: 6, marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.coral, marginBottom: 4 }}>Linhas com erro (serão ignoradas)</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 11, color: COLORS.coral }}>
                      {importPreview.errors.slice(0, 10).map(e => (
                        <div key={e.row} style={{ fontFamily: mono }}>Linha {e.row}: {e.error}</div>
                      ))}
                      {importPreview.errors.length > 10 && <div>... e mais {importPreview.errors.length - 10}</div>}
                    </div>
                  </div>
                )}

                <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: COLORS.elevated }}>
                        <th style={{ padding: "6px 8px", textAlign: "left", color: COLORS.textDim, fontWeight: 500 }}>Acção</th>
                        <th style={{ padding: "6px 8px", textAlign: "left", color: COLORS.textDim, fontWeight: 500 }}>SKU</th>
                        <th style={{ padding: "6px 8px", textAlign: "left", color: COLORS.textDim, fontWeight: 500 }}>Nome</th>
                        <th style={{ padding: "6px 8px", textAlign: "center", color: COLORS.textDim, fontWeight: 500 }}>CTAB</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.preview.slice(0, 100).map(r => (
                        <tr key={r.row} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                          <td style={{ padding: "5px 8px" }}>
                            <span style={{
                              fontSize: 10, padding: "1px 6px", borderRadius: 3,
                              background: r.action === "create" ? COLORS.tealDim : COLORS.blueDim,
                              color: r.action === "create" ? COLORS.teal : COLORS.blue,
                            }}>{r.action === "create" ? "criar" : "actualizar"}</span>
                          </td>
                          <td style={{ padding: "5px 8px", fontFamily: mono, color: COLORS.textMuted }}>{r.sku}</td>
                          <td style={{ padding: "5px 8px", color: COLORS.text }}>{r.nome}</td>
                          <td style={{ padding: "5px 8px", textAlign: "center", fontFamily: mono, color: COLORS.textDim }}>{r.ctabs}/3</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importPreview.preview.length > 100 && (
                    <div style={{ padding: 8, fontSize: 11, color: COLORS.textDim, textAlign: "center" }}>
                      ... e mais {importPreview.preview.length - 100} linhas
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Acções */}
            <div style={{ display: "flex", gap: 8 }}>
              {!importPreview && (
                <button
                  onClick={() => doImport(true)}
                  disabled={!importFile || importing}
                  style={{
                    flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 600,
                    background: importFile ? COLORS.teal : COLORS.border,
                    color: importFile ? "#fff" : COLORS.textDim,
                    border: "none", borderRadius: 8,
                    cursor: importFile && !importing ? "pointer" : "not-allowed",
                  }}
                >{importing ? "A validar…" : "Validar ficheiro"}</button>
              )}
              {importPreview && (
                <>
                  <button
                    onClick={() => { setImportPreview(null); setImportFile(null); }}
                    style={{ padding: "9px 18px", fontSize: 13, color: COLORS.textMuted, background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, cursor: "pointer" }}
                  >Recomeçar</button>
                  <button
                    onClick={() => doImport(false)}
                    disabled={importing || importPreview.summary.total === 0}
                    style={{
                      flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 600,
                      background: importPreview.summary.total > 0 ? COLORS.teal : COLORS.border,
                      color: "#fff", border: "none", borderRadius: 8,
                      cursor: importing ? "wait" : "pointer",
                      opacity: importing ? 0.6 : 1,
                    }}
                  >{importing ? "A importar…" : `Confirmar importação (${importPreview.summary.total - importPreview.summary.errors} artigos)`}</button>
                </>
              )}
              <button
                onClick={() => setImportOpen(false)}
                style={{ padding: "9px 18px", fontSize: 13, color: COLORS.textMuted, background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, cursor: "pointer" }}
              >Fechar</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
