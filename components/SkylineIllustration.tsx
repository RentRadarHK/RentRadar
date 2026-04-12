"use client";

import { useEffect, useRef } from "react";

const G = "#555555";
const LIT = "#E4F0EB";
const GROUND = 295;
// Reflection: 40% height, positioned at ground line
const REFL_TX = `translate(0, ${1.40 * GROUND}) scale(1, -0.40)`;

// Generate lit window grid for a building rect
function makeWins(
  bx: number, by: number, bw: number, bh: number, bid: number, pad = 7
): Array<{ x: number; y: number; delay: number }> {
  const WW = 4, WH = 3, GX = 11, GY = 9;
  const lit: Array<{ x: number; y: number; delay: number }> = [];
  let row = 0;
  for (let cy = by + pad; cy + WH <= by + bh - pad; cy += GY, row++) {
    let col = 0;
    for (let cx = bx + pad; cx + WW <= bx + bw - pad; cx += GX, col++) {
      if ((row * 7 + col * 3 + bid * 13) % 5 === 0) {
        const scatter = ((row * 3 + col * 7) % 24) * 35;
        lit.push({ x: cx, y: cy, delay: 900 + bid * 75 + scatter });
      }
    }
  }
  return lit;
}

function DarkWindows({ bx, by, bw, bh, pad = 7 }: {
  bx: number; by: number; bw: number; bh: number; pad?: number;
}) {
  const WW = 4, WH = 3, GX = 11, GY = 9;
  const rects: React.ReactElement[] = [];
  let row = 0, key = 0;
  for (let cy = by + pad; cy + WH <= by + bh - pad; cy += GY, row++) {
    let col = 0;
    for (let cx = bx + pad; cx + WW <= bx + bw - pad; cx += GX, col++, key++) {
      if ((row * 7 + col * 3) % 5 !== 0) {
        rects.push(<rect key={key} x={cx} y={cy} width={WW} height={WH} fill={G} opacity={0.09} />);
      }
    }
  }
  return <>{rects}</>;
}

function LitWindows({ wins }: { wins: Array<{ x: number; y: number; delay: number }> }) {
  return (
    <>
      {wins.map((w, i) => (
        <rect key={i} x={w.x} y={w.y} width={4} height={3}
          fill={LIT} className="rr-win" style={{ animationDelay: `${w.delay}ms` }} />
      ))}
    </>
  );
}

export default function SkylineIllustration() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onScroll = () => { el.style.transform = `translateY(${-window.scrollY * 0.05}px)`; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 12 buildings — back(0), mid(1-4), front(5-11)
  const wins = [
    // ── Mid layer ──
    makeWins(4,   232, 52,  35,  0),   // b0 far-left tower
    makeWins(558, 232, 32,  30,  1),   // b1 far-right step
    makeWins(511, 192, 44, 103,  2),   // b2 medium slab
    makeWins(462, 152, 40, 118,  3),   // b3 medium-tall main
    // ── Front layer ──
    makeWins(76,  140, 34, 117,  4),   // b4 slim HK residential main
    makeWins(80,  122, 26,  18,  4, 4),// b4 top cap
    makeWins(124, 200, 50,  68,  5),   // b5 stepped main
    makeWins(130, 180, 38,  20,  5, 4),// b5 upper setback
    makeWins(184, 148, 54, 130,  6),   // b6 tall mixed-use
    makeWins(250, 88,  60, 190,  7),   // b7 tall FLOAT A
    makeWins(322, 48,  66, 230,  8),   // b8 tallest FLOAT B
    makeWins(400, 88,  56, 190,  9),   // b9 tall right FLOAT C
  ];

  return (
    <div ref={wrapRef} className="w-full h-full" style={{ willChange: "transform" }}>
      <style>{`
        @keyframes rr-rise {
          from { transform: translateY(52px); opacity: 0; }
          to   { transform: translateY(0px);  opacity: 1; }
        }
        @keyframes rr-win-fade {
          from { opacity: 0; }
          to   { opacity: 0.55; }
        }
        @keyframes rr-float-a {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-3.5px); }
        }
        @keyframes rr-float-b {
          0%, 100% { transform: translateY(-1px); }
          50%      { transform: translateY(2.5px); }
        }
        @keyframes rr-float-c {
          0%, 100% { transform: translateY(-2px); }
          50%      { transform: translateY(1.8px); }
        }
        .rr-b0  { animation: rr-rise 0.9s cubic-bezier(0.16,1,0.3,1)   0ms both; }
        .rr-b1  { animation: rr-rise 0.9s cubic-bezier(0.16,1,0.3,1)  70ms both; }
        .rr-b2  { animation: rr-rise 0.9s cubic-bezier(0.16,1,0.3,1) 140ms both; }
        .rr-b3  { animation: rr-rise 0.9s cubic-bezier(0.16,1,0.3,1) 210ms both; }
        .rr-b4  { animation: rr-rise 0.9s cubic-bezier(0.16,1,0.3,1) 280ms both; }
        .rr-b5  { animation: rr-rise 0.9s cubic-bezier(0.16,1,0.3,1) 350ms both; }
        .rr-b6  { animation: rr-rise 0.9s cubic-bezier(0.16,1,0.3,1) 420ms both; }
        .rr-b7  { animation: rr-rise 0.9s cubic-bezier(0.16,1,0.3,1) 490ms both; }
        .rr-b8  { animation: rr-rise 0.9s cubic-bezier(0.16,1,0.3,1) 560ms both; }
        .rr-b9  { animation: rr-rise 0.9s cubic-bezier(0.16,1,0.3,1) 630ms both; }
        .rr-b10 { animation: rr-rise 0.9s cubic-bezier(0.16,1,0.3,1) 700ms both; }
        .rr-b11 { animation: rr-rise 0.9s cubic-bezier(0.16,1,0.3,1) 770ms both; }
        .rr-fa  { animation: rr-float-a 4.2s ease-in-out 1.6s infinite; }
        .rr-fb  { animation: rr-float-b 4.8s ease-in-out 1.9s infinite; }
        .rr-fc  { animation: rr-float-c 3.9s ease-in-out 1.7s infinite; }
        .rr-win {
          animation-name: rr-win-fade;
          animation-duration: 0.5s;
          animation-timing-function: ease;
          animation-fill-mode: both;
        }
      `}</style>

      <svg viewBox="0 0 600 360" fill="none" xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full" aria-hidden="true">
        <defs>
          <clipPath id="rr-refl-clip">
            <rect x="0" y={GROUND} width="600" height={360 - GROUND} />
          </clipPath>
        </defs>

        {/* ── Back atmosphere (depth 0.05–0.06) ── */}
        <g fill={G} opacity="0.05">
          <rect x="48"  y="212" width="95" height="83" />
          <rect x="256" y="185" width="82" height="110" />
          <rect x="430" y="205" width="88" height="90" />
        </g>

        {/* ── Water reflection ── */}
        <g clipPath="url(#rr-refl-clip)">
          <g transform={REFL_TX} opacity="0.06" fill={G}>
            <rect x="0"   y="267" width="58"  height="28" />
            <rect x="4"   y="232" width="52"  height="35" />
            <rect x="70"  y="268" width="48"  height="27" />
            <rect x="74"  y="140" width="34"  height="128"/>
            <rect x="80"  y="122" width="26"  height="18" />
            <rect x="120" y="265" width="58"  height="30" />
            <rect x="124" y="200" width="50"  height="65" />
            <rect x="130" y="180" width="38"  height="20" />
            <rect x="133" y="160" width="30"  height="20" />
            <rect x="138" y="146" width="22"  height="14" />
            <rect x="180" y="278" width="62"  height="17" />
            <rect x="184" y="148" width="54"  height="130"/>
            <rect x="190" y="128" width="42"  height="20" />
            <rect x="246" y="278" width="68"  height="17" />
            <rect x="250" y="88"  width="60"  height="190"/>
            <rect x="256" y="68"  width="48"  height="20" />
            <rect x="318" y="278" width="74"  height="17" />
            <rect x="322" y="48"  width="66"  height="230"/>
            <rect x="329" y="28"  width="52"  height="20" />
            <rect x="336" y="10"  width="38"  height="18" />
            <rect x="396" y="278" width="62"  height="17" />
            <rect x="400" y="88"  width="56"  height="190"/>
            <rect x="406" y="68"  width="44"  height="20" />
            <rect x="458" y="270" width="52"  height="25" />
            <rect x="462" y="152" width="40"  height="118"/>
            <rect x="466" y="135" width="32"  height="17" />
            <rect x="509" y="192" width="44"  height="103"/>
            <rect x="556" y="258" width="44"  height="37" />
            <rect x="558" y="232" width="36"  height="26" />
          </g>
        </g>

        {/* ── Ground line ── */}
        <line x1="0" y1={GROUND} x2="600" y2={GROUND}
          stroke={G} strokeWidth="1" opacity="0.20" />

        {/* ══════════════════════════════════════════
            BACK LAYER buildings (opacity 0.07)
        ══════════════════════════════════════════ */}

        {/* B10 — wide background slab (left cluster) */}
        <g className="rr-b10">
          <rect x="48" y="212" width="95" height="83"
            fill={G} fillOpacity="0.07" stroke={G} strokeOpacity="0.14" strokeWidth="0.5" />
        </g>

        {/* B11 — wide background slab (right cluster) */}
        <g className="rr-b11">
          <rect x="430" y="205" width="88" height="90"
            fill={G} fillOpacity="0.07" stroke={G} strokeOpacity="0.14" strokeWidth="0.5" />
        </g>

        {/* ══════════════════════════════════════════
            MID LAYER buildings (opacity 0.12)
        ══════════════════════════════════════════ */}

        {/* B0 — Far-left stepped podium */}
        <g className="rr-b0">
          <rect x="0"  y="267" width="58" height="28"
            fill={G} fillOpacity="0.09" stroke={G} strokeOpacity="0.22" strokeWidth="0.8" />
          <rect x="4"  y="232" width="52" height="35"
            fill={G} fillOpacity="0.12" stroke={G} strokeOpacity="0.26" strokeWidth="0.8" />
          <DarkWindows bx={4} by={232} bw={52} bh={35} />
          <LitWindows wins={wins[0]} />
        </g>

        {/* B1 — Far-right short step */}
        <g className="rr-b1">
          <rect x="556" y="258" width="44" height="37"
            fill={G} fillOpacity="0.08" stroke={G} strokeOpacity="0.20" strokeWidth="0.8" />
          <rect x="558" y="232" width="36" height="26"
            fill={G} fillOpacity="0.11" stroke={G} strokeOpacity="0.24" strokeWidth="0.8" />
          <DarkWindows bx={558} by={232} bw={36} bh={26} />
          <LitWindows wins={wins[1]} />
        </g>

        {/* B2 — Medium slab */}
        <g className="rr-b2">
          <rect x="511" y="192" width="44" height="103"
            fill={G} fillOpacity="0.11" stroke={G} strokeOpacity="0.24" strokeWidth="0.8" />
          <DarkWindows bx={511} by={192} bw={44} bh={103} />
          <LitWindows wins={wins[2]} />
        </g>

        {/* B3 — Medium-tall with cap */}
        <g className="rr-b3">
          <rect x="458" y="270" width="52" height="25"
            fill={G} fillOpacity="0.08" stroke={G} strokeOpacity="0.20" strokeWidth="0.8" />
          <rect x="462" y="152" width="40" height="118"
            fill={G} fillOpacity="0.12" stroke={G} strokeOpacity="0.26" strokeWidth="0.8" />
          <rect x="466" y="135" width="32" height="17"
            fill={G} fillOpacity="0.13" stroke={G} strokeOpacity="0.26" strokeWidth="0.8" />
          <DarkWindows bx={462} by={152} bw={40} bh={118} />
          <LitWindows wins={wins[3]} />
        </g>

        {/* ══════════════════════════════════════════
            FRONT LAYER buildings (opacity 0.16–0.18)
        ══════════════════════════════════════════ */}

        {/* B4 — Ultra-slim HK residential tower (Kowloon style) */}
        <g className="rr-b4">
          <rect x="70"  y="268" width="48" height="27"
            fill={G} fillOpacity="0.12" stroke={G} strokeOpacity="0.26" strokeWidth="0.8" />
          <rect x="74"  y="140" width="36" height="128"
            fill={G} fillOpacity="0.16" stroke={G} strokeOpacity="0.30" strokeWidth="0.8" />
          <rect x="78"  y="122" width="28" height="18"
            fill={G} fillOpacity="0.17" stroke={G} strokeOpacity="0.32" strokeWidth="0.8" />
          <rect x="82"  y="108" width="20" height="14"
            fill={G} fillOpacity="0.18" stroke={G} strokeOpacity="0.34" strokeWidth="0.8" />
          {/* Slim antenna stub */}
          <line x1="92" y1="88" x2="92" y2="108"
            stroke={G} strokeOpacity="0.38" strokeWidth="1.5" />
          <circle cx="92" cy="88" r="1.8" fill={G} fillOpacity="0.28" />
          <DarkWindows bx={74} by={140} bw={36} bh={128} />
          <LitWindows wins={wins[4]} />
          <DarkWindows bx={78} by={122} bw={28} bh={18} pad={4} />
          <LitWindows wins={wins[5]} />
        </g>

        {/* B5 — Stepped mid tower with crown */}
        <g className="rr-b5">
          <rect x="118" y="265" width="62" height="30"
            fill={G} fillOpacity="0.10" stroke={G} strokeOpacity="0.22" strokeWidth="0.8" />
          <rect x="122" y="200" width="54" height="65"
            fill={G} fillOpacity="0.14" stroke={G} strokeOpacity="0.28" strokeWidth="0.8" />
          <rect x="127" y="180" width="44" height="20"
            fill={G} fillOpacity="0.15" stroke={G} strokeOpacity="0.30" strokeWidth="0.8" />
          <rect x="131" y="162" width="36" height="18"
            fill={G} fillOpacity="0.16" stroke={G} strokeOpacity="0.32" strokeWidth="0.8" />
          {/* Crown — distinctive stepped top */}
          <rect x="135" y="148" width="28" height="14"
            fill={G} fillOpacity="0.17" stroke={G} strokeOpacity="0.34" strokeWidth="0.8" />
          <rect x="139" y="139" width="20" height="9"
            fill={G} fillOpacity="0.18" stroke={G} strokeOpacity="0.36" strokeWidth="0.8" />
          {/* Antenna with tip */}
          <line x1="149" y1="118" x2="149" y2="139"
            stroke={G} strokeOpacity="0.44" strokeWidth="1.5" />
          <circle cx="149" cy="118" r="2" fill={G} fillOpacity="0.32" />
          <DarkWindows bx={122} by={200} bw={54} bh={65} />
          <LitWindows wins={wins[6]} />
          <DarkWindows bx={127} by={180} bw={44} bh={20} pad={4} />
          <LitWindows wins={wins[7]} />
        </g>

        {/* B6 — Tall mixed-use with triple setback + spire */}
        <g className="rr-b6">
          <rect x="180" y="278" width="64" height="17"
            fill={G} fillOpacity="0.09" stroke={G} strokeOpacity="0.22" strokeWidth="0.8" />
          <rect x="184" y="148" width="56" height="130"
            fill={G} fillOpacity="0.14" stroke={G} strokeOpacity="0.28" strokeWidth="0.8" />
          <rect x="189" y="128" width="46" height="20"
            fill={G} fillOpacity="0.15" stroke={G} strokeOpacity="0.30" strokeWidth="0.8" />
          <rect x="194" y="108" width="36" height="20"
            fill={G} fillOpacity="0.16" stroke={G} strokeOpacity="0.32" strokeWidth="0.8" />
          {/* Spire with crossbar */}
          <line x1="212" y1="72" x2="212" y2="108"
            stroke={G} strokeOpacity="0.52" strokeWidth="2" />
          <line x1="207" y1="84" x2="217" y2="84"
            stroke={G} strokeOpacity="0.24" strokeWidth="1" />
          <DarkWindows bx={184} by={148} bw={56} bh={130} />
          <LitWindows wins={wins[8]} />
        </g>

        {/* B7 — Tall tower — FLOAT A */}
        <g className="rr-fa">
          <g className="rr-b7">
            <rect x="246" y="278" width="70" height="17"
              fill={G} fillOpacity="0.10" stroke={G} strokeOpacity="0.24" strokeWidth="0.8" />
            <rect x="250" y="88"  width="62" height="190"
              fill={G} fillOpacity="0.15" stroke={G} strokeOpacity="0.30" strokeWidth="0.8" />
            <rect x="256" y="68"  width="50" height="20"
              fill={G} fillOpacity="0.16" stroke={G} strokeOpacity="0.32" strokeWidth="0.8" />
            {/* Rooftop plant room */}
            <rect x="273" y="50" width="10" height="18"
              fill={G} fillOpacity="0.17" stroke={G} strokeOpacity="0.36" strokeWidth="0.8" />
            <DarkWindows bx={250} by={88} bw={62} bh={190} />
            <LitWindows wins={wins[9]} />
          </g>
        </g>

        {/* B8 — TALLEST with distinctive two-step crown — FLOAT B */}
        <g className="rr-fb">
          <g className="rr-b8">
            <rect x="318" y="278" width="76" height="17"
              fill={G} fillOpacity="0.10" stroke={G} strokeOpacity="0.24" strokeWidth="0.8" />
            <rect x="322" y="48"  width="68" height="230"
              fill={G} fillOpacity="0.16" stroke={G} strokeOpacity="0.32" strokeWidth="0.8" />
            <rect x="329" y="28"  width="54" height="20"
              fill={G} fillOpacity="0.17" stroke={G} strokeOpacity="0.34" strokeWidth="0.8" />
            {/* Distinctive 2-step crown */}
            <rect x="335" y="12" width="42" height="16"
              fill={G} fillOpacity="0.18" stroke={G} strokeOpacity="0.36" strokeWidth="0.8" />
            <rect x="341" y="4"  width="30" height="8"
              fill={G} fillOpacity="0.18" stroke={G} strokeOpacity="0.38" strokeWidth="0.8" />
            {/* Broadcast antenna + ball + crossbar */}
            <line x1="356" y1="-10" x2="356" y2="4"
              stroke={G} strokeOpacity="0.55" strokeWidth="2" />
            <circle cx="356" cy="-10" r="2.5" fill={G} fillOpacity="0.45" />
            <line x1="350" y1="0" x2="362" y2="0"
              stroke={G} strokeOpacity="0.24" strokeWidth="1" />
            <DarkWindows bx={322} by={48} bw={68} bh={230} />
            <LitWindows wins={wins[10]} />
          </g>
        </g>

        {/* B9 — Tall right tower — FLOAT C */}
        <g className="rr-fc">
          <g className="rr-b9">
            <rect x="396" y="278" width="64" height="17"
              fill={G} fillOpacity="0.09" stroke={G} strokeOpacity="0.22" strokeWidth="0.8" />
            <rect x="400" y="88"  width="56" height="190"
              fill={G} fillOpacity="0.14" stroke={G} strokeOpacity="0.28" strokeWidth="0.8" />
            <rect x="406" y="68"  width="44" height="20"
              fill={G} fillOpacity="0.15" stroke={G} strokeOpacity="0.30" strokeWidth="0.8" />
            {/* Slim antenna */}
            <line x1="428" y1="46" x2="428" y2="68"
              stroke={G} strokeOpacity="0.42" strokeWidth="1.5" />
            <circle cx="428" cy="46" r="2" fill={G} fillOpacity="0.32" />
            <DarkWindows bx={400} by={88} bw={56} bh={190} />
            <LitWindows wins={wins[11]} />
          </g>
        </g>
      </svg>
    </div>
  );
}
