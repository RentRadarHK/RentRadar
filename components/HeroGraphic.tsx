export default function HeroGraphic() {
  return (
    <svg
      className="rr-hero-graphic"
      viewBox="0 0 1000 480"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <g transform="translate(800 400) scale(3.15) translate(-28 -54)">
        {/* Ghost rest-state arcs */}
        <path d="M14 16 A 14 14 0 0 1 42 16"
          stroke="#4D8B6F" strokeWidth="0.7"
          fill="none" opacity=".22"/>
        <path d="M8 14 A 20 20 0 0 1 48 14"
          stroke="#4D8B6F" strokeWidth="0.7"
          fill="none" opacity=".14"/>

        {/* Animated signal arcs */}
        <path className="rr-hero-arc-in"
          d="M14 16 A 14 14 0 0 1 42 16"
          stroke="#4D8B6F" strokeWidth="1.6"
          fill="none" strokeLinecap="round"/>
        <path className="rr-hero-arc-out"
          d="M8 14 A 20 20 0 0 1 48 14"
          stroke="#4D8B6F" strokeWidth="1.4"
          fill="none" strokeLinecap="round"/>

        {/* Pin drop animation */}
        <g className="rr-hero-pin"
          style={{ transformBox: 'fill-box', transformOrigin: '28px 54px' }}>
          <ellipse cx="28" cy="56" rx="6" ry="1"
            fill="#555" opacity=".2"/>
          <path
            d="M28 54 C 28 54, 16 38, 16 26 A 12 12 0 0 1 40 26 C 40 38, 28 54, 28 54 Z"
            stroke="#2e2e2e" strokeWidth="1.4"
            strokeLinejoin="round" fill="#F5F0E8"/>
          <circle cx="28" cy="26" r="3.6"
            fill="#4D8B6F" stroke="#2e2e2e" strokeWidth="0.8"/>
        </g>
      </g>
    </svg>
  )
}
