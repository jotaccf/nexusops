"use client";

import { COLORS, mono } from "../lib/colors";

export function Badge({ children, color = COLORS.amber, pulse = false }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: color,
        background: color + "18",
        borderRadius: 999,
      }}
    >
      {pulse && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
      )}
      {children}
    </span>
  );
}

export function Card({ children, style = {}, delay = 0 }) {
  return (
    <div
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: 24,
        animation: `fadeSlideUp 0.4s ease ${delay}ms both`,
        transition: "border-color 0.2s, background 0.2s",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = COLORS.borderHover;
        e.currentTarget.style.background = COLORS.surfaceHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = COLORS.border;
        e.currentTarget.style.background = COLORS.surface;
      }}
    >
      {children}
    </div>
  );
}

export function SectionHeader({ title, subtitle, badge, badgeColor }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
      }}
    >
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
            {subtitle}
          </p>
        )}
      </div>
      {badge && <Badge color={badgeColor}>{badge}</Badge>}
    </div>
  );
}

export function KPICard({ title, value, delta, icon, delay = 0 }) {
  const deltaColor = delta && delta.startsWith("+") ? COLORS.green : COLORS.coral;
  return (
    <div
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: 20,
        animation: `fadeSlideUp 0.4s ease ${delay}ms both`,
        transition: "border-color 0.2s, background 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = COLORS.borderHover;
        e.currentTarget.style.background = COLORS.surfaceHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = COLORS.border;
        e.currentTarget.style.background = COLORS.surface;
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 12, color: COLORS.textMuted }}>{title}</span>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 700,
          fontFamily: mono,
          color: COLORS.text,
          marginTop: 8,
        }}
      >
        {value}
      </div>
      {delta && (
        <span
          style={{
            fontSize: 12,
            fontFamily: mono,
            fontWeight: 500,
            color: deltaColor,
            marginTop: 4,
            display: "inline-block",
          }}
        >
          {delta}
        </span>
      )}
    </div>
  );
}

export function StatusDot({ color }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

export function MiniBar({ value, max = 100, color = COLORS.teal }) {
  return (
    <div
      style={{
        width: "100%",
        height: 6,
        background: COLORS.elevated,
        borderRadius: 3,
        overflow: "hidden",
        marginTop: 6,
      }}
    >
      <div
        style={{
          width: `${(value / max) * 100}%`,
          height: "100%",
          background: color,
          borderRadius: 3,
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}

export function MetricTile({ label, value, color = COLORS.text }) {
  return (
    <div
      style={{
        background: COLORS.elevated,
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          fontFamily: mono,
          color: color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function AlertBanner({ text, severity = "medium" }) {
  const color = severity === "high" ? COLORS.coral : COLORS.amber;
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        background: color + "14",
        border: `1px solid ${color}30`,
        color: color,
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      {severity === "high" ? "●" : "◐"} {text}
    </div>
  );
}

export function ActionButton({ label, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "10px 14px",
        fontSize: 13,
        fontWeight: 500,
        color: COLORS.text,
        background: "transparent",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
        transition: "background 0.2s, border-color 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = COLORS.surfaceHover;
        e.currentTarget.style.borderColor = COLORS.borderHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = COLORS.border;
      }}
    >
      <span style={{ fontSize: 15 }}>{icon}</span>
      {label}
    </button>
  );
}
