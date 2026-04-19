"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COLORS, font, mono } from "../../lib/colors";
import { LogoFull } from "../../components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const { redirectTo } = await res.json();
        router.replace(redirectTo || "/");
      } else {
        const { error: msg } = await res.json();
        setError(msg || "Credenciais inválidas");
      }
    } catch {
      setError("Erro de ligação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        fontFamily: font,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
          <LogoFull />
        </div>

        {/* Card */}
        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 16,
            padding: 32,
          }}
        >
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: COLORS.text,
              marginBottom: 6,
            }}
          >
            Entrar
          </h1>
          <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 28 }}>
            Acesso ao hub operacional
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{ display: "block", fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="utilizador@empresa.pt"
                required
                autoFocus
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: 14,
                  color: COLORS.text,
                  background: COLORS.elevated,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: font,
                }}
                onFocus={e => e.target.style.borderColor = COLORS.blue}
                onBlur={e => e.target.style.borderColor = COLORS.border}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{ display: "block", fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: 14,
                  color: COLORS.text,
                  background: COLORS.elevated,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: font,
                }}
                onFocus={e => e.target.style.borderColor = COLORS.blue}
                onBlur={e => e.target.style.borderColor = COLORS.border}
              />
            </div>

            {/* Erro */}
            {error && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "10px 12px",
                  background: COLORS.coralDim,
                  border: `1px solid ${COLORS.coral}30`,
                  borderRadius: 8,
                  fontSize: 13,
                  color: COLORS.coral,
                }}
              >
                {error}
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px 0",
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.bg,
                background: loading ? COLORS.textDim : COLORS.blue,
                border: "none",
                borderRadius: 8,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.15s",
                fontFamily: font,
              }}
            >
              {loading ? "A entrar…" : "Entrar"}
            </button>
          </form>
        </div>

        {/* Credenciais demo */}
        <div
          style={{
            marginTop: 24,
            padding: "16px 20px",
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
          }}
        >
          <p style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Credenciais demo
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { email: "ana@empresa.pt",    role: "Configuração" },
              { email: "carlos@empresa.pt", role: "Logística"    },
              { email: "pedro@empresa.pt",  role: "Admin — inativo" },
            ].map(u => (
              <div key={u.email} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontFamily: mono, color: COLORS.textMuted }}>{u.email}</span>
                <span style={{ fontSize: 11, color: COLORS.textDim }}>{u.role}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: COLORS.textDim, marginTop: 10 }}>
            Password: <span style={{ fontFamily: mono, color: COLORS.textMuted }}>nexus2026</span>
          </p>
        </div>
      </div>
    </div>
  );
}
