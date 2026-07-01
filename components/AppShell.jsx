"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { COLORS, font, mono } from "../lib/colors";
import { ROLES } from "../lib/roles";
import { useSession } from "../lib/SessionContext";
import { Badge } from "./shared";
import { LogoHeader } from "./Logo";

const TABS_BY_ROLE = {
  logistica: [
    { id: "logistica", label: "Vista geral",  href: "/dashboard/logistica" },
    { id: "calendario", label: "Calendário",  href: "/dashboard/calendario" },
  ],
  gestor: [
    { id: "admin",     label: "Vista geral",  href: "/dashboard/admin" },
    { id: "artigos",   label: "Artigos",      href: "/dashboard/artigos" },
    { id: "calendario", label: "Calendário",  href: "/dashboard/calendario" },
  ],
  admin: [
    { id: "logistica", label: "Logística",    href: "/dashboard/logistica" },
    { id: "admin",     label: "Administração", href: "/dashboard/admin" },
    { id: "artigos",   label: "Artigos",      href: "/dashboard/artigos" },
    { id: "config",    label: "Configuração", href: "/dashboard/config" },
    { id: "calendario", label: "Calendário",  href: "/dashboard/calendario" },
  ],
};

export default function AppShell({ children, activeTab }) {
  const router   = useRouter();
  const user     = useSession();
  const [time, setTime]           = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })
      );
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  const tabs     = TABS_BY_ROLE[user?.role] || TABS_BY_ROLE.admin;
  const roleData = ROLES[user?.role];

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: font }}>
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          height: 56,
          background: COLORS.surface,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        {/* Left: Logo + Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <LogoHeader />

          <nav style={{ display: "flex", gap: 4 }}>
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <a
                  key={tab.id}
                  href={tab.href}
                  style={{
                    padding: "6px 14px",
                    fontSize: 13,
                    fontWeight: 500,
                    color: isActive ? COLORS.text : COLORS.textMuted,
                    background: isActive ? COLORS.elevated : "transparent",
                    borderRadius: 8,
                    transition: "background 0.2s, color 0.2s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = COLORS.surfaceHover;
                      e.currentTarget.style.color = COLORS.text;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = COLORS.textMuted;
                    }
                  }}
                >
                  {tab.label}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Right: Status + Clock + Avatar + Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Badge color={COLORS.green} pulse>
            Operação ativa
          </Badge>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14, fontFamily: mono, fontWeight: 500, color: COLORS.text }}>
              {time}
            </span>
            <span style={{ fontSize: 11, color: COLORS.textDim }}>UTC+1</span>
          </div>

          {/* Avatar com tooltip do nome */}
          <div style={{ position: "relative" }}>
            <div
              title={user?.name || ""}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: roleData?.accent || COLORS.amber,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.bg,
                cursor: "default",
              }}
            >
              {user?.initials || "?"}
            </div>
          </div>

          {/* Botão sair */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sair"
            style={{
              padding: "5px 10px",
              fontSize: 12,
              color: loggingOut ? COLORS.textDim : COLORS.textMuted,
              background: "transparent",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 6,
              cursor: loggingOut ? "not-allowed" : "pointer",
              transition: "color 0.15s, border-color 0.15s",
              fontFamily: font,
            }}
            onMouseEnter={e => {
              if (!loggingOut) {
                e.currentTarget.style.color = COLORS.coral;
                e.currentTarget.style.borderColor = COLORS.coral + "50";
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = COLORS.textMuted;
              e.currentTarget.style.borderColor = COLORS.border;
            }}
          >
            {loggingOut ? "…" : "Sair"}
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
        {children}
      </main>

      {/* Rodapé */}
      <footer style={{
        padding: "12px 24px", maxWidth: 1400, margin: "0 auto",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 10, color: COLORS.textDim, borderTop: `1px solid ${COLORS.border}`,
        marginTop: 24,
      }}>
        <span style={{ fontFamily: mono }}>
          NexusOps v{process.env.NEXT_PUBLIC_APP_VERSION || "?"}
        </span>
        <a
          href="/api/health"
          target="_blank"
          rel="noopener"
          style={{ color: COLORS.textDim, textDecoration: "none", fontFamily: mono }}
          title="Ver estado do sistema"
        >
          /api/health
        </a>
      </footer>
    </div>
  );
}
