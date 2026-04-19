"use client";

import { useState, useEffect, useCallback } from "react";
import { COLORS, mono } from "../lib/colors";
import { SectionHeader } from "./shared";

function formatRelTime(dateStr) {
  const date = new Date(dateStr);
  const diff = Math.floor((Date.now() - date) / 60000);
  if (diff < 1)  return "agora";
  if (diff < 60) return `${diff}m atrás`;
  const h = Math.floor(diff / 60);
  if (h < 24)    return `${h}h atrás`;
  const d = Math.floor(h / 24);
  if (d < 7)     return `${d}d atrás`;
  const day = String(date.getDate()).padStart(2, "0");
  const mon = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return year === new Date().getFullYear() ? `${day}/${mon}` : `${day}/${mon}/${year}`;
}

function EmailList({ emails, compact }) {
  if (emails.length === 0) {
    return <div style={{ fontSize: 13, color: COLORS.textMuted }}>Sem emails não lidos.</div>;
  }
  return (
    <div style={!compact
      ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }
      : { display: "flex", flexDirection: "column", gap: 6 }
    }>
      {emails.map(email => (
        <div
          key={email.id}
          style={{ padding: "10px 12px", background: COLORS.elevated, borderRadius: 10, border: `1px solid ${COLORS.border}`, cursor: "pointer", transition: "border-color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.borderHover}
          onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.text, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {email.from}
            </span>
            <span style={{ fontSize: 11, fontFamily: mono, color: COLORS.textDim, flexShrink: 0 }}>
              {formatRelTime(email.date)}
            </span>
          </div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {email.subject}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MailWidget({ compact = false, maxEmails }) {
  const limit = maxEmails ?? (compact ? 3 : 6);

  const [tab, setTab]               = useState("global");
  const [globalData, setGlobalData] = useState(null);
  const [personalData, setPersonalData] = useState(null);
  const [globalLoading, setGlobalLoading]     = useState(true);
  const [personalLoading, setPersonalLoading] = useState(true);
  const [hasPersonal, setHasPersonal] = useState(false);

  const fetchGlobal = useCallback(async () => {
    try {
      const res  = await fetch("/api/mail");
      const json = await res.json();
      setGlobalData(json);
    } catch {
      setGlobalData({ unread: 0, emails: [], demo: true });
    } finally {
      setGlobalLoading(false);
    }
  }, []);

  const fetchPersonal = useCallback(async () => {
    try {
      const res  = await fetch("/api/mail?source=personal");
      const json = await res.json();
      if (json.configured === false) {
        setHasPersonal(false);
      } else {
        setHasPersonal(true);
        setPersonalData(json);
      }
    } catch {
      setHasPersonal(false);
    } finally {
      setPersonalLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGlobal();
    fetchPersonal();
    const interval = setInterval(() => { fetchGlobal(); fetchPersonal(); }, 60000);
    return () => clearInterval(interval);
  }, [fetchGlobal, fetchPersonal]);

  const activeData    = tab === "personal" ? personalData : globalData;
  const activeLoading = tab === "personal" ? personalLoading : globalLoading;
  const emails        = (activeData?.emails || []).slice(0, limit);
  const unread        = activeData?.unread ?? 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <SectionHeader
          title="Caixa de entrada"
          badge={activeLoading ? "…" : `${unread} não lidos`}
          badgeColor={COLORS.blue}
        />
        {hasPersonal && (
          <div style={{ display: "flex", gap: 4 }}>
            {["global", "personal"].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "4px 10px", fontSize: 11, borderRadius: 6, cursor: "pointer",
                  background: tab === t ? COLORS.blue : "transparent",
                  color:      tab === t ? "#fff" : COLORS.textMuted,
                  border:     `1px solid ${tab === t ? COLORS.blue : COLORS.border}`,
                  transition: "all 0.15s",
                }}
              >
                {t === "global" ? "Global" : "Pessoal"}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeData?.demo && (
        <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 10 }}>
          Modo demo — IMAP não configurado
        </div>
      )}

      {activeLoading ? (
        <div style={{ fontSize: 13, color: COLORS.textMuted }}>A carregar…</div>
      ) : (
        <EmailList emails={emails} compact={compact} />
      )}

      {!compact && (
        <button
          onClick={() => { fetchGlobal(); fetchPersonal(); }}
          style={{
            marginTop: 12, width: "100%", padding: "8px 0",
            fontSize: 12, color: COLORS.textMuted,
            background: "transparent", border: `1px solid ${COLORS.border}`,
            borderRadius: 8, cursor: "pointer", transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.borderHover; e.currentTarget.style.color = COLORS.text; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.textMuted; }}
        >
          Atualizar
        </button>
      )}
    </div>
  );
}
