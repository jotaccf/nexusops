"use client";

import { useState, useEffect } from "react";
import AppShell from "../../../components/AppShell";
import {
  Badge, Card, SectionHeader, KPICard, StatusDot,
  MiniBar, MetricTile, AlertBanner, ActionButton
} from "../../../components/shared";
import { COLORS, mono } from "../../../lib/colors";
import { LEADS, PARTNERS, ORDERS } from "../../../lib/mockData";
import MailWidget from "../../../components/MailWidget";
import TasksWidget from "../../../components/TasksWidget";

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
    </AppShell>
  );
}
