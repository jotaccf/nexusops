"use client";

export function LogoIcon({ size = 48 }) {
  return (
    <svg width={size} height={size * 1.08} viewBox="0 0 48 52" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nexus-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E4A853"/>
          <stop offset="100%" stopColor="#3FBFA0"/>
        </linearGradient>
      </defs>
      <polygon points="24,2 46,14 46,38 24,50 2,38 2,14"
        fill="none" stroke="url(#nexus-g)" strokeWidth="2.5"/>
      <polygon points="24,12 38,20 38,34 24,42 10,34 10,20"
        fill="url(#nexus-g)" opacity="0.15"/>
      <circle cx="24" cy="26" r="4.5" fill="url(#nexus-g)"/>
      <line x1="24" y1="21.5" x2="24" y2="12"
        stroke="#E4A853" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="28" y1="28.5" x2="37" y2="34"
        stroke="#3FBFA0" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="20" y1="28.5" x2="11" y2="34"
        stroke="#E4A853" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function LogoFull({ dark = true }) {
  const textColor = dark ? "#E8E6E1" : "#1C222A";
  const mutedColor = dark ? "#8B8A85" : "#5C5B57";
  const dimColor = dark ? "#5C5B57" : "#8B8A85";
  const lineColor = dark ? "#E4A853" : "#BA7517";

  return (
    <svg viewBox="0 0 220 52" xmlns="http://www.w3.org/2000/svg" style={{ height: 40 }}>
      <defs>
        <linearGradient id="ng-full" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E4A853"/>
          <stop offset="100%" stopColor="#3FBFA0"/>
        </linearGradient>
      </defs>
      <polygon points="24,2 46,14 46,38 24,50 2,38 2,14"
        fill="none" stroke="url(#ng-full)" strokeWidth="2.5"/>
      <polygon points="24,12 38,20 38,34 24,42 10,34 10,20"
        fill="url(#ng-full)" opacity="0.15"/>
      <circle cx="24" cy="26" r="4.5" fill="url(#ng-full)"/>
      <line x1="24" y1="21.5" x2="24" y2="12"
        stroke="#E4A853" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="28" y1="28.5" x2="37" y2="34"
        stroke="#3FBFA0" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="20" y1="28.5" x2="11" y2="34"
        stroke="#E4A853" strokeWidth="1.5" strokeLinecap="round"/>
      <text x="58" y="23" fill={textColor}
        fontFamily="'DM Sans',sans-serif" fontSize="20"
        fontWeight="600" letterSpacing="-0.5">NEXUS</text>
      <text x="132" y="23" fill={mutedColor}
        fontFamily="'JetBrains Mono',monospace" fontSize="14"
        fontWeight="500">OPS</text>
      <line x1="58" y1="34" x2="160" y2="34"
        stroke={lineColor} strokeWidth="0.5" opacity="0.3"/>
      <text x="58" y="46" fill={dimColor}
        fontFamily="'DM Sans',sans-serif" fontSize="10"
        fontWeight="400" letterSpacing="2">HUB OPERACIONAL</text>
    </svg>
  );
}

export function LogoHeader() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <LogoIcon size={32} />
      <div>
        <span style={{
          fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em",
          color: "#E8E6E1", fontFamily: "'DM Sans', sans-serif"
        }}>NexusOps</span>
        <span style={{
          fontSize: 11, color: "#5C5B57", marginLeft: 10,
          fontFamily: "'DM Sans', sans-serif"
        }}>Master Importer</span>
      </div>
    </div>
  );
}
