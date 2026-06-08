"use client";

import { useState, useEffect } from "react";
import AppShell from "../../../components/AppShell";
import {
  Badge, Card, SectionHeader, KPICard, StatusDot, ActionButton
} from "../../../components/shared";
import { COLORS, mono } from "../../../lib/colors";

const roleBadgeColor = {
  admin:     COLORS.purple,
  gestor:    COLORS.blue,
  logistica: COLORS.amber,
};

const roleLabel = {
  admin:     "Admin",
  gestor:    "Gestão",
  logistica: "Logística",
};

function Toggle({ on, onChange }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 36, height: 20, borderRadius: 10,
        background: on ? COLORS.teal : COLORS.border,
        position: "relative", cursor: "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: "50%",
        background: "#fff",
        position: "absolute",
        top: 2,
        left: on ? 18 : 2,
        transition: "left 0.2s",
      }} />
    </div>
  );
}

const INTEGRACOES_DEFAULT = [
  { id: "odoo",  label: "Odoo ERP",       sub: "API REST",   on: true  },
  { id: "wise",  label: "Wisedat",         sub: "XML / API",  on: true  },
  { id: "imap",  label: "Servidor IMAP",  sub: "Email",      on: true  },
  { id: "at",    label: "Portal AT",       sub: "SAF-T XML",  on: false },
];

const SISTEMA_DEFAULT = [
  { id: "backup", label: "Backups automáticos",   on: true  },
  { id: "logs",   label: "Logs de auditoria",      on: true  },
  { id: "mfa",    label: "MFA obrigatório",         on: false },
  { id: "notif",  label: "Notificações email",      on: true  },
  { id: "ical",   label: "Sincronização iCal",      on: true  },
];

const PERFIS = [
  { nome: "Logística",    desc: "Armazém, picking, expedição, stock" },
  { nome: "Administração", desc: "Docs, leads, marketing, faturação" },
  { nome: "Config",       desc: "Tudo + utilizadores + integrações" },
];

const IMAP_DEFAULTS     = { host: "", port: "993", user: "", password: "", tls: true };
const WISEDAT_DEFAULTS  = { url: "", apiKey: "", username: "", password: "" };
const NOVO_USER_DEFAULTS = { name: "", email: "", password: "", role: "logistica", imap_host: "", imap_port: "993", imap_user: "", imap_password: "", imap_tls: true };
export default function DashboardConfig() {
  const [userList, setUserList]     = useState([]);
  const [userModal, setUserModal]       = useState(false);
  const [novoUser, setNovoUser]         = useState(NOVO_USER_DEFAULTS);
  const [userSaving, setUserSaving]     = useState(false);
  const [userErr, setUserErr]           = useState("");
  const [userImapOpen, setUserImapOpen] = useState(false);
  const [showUserImapPass, setShowUserImapPass] = useState(false);

  function reloadUsers() {
    fetch("/api/users").then(r => r.ok ? r.json() : []).then(d => setUserList(d || []));
  }

  useEffect(() => { reloadUsers(); }, []);

  async function criarUser() {
    setUserSaving(true);
    setUserErr("");
    try {
      const r = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoUser),
      });
      const data = await r.json();
      if (!r.ok) { setUserErr(data.error || `Erro ${r.status}`); return; }
      setUserModal(false);
      setNovoUser(NOVO_USER_DEFAULTS);
      reloadUsers();
    } catch (err) {
      setUserErr(err.message);
    } finally {
      setUserSaving(false);
    }
  }

  async function toggleUserActive(user) {
    const r = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    if (r.ok) reloadUsers();
  }

  const [integracoes, setIntegracoes] = useState(INTEGRACOES_DEFAULT);
  const [sistema, setSistema]         = useState(SISTEMA_DEFAULT);
  const [icalOpen, setIcalOpen]       = useState(false);
  const [icalPublicUrl, setIcalPublicUrl] = useState("");
  const [icalUrlInput, setIcalUrlInput]   = useState("");
  const [icalApiUrl, setIcalApiUrl]       = useState("/api/cal/ical?token=demo");
  const [urlSaved, setUrlSaved]           = useState(false);
  const [urlCopied, setUrlCopied]         = useState(false);

  // IMAP config
  const [imapOpen, setImapOpen]         = useState(false);
  const [imapCfg, setImapCfg]           = useState(IMAP_DEFAULTS);
  const [imapSaved, setImapSaved]       = useState(false);
  const [imapSaveErr, setImapSaveErr]   = useState("");
  const [imapTesting, setImapTesting]   = useState(false);
  const [imapTestMsg, setImapTestMsg]   = useState("");
  const [showImapPass, setShowImapPass] = useState(false);

  // Wisedat config
  const [wisedatOpen, setWisedatOpen]       = useState(false);
  const [wisedatCfg, setWisedatCfg]         = useState(WISEDAT_DEFAULTS);
  const [wisedatTesting, setWisedatTesting] = useState(false);
  const [wisedatResult, setWisedatResult]   = useState(null); // null | { success, auth_token } | { error }
  const [wisedatToken, setWisedatToken]     = useState("");
  const [showWisedatPass, setShowWisedatPass] = useState(false);

  useEffect(() => {
    // iCal — apenas URL público (não sensível, localStorage OK)
    const saved = localStorage.getItem("nexusops_ical_public_url") || "";
    setIcalPublicUrl(saved);
    setIcalUrlInput(saved);
    setIcalApiUrl(`${window.location.origin}/api/cal/ical?token=demo`);

    // IMAP — carregar da base de dados, com fallback para localStorage
    fetch("/api/config/imap").then(r => r.ok ? r.json() : null).then(data => {
      if (data && !data.demo && data.configured) {
        setImapCfg({
          host:     data.host     || "",
          port:     data.port     || "993",
          user:     data.user     || "",
          password: data.password || "",
          tls:      data.tls !== false,
        });
      } else {
        // fallback localStorage (quando DB não está configurada)
        const local = localStorage.getItem("nexusops_imap_config");
        if (local) {
          try { setImapCfg({ ...IMAP_DEFAULTS, ...JSON.parse(local) }); } catch {}
        }
      }
    });

    // Wisedat — carregar da base de dados
    fetch("/api/config/wisedat").then(r => r.ok ? r.json() : null).then(data => {
      if (data && !data.demo) {
        setWisedatCfg({
          url:      data.url      || "",
          apiKey:   data.apiKey   || "",
          username: data.username || "",
          password: data.password || "",
        });
        if (data.hasToken) setWisedatToken(data.tokenPreview || "token guardado");
      }
    });
  }, []);

  function setImapField(field, value) {
    setImapCfg(prev => ({ ...prev, [field]: value }));
  }

  async function saveImapCfg() {
    setImapSaveErr("");
    try {
      const r = await fetch("/api/config/imap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imapCfg),
      });
      if (r.ok) {
        setImapSaved(true);
        setTimeout(() => setImapSaved(false), 2500);
        return;
      }
      // DB não configurada — guardar em localStorage como fallback
      if (r.status === 503) {
        localStorage.setItem("nexusops_imap_config", JSON.stringify(imapCfg));
        setImapSaved(true);
        setTimeout(() => setImapSaved(false), 2500);
        return;
      }
      const err = await r.json().catch(() => ({}));
      setImapSaveErr(err.error || `Erro ${r.status}`);
    } catch (err) {
      setImapSaveErr(err.message);
    }
  }

  async function testImapConnection() {
    setImapTesting(true);
    setImapTestMsg("");
    try {
      const r = await fetch("/api/config/imap/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imapCfg),
      });
      const data = await r.json();
      setImapTestMsg(data.ok ? "ok" : `error:${data.error}`);
    } catch (err) {
      setImapTestMsg(`error:${err.message}`);
    } finally {
      setImapTesting(false);
    }
  }

  function setWisedatField(field, value) {
    setWisedatCfg(prev => ({ ...prev, [field]: value }));
  }

  async function testWisedatConnection() {
    setWisedatTesting(true);
    setWisedatResult(null);
    try {
      const r = await fetch("/api/integrations/wisedat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wisedatCfg),
      });
      const data = await r.json();
      setWisedatResult(data);
      if (data.success && data.auth_token) {
        setWisedatToken(`${data.auth_token.slice(0, 20)}…`);
        // Gravar token e config na base de dados
        await fetch("/api/config/wisedat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...wisedatCfg, token: data.auth_token }),
        });
      }
    } catch (err) {
      setWisedatResult({ error: err.message });
    } finally {
      setWisedatTesting(false);
    }
  }

  function toggleInteg(id) {
    setIntegracoes(prev => prev.map(i => i.id === id ? { ...i, on: !i.on } : i));
  }
  function toggleSistema(id) {
    setSistema(prev => prev.map(s => s.id === id ? { ...s, on: !s.on } : s));
  }
  function savePublicUrl() {
    const trimmed = icalUrlInput.trim();
    localStorage.setItem("nexusops_ical_public_url", trimmed);
    setIcalPublicUrl(trimmed);
    setUrlSaved(true);
    setTimeout(() => setUrlSaved(false), 2500);
  }
  function copyPublicUrl() {
    navigator.clipboard?.writeText(icalPublicUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  }
  function downloadIcs() {
    const a = document.createElement("a");
    a.href = "/api/cal/ical?token=demo";
    a.download = "nexusops-calendario.ics";
    a.click();
  }

  return (
    <AppShell activeTab="config">
      {/* Badge de configuração */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            padding: "4px 12px", borderRadius: 20,
            background: COLORS.purpleDim,
            border: `1px solid ${COLORS.purple}40`,
            display: "flex", alignItems: "center", gap: 7,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.purple }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.purple, letterSpacing: "0.04em" }}>
              ADMINISTRAÇÃO
            </span>
          </div>
          <span style={{ fontSize: 13, color: COLORS.textMuted }}>Configurações do sistema</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: COLORS.textDim }}>
          <StatusDot color={COLORS.green} />
          Sistema operacional
        </div>
      </div>

      {/* 1. KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <KPICard title="Utilizadores ativos" value={String(userList.filter(u => u.active).length)} delay={0}   />
        <KPICard title="Integrações ativas"  value={String(integracoes.filter(i => i.on).length)} delay={60}  />
        <KPICard title="Último backup"       value="Hoje 03:00" delay={120} />
      </div>

      {/* 2. Grid 2 colunas — Utilizadores + Integrações */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Gestão de utilizadores */}
        <Card delay={180}>
          <SectionHeader title="Gestão de utilizadores" badge={`${userList.filter(u => u.active).length} ativos`} badgeColor={COLORS.green} />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {userList.map(user => (
                <tr key={user.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "10px 0", paddingRight: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: roleBadgeColor[user.role] + "30",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 600, color: roleBadgeColor[user.role],
                      }}>{user.initials}</div>
                      <div>
                        <div style={{ fontSize: 13 }}>{user.name}</div>
                        <div style={{ fontSize: 11, color: COLORS.textDim }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "10px 0", paddingRight: 12 }}>
                    <Badge color={roleBadgeColor[user.role]}>{roleLabel[user.role] || user.role}</Badge>
                  </td>
                  <td style={{ padding: "10px 0" }}>
                    <div
                      onClick={() => toggleUserActive(user)}
                      style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                      title={user.active ? "Clique para desactivar" : "Clique para activar"}
                    >
                      <StatusDot color={user.active ? COLORS.green : COLORS.textDim} />
                      <span style={{ fontSize: 12, color: user.active ? COLORS.green : COLORS.textMuted }}>
                        {user.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={() => setUserModal(true)}
            style={{
              marginTop: 14, width: "100%", padding: "8px 0",
              fontSize: 13, fontWeight: 500, color: COLORS.purple,
              background: COLORS.purpleDim, border: `1px solid ${COLORS.purple}30`,
              borderRadius: 8, cursor: "pointer", transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = COLORS.purple + "25"}
            onMouseLeave={e => e.currentTarget.style.background = COLORS.purpleDim}
          >
            + Adicionar utilizador
          </button>
        </Card>

        {/* Modal novo utilizador */}
        {userModal && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }} onClick={e => { if (e.target === e.currentTarget) { setUserModal(false); setUserErr(""); } }}>
            <div style={{
              background: COLORS.surface, border: `1px solid ${COLORS.border}`,
              borderRadius: 16, padding: 28, width: 400, maxWidth: "90vw",
            }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Novo utilizador</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>Nome completo</label>
                  <input type="text" placeholder="João Silva" value={novoUser.name}
                    onChange={e => setNovoUser(p => ({ ...p, name: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", fontSize: 13, background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = COLORS.purple} onBlur={e => e.target.style.borderColor = COLORS.border}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>Email</label>
                  <input type="email" placeholder="joao@empresa.pt" value={novoUser.email}
                    onChange={e => setNovoUser(p => ({ ...p, email: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", fontSize: 13, fontFamily: mono, background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = COLORS.purple} onBlur={e => e.target.style.borderColor = COLORS.border}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>Password</label>
                  <input type="password" placeholder="••••••••" value={novoUser.password}
                    onChange={e => setNovoUser(p => ({ ...p, password: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", fontSize: 13, fontFamily: mono, background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = COLORS.purple} onBlur={e => e.target.style.borderColor = COLORS.border}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>Perfil</label>
                  <select value={novoUser.role} onChange={e => setNovoUser(p => ({ ...p, role: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", fontSize: 13, background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, outline: "none", boxSizing: "border-box" }}>
                    <option value="logistica">Logística</option>
                    <option value="gestor">Gestão</option>
                    <option value="admin">Administração</option>
                  </select>
                </div>
                {/* Secção IMAP pessoal — opcional */}
                <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 14 }}>
                  <button onClick={() => setUserImapOpen(o => !o)}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: userImapOpen ? 14 : 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted }}>Email pessoal (opcional)</span>
                    <span style={{ fontSize: 14, color: COLORS.textDim, transform: userImapOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>⌄</span>
                  </button>
                  {userImapOpen && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: COLORS.textMuted, marginBottom: 5 }}>Host IMAP</label>
                          <input type="text" placeholder="mail.empresa.pt" value={novoUser.imap_host}
                            onChange={e => setNovoUser(p => ({ ...p, imap_host: e.target.value }))}
                            style={{ width: "100%", padding: "8px 10px", fontSize: 12, fontFamily: mono, background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, outline: "none", boxSizing: "border-box" }}
                            onFocus={e => e.target.style.borderColor = COLORS.amber} onBlur={e => e.target.style.borderColor = COLORS.border}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 11, color: COLORS.textMuted, marginBottom: 5 }}>Porta</label>
                          <input type="text" placeholder="993" value={novoUser.imap_port}
                            onChange={e => setNovoUser(p => ({ ...p, imap_port: e.target.value }))}
                            style={{ width: "100%", padding: "8px 10px", fontSize: 12, fontFamily: mono, background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, outline: "none", boxSizing: "border-box" }}
                            onFocus={e => e.target.style.borderColor = COLORS.amber} onBlur={e => e.target.style.borderColor = COLORS.border}
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, color: COLORS.textMuted, marginBottom: 5 }}>Utilizador email</label>
                        <input type="email" placeholder="operador@empresa.pt" value={novoUser.imap_user}
                          onChange={e => setNovoUser(p => ({ ...p, imap_user: e.target.value }))}
                          style={{ width: "100%", padding: "8px 10px", fontSize: 12, fontFamily: mono, background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, outline: "none", boxSizing: "border-box" }}
                          onFocus={e => e.target.style.borderColor = COLORS.amber} onBlur={e => e.target.style.borderColor = COLORS.border}
                        />
                      </div>
                      <div style={{ position: "relative" }}>
                        <label style={{ display: "block", fontSize: 11, color: COLORS.textMuted, marginBottom: 5 }}>Password email</label>
                        <input type={showUserImapPass ? "text" : "password"} placeholder="••••••••" value={novoUser.imap_password}
                          onChange={e => setNovoUser(p => ({ ...p, imap_password: e.target.value }))}
                          style={{ width: "100%", padding: "8px 46px 8px 10px", fontSize: 12, fontFamily: mono, background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, outline: "none", boxSizing: "border-box" }}
                          onFocus={e => e.target.style.borderColor = COLORS.amber} onBlur={e => e.target.style.borderColor = COLORS.border}
                        />
                        <button onClick={() => setShowUserImapPass(v => !v)}
                          style={{ position: "absolute", right: 8, bottom: 8, background: "none", border: "none", cursor: "pointer", fontSize: 11, color: COLORS.textMuted, padding: 0 }}>
                          {showUserImapPass ? "Ocultar" : "Ver"}
                        </button>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: COLORS.elevated, borderRadius: 8 }}>
                        <span style={{ fontSize: 12, color: COLORS.text }}>TLS / SSL</span>
                        <Toggle on={novoUser.imap_tls} onChange={v => setNovoUser(p => ({ ...p, imap_tls: v }))} />
                      </div>
                    </div>
                  )}
                </div>

                {userErr && <div style={{ fontSize: 12, color: COLORS.coral }}>✗ {userErr}</div>}
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button onClick={() => { setUserModal(false); setUserErr(""); setUserImapOpen(false); }}
                    style={{ flex: 1, padding: "9px 0", fontSize: 13, color: COLORS.textMuted, background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, cursor: "pointer" }}>
                    Cancelar
                  </button>
                  <button onClick={criarUser} disabled={userSaving || !novoUser.name || !novoUser.email || !novoUser.password}
                    style={{ flex: 2, padding: "9px 0", fontSize: 13, fontWeight: 600, color: COLORS.bg, background: userSaving ? COLORS.textDim : COLORS.purple, border: "none", borderRadius: 8, cursor: userSaving ? "not-allowed" : "pointer" }}>
                    {userSaving ? "A criar…" : "Criar utilizador"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Integrações */}
        <Card delay={240}>
          <SectionHeader title="Integrações" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {integracoes.map(integ => (
              <div key={integ.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: COLORS.elevated, borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{integ.label}</div>
                  <div style={{ fontSize: 11, color: COLORS.textDim }}>{integ.sub}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, color: integ.on ? COLORS.teal : COLORS.textDim }}>
                    {integ.on ? "ON" : "OFF"}
                  </span>
                  <Toggle on={integ.on} onChange={() => toggleInteg(integ.id)} />
                </div>
              </div>
            ))}
          </div>
          <button
            style={{
              marginTop: 14, width: "100%", padding: "8px 0",
              fontSize: 13, fontWeight: 500, color: COLORS.purple,
              background: COLORS.purpleDim, border: `1px solid ${COLORS.purple}30`,
              borderRadius: 8, cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = COLORS.purple + "25"}
            onMouseLeave={e => e.currentTarget.style.background = COLORS.purpleDim}
          >
            + Nova integração
          </button>
        </Card>
      </div>

      {/* 3. Grid 2 colunas — Perfis + Sistema */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Perfis e permissões */}
        <Card delay={300}>
          <SectionHeader title="Perfis e permissões" />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {PERFIS.map((perfil, i) => (
              <div
                key={perfil.nome}
                style={{
                  padding: "12px 14px",
                  background: i % 2 === 0 ? COLORS.elevated : "transparent",
                  borderRadius: 8,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600 }}>{perfil.nome}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3 }}>{perfil.desc}</div>
              </div>
            ))}
          </div>
          <button
            style={{
              marginTop: 14, width: "100%", padding: "8px 0",
              fontSize: 13, fontWeight: 500, color: COLORS.purple,
              background: COLORS.purpleDim, border: `1px solid ${COLORS.purple}30`,
              borderRadius: 8, cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = COLORS.purple + "25"}
            onMouseLeave={e => e.currentTarget.style.background = COLORS.purpleDim}
          >
            + Criar perfil
          </button>
        </Card>

        {/* Sistema */}
        <Card delay={360}>
          <SectionHeader title="Sistema" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {sistema.map(item => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: COLORS.elevated, borderRadius: 10 }}>
                <span style={{ fontSize: 13 }}>{item.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, color: item.on ? COLORS.teal : COLORS.textDim }}>
                    {item.on ? "ON" : "OFF"}
                  </span>
                  <Toggle on={item.on} onChange={() => toggleSistema(item.id)} />
                </div>
              </div>
            ))}
          </div>
          <button
            style={{
              width: "100%", padding: "8px 0",
              fontSize: 13, fontWeight: 500, color: COLORS.textMuted,
              background: "transparent", border: `1px solid ${COLORS.border}`,
              borderRadius: 8, cursor: "pointer",
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.borderHover; e.currentTarget.style.color = COLORS.text; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.textMuted; }}
          >
            Ver logs de atividade
          </button>
        </Card>
      </div>

      {/* 4. Grid 2 colunas — IMAP + iCal */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16, marginBottom: 16 }}>

        {/* IMAP */}
        <Card delay={420}>
          {/* Header colapsável */}
          <button
            onClick={() => setImapOpen(o => !o)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: imapOpen ? 20 : 0 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.amberDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>✉️</div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>Servidor IMAP</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                  {imapCfg.host ? `${imapCfg.host}:${imapCfg.port}` : "Ligação à caixa de email"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {imapCfg.host && <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.teal }} />}
              <span style={{ fontSize: 18, color: COLORS.textMuted, transform: imapOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s", display: "inline-block" }}>⌄</span>
            </div>
          </button>

          {imapOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>Host IMAP</label>
                <input type="text" placeholder="mail.empresa.pt" value={imapCfg.host} onChange={e => setImapField("host", e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", fontSize: 13, fontFamily: mono, background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = COLORS.amber} onBlur={e => e.target.style.borderColor = COLORS.border}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>Porta</label>
                <input type="number" placeholder="993" value={imapCfg.port} onChange={e => setImapField("port", e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", fontSize: 13, fontFamily: mono, background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = COLORS.amber} onBlur={e => e.target.style.borderColor = COLORS.border}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: COLORS.elevated, borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 13, color: COLORS.text }}>TLS / SSL</div>
                  <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>Recomendado com porta 993</div>
                </div>
                <Toggle on={imapCfg.tls} onChange={v => setImapField("tls", v)} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>Utilizador (email)</label>
                <input type="email" placeholder="operacoes@empresa.pt" value={imapCfg.user} onChange={e => setImapField("user", e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", fontSize: 13, fontFamily: mono, background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = COLORS.amber} onBlur={e => e.target.style.borderColor = COLORS.border}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showImapPass ? "text" : "password"} placeholder="••••••••" value={imapCfg.password} onChange={e => setImapField("password", e.target.value)}
                    style={{ width: "100%", padding: "9px 56px 9px 12px", fontSize: 13, fontFamily: mono, background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = COLORS.amber} onBlur={e => e.target.style.borderColor = COLORS.border}
                  />
                  <button onClick={() => setShowImapPass(v => !v)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: COLORS.textMuted, padding: 0 }}>
                    {showImapPass ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>
              <button onClick={testImapConnection} disabled={imapTesting || !imapCfg.host}
                style={{ padding: "9px 0", fontSize: 13, fontWeight: 500, color: imapTesting ? COLORS.textDim : COLORS.teal, background: COLORS.tealDim, border: `1px solid ${COLORS.teal}30`, borderRadius: 8, cursor: (imapTesting || !imapCfg.host) ? "not-allowed" : "pointer" }}>
                {imapTesting ? "A testar…" : "Testar ligação"}
              </button>
              {imapTestMsg === "ok" && (
                <div style={{ fontSize: 12, color: COLORS.green }}>✓ Ligação IMAP estabelecida com sucesso</div>
              )}
              {imapTestMsg.startsWith("error:") && (
                <div style={{ fontSize: 12, color: COLORS.coral }}>✗ {imapTestMsg.replace("error:", "")}</div>
              )}
              <div style={{ paddingTop: 14, borderTop: `1px solid ${COLORS.border}` }}>
                <button onClick={saveImapCfg}
                  style={{ width: "100%", padding: "9px 0", fontSize: 13, fontWeight: 600, color: COLORS.bg, background: imapSaved ? COLORS.green : COLORS.amber, border: "none", borderRadius: 8, cursor: "pointer", transition: "background 0.2s" }}>
                  {imapSaved ? "✓ Guardado" : "Guardar configuração"}
                </button>
                {imapSaveErr && (
                  <div style={{ fontSize: 12, color: COLORS.coral, marginTop: 8 }}>✗ {imapSaveErr}</div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* iCal */}
        <Card delay={480}>
          {/* Header colapsável */}
          <button
            onClick={() => setIcalOpen(o => !o)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: icalOpen ? 20 : 0 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.blueDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>📅</div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>Sincronização iCal</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                  {icalPublicUrl ? "URL configurado" : "Partilha com clientes de calendário externos"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {icalPublicUrl && <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.green }} />}
              <span style={{ fontSize: 18, color: COLORS.textMuted, transform: icalOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s", display: "inline-block" }}>⌄</span>
            </div>
          </button>

          {icalOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Passo 1 */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>1. Gerar ficheiro</div>
                <button onClick={downloadIcs}
                  style={{ width: "100%", padding: "9px 0", fontSize: 13, fontWeight: 500, color: COLORS.blue, background: COLORS.blueDim, border: `1px solid ${COLORS.blue}30`, borderRadius: 8, cursor: "pointer" }}>
                  Descarregar .ics
                </button>
                <p style={{ fontSize: 11, color: COLORS.textDim, marginTop: 8, lineHeight: 1.6 }}>
                  Faz upload para Google Drive, Dropbox ou servidor web após descarregar.
                </p>
              </div>
              {/* Passo 2 */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>2. URL do ficheiro alojado</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="url" placeholder="https://exemplo.com/nexusops.ics" value={icalUrlInput} onChange={e => setIcalUrlInput(e.target.value)}
                    style={{ flex: 1, padding: "8px 12px", fontSize: 12, fontFamily: mono, background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, outline: "none" }}
                    onFocus={e => e.target.style.borderColor = COLORS.blue} onBlur={e => e.target.style.borderColor = COLORS.border}
                  />
                  <button onClick={savePublicUrl}
                    style={{ padding: "8px 14px", fontSize: 12, fontWeight: 600, color: COLORS.teal, background: COLORS.tealDim, border: `1px solid ${COLORS.teal}30`, borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap" }}>
                    Guardar
                  </button>
                </div>
                {urlSaved && <div style={{ fontSize: 11, color: COLORS.green, marginTop: 6 }}>✓ URL guardado</div>}
              </div>
              {/* Passo 3 */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>3. URL de subscrição</div>
                {icalPublicUrl ? (
                  <div>
                    <div style={{ padding: "10px 12px", background: COLORS.elevated, borderRadius: 8, fontSize: 11, fontFamily: mono, color: COLORS.green, wordBreak: "break-all", lineHeight: 1.6, marginBottom: 8 }}>{icalPublicUrl}</div>
                    <button onClick={copyPublicUrl}
                      style={{ width: "100%", padding: "8px 0", fontSize: 12, fontWeight: 500, color: urlCopied ? COLORS.green : COLORS.text, background: COLORS.elevated, border: `1px solid ${urlCopied ? COLORS.green : COLORS.border}`, borderRadius: 8, cursor: "pointer", transition: "border-color 0.2s, color 0.2s" }}>
                      {urlCopied ? "✓ Copiado" : "Copiar URL"}
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: "10px 12px", background: COLORS.elevated, borderRadius: 8, fontSize: 12, color: COLORS.textMuted, lineHeight: 1.6 }}>
                    Introduz o URL no passo 2 após fazer o upload.
                  </div>
                )}
              </div>
              {/* URL interno */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>URL interno</div>
                <div style={{ padding: "10px 12px", background: COLORS.elevated, borderRadius: 8, fontSize: 11, fontFamily: mono, color: COLORS.blue, wordBreak: "break-all", lineHeight: 1.6, marginBottom: 8 }}>{icalApiUrl}</div>
                <button onClick={() => navigator.clipboard?.writeText(icalApiUrl)}
                  style={{ width: "100%", padding: "7px 0", fontSize: 12, color: COLORS.textMuted, background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, cursor: "pointer" }}>
                  Copiar URL interno
                </button>
                <p style={{ fontSize: 11, color: COLORS.textDim, marginTop: 8, lineHeight: 1.5 }}>Cada operador tem o seu URL pessoal.</p>
              </div>
              <div style={{ paddingTop: 14, borderTop: `1px solid ${COLORS.border}` }}>
                <button style={{ padding: "8px 16px", fontSize: 13, fontWeight: 500, color: COLORS.textMuted, background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, cursor: "pointer" }}>
                  Regenerar token
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
      {/* 5. Wisedat */}
      <Card delay={540}>
        <button
          onClick={() => setWisedatOpen(o => !o)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: wisedatOpen ? 20 : 0 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.purpleDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🔗</div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>Wisedat API</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                {wisedatToken ? "Token ativo — ligação estabelecida" : "Configuração da ligação XML / API"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {wisedatToken && <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.green }} />}
            <span style={{ fontSize: 18, color: COLORS.textMuted, transform: wisedatOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s", display: "inline-block" }}>⌄</span>
          </div>
        </button>

        {wisedatOpen && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>URL da API</label>
                <input
                  type="url" placeholder="https://api.wisedat.com"
                  value={wisedatCfg.url} onChange={e => setWisedatField("url", e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", fontSize: 13, fontFamily: mono, background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = COLORS.purple} onBlur={e => e.target.style.borderColor = COLORS.border}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>API Key</label>
                <input
                  type="text" placeholder="xxxxxxxx-xxxx-xxxx"
                  value={wisedatCfg.apiKey} onChange={e => setWisedatField("apiKey", e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", fontSize: 13, fontFamily: mono, background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = COLORS.purple} onBlur={e => e.target.style.borderColor = COLORS.border}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>Utilizador</label>
                <input
                  type="text" placeholder="utilizador@empresa.pt"
                  value={wisedatCfg.username} onChange={e => setWisedatField("username", e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", fontSize: 13, fontFamily: mono, background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = COLORS.purple} onBlur={e => e.target.style.borderColor = COLORS.border}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showWisedatPass ? "text" : "password"} placeholder="••••••••"
                    value={wisedatCfg.password} onChange={e => setWisedatField("password", e.target.value)}
                    style={{ width: "100%", padding: "9px 56px 9px 12px", fontSize: 13, fontFamily: mono, background: COLORS.elevated, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text, outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.target.style.borderColor = COLORS.purple} onBlur={e => e.target.style.borderColor = COLORS.border}
                  />
                  <button onClick={() => setShowWisedatPass(v => !v)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: COLORS.textMuted, padding: 0 }}>
                    {showWisedatPass ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={testWisedatConnection}
              disabled={wisedatTesting || !wisedatCfg.url || !wisedatCfg.apiKey}
              style={{
                padding: "10px 0", fontSize: 13, fontWeight: 500,
                color: wisedatTesting ? COLORS.textDim : COLORS.purple,
                background: COLORS.purpleDim, border: `1px solid ${COLORS.purple}30`,
                borderRadius: 8, cursor: (wisedatTesting || !wisedatCfg.url || !wisedatCfg.apiKey) ? "not-allowed" : "pointer",
              }}
            >
              {wisedatTesting ? "A ligar ao Wisedat…" : "Testar ligação Wisedat"}
            </button>

            {wisedatResult?.success && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 12, color: COLORS.green }}>✓ Ligação bem sucedida — token recebido e guardado</div>
                <div style={{ padding: "10px 12px", background: COLORS.elevated, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>auth_token</div>
                  <div style={{
                    fontSize: 11, fontFamily: mono, color: COLORS.teal,
                    wordBreak: "break-all", lineHeight: 1.6,
                    maxHeight: 60, overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {wisedatToken}
                  </div>
                </div>
              </div>
            )}

            {wisedatResult?.error && (
              <div style={{ padding: "10px 12px", background: COLORS.coralDim, borderRadius: 8, border: `1px solid ${COLORS.coral}30` }}>
                <div style={{ fontSize: 12, color: COLORS.coral }}>✗ {wisedatResult.error}</div>
              </div>
            )}

            {wisedatToken && !wisedatResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ padding: "10px 12px", background: COLORS.elevated, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 4 }}>Token guardado</div>
                  <div style={{ fontSize: 11, fontFamily: mono, color: COLORS.teal, wordBreak: "break-all", lineHeight: 1.6, maxHeight: 60, overflow: "hidden" }}>
                    {wisedatToken}
                  </div>
                </div>
                <button
                  onClick={() => navigator.clipboard?.writeText(wisedatToken)}
                  style={{ padding: "7px 0", fontSize: 12, color: COLORS.textMuted, background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 8, cursor: "pointer" }}
                >
                  Copiar token
                </button>
              </div>
            )}

            <div style={{ paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
              <p style={{ fontSize: 11, color: COLORS.textDim, lineHeight: 1.6, margin: 0 }}>
                Em produção usa <span style={{ fontFamily: mono, color: COLORS.textMuted }}>.env.local</span> — WISEDAT_URL, WISEDAT_API_KEY, WISEDAT_USER, WISEDAT_PASSWORD.
                O <span style={{ fontFamily: mono, color: COLORS.textMuted }}>auth_token</span> é guardado localmente e renovado automaticamente na próxima ligação.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Atalho para gestão de artigos */}
      <Card style={{ marginTop: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <SectionHeader title="Produtos / CTAB (IEC)" />
            <p style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4, margin: 0 }}>
              Gestão de artigos foi movida para uma página dedicada.
            </p>
          </div>
          <a
            href="/dashboard/artigos"
            style={{
              padding: "8px 16px", fontSize: 13, fontWeight: 500,
              color: COLORS.teal, background: COLORS.tealDim,
              border: `1px solid ${COLORS.teal}40`, borderRadius: 8,
              textDecoration: "none",
            }}
          >Gerir artigos →</a>
        </div>
      </Card>

    </AppShell>
  );
}
