"use client";

import { useState, useEffect } from "react";
import AppShell from "../../../components/AppShell";
import {
  Badge, Card, SectionHeader, KPICard, StatusDot,
  MiniBar, AlertBanner, ActionButton
} from "../../../components/shared";
import { COLORS, mono } from "../../../lib/colors";
import { ORDERS, ALERTS, STOCK_CRITICO } from "../../../lib/mockData";
import MailWidget from "../../../components/MailWidget";
import TasksWidget from "../../../components/TasksWidget";

const estadoDot = {
  "Em picking":       COLORS.amber,
  "Pendente stock":   COLORS.coral,
  "Pronta a expedir": COLORS.green,
  "A validar":        COLORS.blue,
};

const prioridadeBadge = {
  "Alta":  COLORS.coral,
  "Média": COLORS.amber,
  "Baixa": COLORS.textMuted,
};

const severityIcon  = { high: "●", medium: "◐", low: "○" };
const severityColor = { high: COLORS.coral, medium: COLORS.amber, low: COLORS.textMuted };

export default function DashboardLogistica() {
  const [orders, setOrders]     = useState(ORDERS);
  const [alerts, setAlerts]     = useState(ALERTS);
  const [stock, setStock]       = useState(STOCK_CRITICO);

  useEffect(() => {
    fetch("/api/orders").then(r => r.ok ? r.json() : null).then(d => d && setOrders(d));
    fetch("/api/alerts").then(r => r.ok ? r.json() : null).then(d => d && setAlerts(d));
    fetch("/api/alerts?type=stock").then(r => r.ok ? r.json() : null).then(d => d && setStock(d));
  }, []);

  return (
    <AppShell activeTab="logistica">
      {/* 1. KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <KPICard title="Receções em curso"    value="7"  delay={0}   />
        <KPICard title="Rotulagem pendente"   value="4"  delay={60}  />
        <KPICard title="Picking ativos"       value={String(orders.filter(o => o.estado === "Em picking").length)} delay={120} />
        <KPICard title="Expedições pendentes" value="22" delay={180} />
      </div>

      {/* 2. Pipeline operacional */}
      <Card style={{ marginBottom: 24, padding: 20 }} delay={240}>
        <SectionHeader title="Pipeline operacional" badge="Live" badgeColor={COLORS.green} />
        <div style={{ display: "flex", width: "100%", overflow: "hidden", borderRadius: 10 }}>
          {[
            { label: "Receção",   count: 7,   color: COLORS.blue  },
            { label: "Rotulagem", count: 4,   color: COLORS.amber },
            { label: "Em stock",  count: 312, color: COLORS.teal  },
            { label: "Picking",   count: orders.filter(o => o.estado === "Em picking").length, color: COLORS.amber },
            { label: "Expedição", count: 22,  color: COLORS.green },
          ].map((stage, i, arr) => (
            <div
              key={stage.label}
              style={{
                flex: 1, padding: "14px 16px",
                background: stage.color + "1F",
                border: `1px solid ${stage.color}4D`,
                borderLeft: i === 0 ? undefined : "none",
                borderRadius: i === 0 ? "10px 0 0 10px" : i === arr.length - 1 ? "0 10px 10px 0" : 0,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: mono, color: stage.color }}>{stage.count}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{stage.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. Grid 2fr + 1fr — Picking + Alertas */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }}>
        <Card delay={300}>
          <SectionHeader title="Ordens de picking" />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Encomenda", "Cliente", "Estado", "Prioridade", "Parceiro"].map(col => (
                  <th key={col} style={{ textAlign: "left", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: COLORS.textDim, paddingBottom: 10, borderBottom: `1px solid ${COLORS.border}` }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={{ borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "10px 0", paddingRight: 12, fontSize: 12, fontFamily: mono, color: COLORS.amber }}>{order.id}</td>
                  <td style={{ padding: "10px 0", paddingRight: 12, fontSize: 13 }}>{order.cliente}</td>
                  <td style={{ padding: "10px 0", paddingRight: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <StatusDot color={estadoDot[order.estado] || COLORS.textMuted} />
                      <span style={{ fontSize: 12, color: COLORS.textMuted }}>{order.estado}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 0", paddingRight: 12 }}>
                    <Badge color={prioridadeBadge[order.prioridade] || COLORS.textMuted}>{order.prioridade}</Badge>
                  </td>
                  <td style={{ padding: "10px 0", fontSize: 12, color: COLORS.textMuted }}>{order.parceiro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card delay={360}>
          <SectionHeader title="Alertas armazém" badge={`${alerts.length} ativos`} badgeColor={COLORS.coral} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {alerts.map((alert, i) => (
              <div key={i} style={{ padding: "10px 14px", borderLeft: `3px solid ${severityColor[alert.severity]}`, background: COLORS.elevated, fontSize: 13, color: severityColor[alert.severity], display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, fontSize: 10, marginTop: 2 }}>{severityIcon[alert.severity]}</span>
                {alert.text}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 4. Grid 3 colunas — Ações + Stock + Email */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <Card delay={420}>
          <SectionHeader title="Ações rápidas" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <ActionButton label="Registar receção"    icon="↓" />
            <ActionButton label="Criar ordem picking" icon="+" />
            <ActionButton label="Marcar expedido"     icon="✓" />
            <ActionButton label="Reportar incidência" icon="!" />
          </div>
        </Card>

        <Card delay={480}>
          <SectionHeader title="Stock crítico" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {stock.map(item => {
              const cor = item.nivel === "danger" ? COLORS.coral : COLORS.amber;
              return (
                <div key={item.sku} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: COLORS.elevated, borderRadius: 8 }}>
                  <span style={{ fontSize: 13, fontFamily: mono, fontWeight: 500, color: COLORS.text }}>{item.sku}</span>
                  <span style={{ fontSize: 14, fontFamily: mono, fontWeight: 700, color: cor }}>{item.quantidade}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card delay={540}>
          <MailWidget compact maxEmails={3} />
        </Card>
      </div>

      {/* 5. TasksWidget */}
      <Card delay={600}>
        <TasksWidget role="logistica" max={3} />
      </Card>
    </AppShell>
  );
}
