import type { CSSProperties } from 'react'

type P = { className?: string; style?: CSSProperties }

/* ---------- UI icons ---------- */

export const SearchIcon = ({ className, style }: P) => (
  <svg className={className} style={style} width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="10.5" cy="10.5" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M15.8 15.8 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const PinIcon = ({ className, style }: P) => (
  <svg className={className} style={style} width="26" height="32" viewBox="0 0 26 32" fill="none">
    <path
      d="M13 0C5.8 0 0 5.7 0 12.8 0 21.9 11.2 30.8 11.7 31.2c.8.6 1.8.6 2.6 0C14.8 30.8 26 21.9 26 12.8 26 5.7 20.2 0 13 0Z"
      fill="currentColor"
    />
  </svg>
)

export const HomeIcon = ({ className, style }: P) => (
  <svg className={className} style={style} width="26" height="26" viewBox="0 0 28 28" fill="none">
    <defs>
      <mask id="homeDoorMask">
        <rect width="28" height="28" fill="white" />
        <rect x="11.5" y="15" width="5" height="9" rx="2" fill="black" />
      </mask>
    </defs>
    <path
      d="M4.5 12.8c0-.9.4-1.7 1.1-2.3L12.3 4a2.6 2.6 0 0 1 3.4 0l6.7 6.5c.7.6 1.1 1.4 1.1 2.3v8.5a2.6 2.6 0 0 1-2.6 2.6H7.1a2.6 2.6 0 0 1-2.6-2.6V12.8Z"
      fill="currentColor"
      mask="url(#homeDoorMask)"
    />
  </svg>
)

export const HomeOutlineIcon = ({ className, style }: P) => (
  <svg className={className} style={style} width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path
      d="M4.5 12.8c0-.7.3-1.3.8-1.8l7-5.9a2.6 2.6 0 0 1 3.4 0l7 5.9c.5.5.8 1.1.8 1.8v9.7a2 2 0 0 1-2 2h-3.3v-5.8a1.6 1.6 0 0 0-1.6-1.6h-3.2a1.6 1.6 0 0 0-1.6 1.6v5.8H6.5a2 2 0 0 1-2-2v-9.7Z"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinejoin="round"
    />
  </svg>
)

export const ServicesIcon = ({ className, style }: P) => (
  <svg className={className} style={style} width="28" height="28" viewBox="0 0 28 28" fill="none">
    {[
      [4, 4],
      [15.5, 4],
      [4, 15.5],
      [15.5, 15.5],
    ].map(([x, y]) => (
      <rect key={`${x}${y}`} x={x} y={y} width="8.5" height="8.5" rx="3.4" stroke="currentColor" strokeWidth="1.9" />
    ))}
  </svg>
)

export const ServicesFilledIcon = ({ className, style }: P) => (
  <svg className={className} style={style} width="28" height="28" viewBox="0 0 28 28" fill="none">
    {[
      [3, 3],
      [15, 3],
      [3, 15],
      [15, 15],
    ].map(([x, y]) => (
      <rect key={`${x}${y}`} x={x} y={y} width="10" height="10" rx="3.6" fill="currentColor" />
    ))}
  </svg>
)

export const WalletIcon = ({ className, style }: P) => (
  <svg className={className} style={style} width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path
      d="M21 7.5V6.8A2.3 2.3 0 0 0 18.4 4.5L6.2 6.3A2.8 2.8 0 0 0 3.8 9.1"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
    <rect x="3.8" y="7.5" width="20.4" height="16" rx="3.6" stroke="currentColor" strokeWidth="1.9" />
    <path d="M24.2 13.2h-4.3a2.3 2.3 0 0 0 0 4.6h4.3" stroke="currentColor" strokeWidth="1.9" />
    <circle cx="20" cy="15.5" r="1.1" fill="currentColor" />
  </svg>
)

export const WalletFilledIcon = ({ className, style }: P) => (
  <svg className={className} style={style} width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path d="M21.5 7V6.6a2.6 2.6 0 0 0-3-2.6L6.4 5.8A2.9 2.9 0 0 0 4 8.1Z" fill="currentColor" opacity=".55" />
    <path
      d="M3 10.5A3.5 3.5 0 0 1 6.5 7h15A3.5 3.5 0 0 1 25 10.5V12h-5a3.5 3.5 0 0 0 0 7h5v1.5a3.5 3.5 0 0 1-3.5 3.5h-15A3.5 3.5 0 0 1 3 20.5v-10Z"
      fill="currentColor"
    />
    <rect x="17.5" y="13.4" width="7.5" height="4.2" rx="2.1" fill="currentColor" />
    <circle cx="20" cy="15.5" r="1.1" fill="#121312" />
  </svg>
)

export const DocIcon = ({ className, style }: P) => (
  <svg className={className} style={style} width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path
      d="M7.8 3.8h8.4l6 6v11.6a2.8 2.8 0 0 1-2.8 2.8H7.8A2.8 2.8 0 0 1 5 21.4V6.6a2.8 2.8 0 0 1 2.8-2.8Z"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinejoin="round"
    />
    <path d="M15.8 4v4.2a2 2 0 0 0 2 2H22" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    <path d="M9.6 15.2h8.8M9.6 19h5.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
)

export const DocFilledIcon = ({ className, style }: P) => (
  <svg className={className} style={style} width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path
      d="M7.8 3h7.7v5.2a3 3 0 0 0 3 3H23v10.2a3.6 3.6 0 0 1-3.6 3.6H7.8a3.6 3.6 0 0 1-3.6-3.6V6.6A3.6 3.6 0 0 1 7.8 3Z"
      fill="currentColor"
    />
    <path d="M17.3 3.4 22.6 9.3h-4.1a1.2 1.2 0 0 1-1.2-1.2V3.4Z" fill="currentColor" />
    <path d="M9.6 15.2h8.8M9.6 19h5.4" stroke="#121312" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
)

export const MicIcon = ({ className, style }: P) => (
  <svg className={className} style={style} width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="8.5" y="2.5" width="7" height="12" rx="3.5" stroke="currentColor" strokeWidth="2" />
    <path d="M5 11.5a7 7 0 0 0 14 0M12 18.5v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const SendIcon = ({ className, style }: P) => (
  <svg className={className} style={style} width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 19.5v-15M5.5 11 12 4.5 18.5 11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const CloseIcon = ({ className, style }: P) => (
  <svg className={className} style={style} width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
)

export const BackIcon = ({ className, style }: P) => (
  <svg className={className} style={style} width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const ChevronIcon = ({ className, style }: P) => (
  <svg className={className} style={style} width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const CheckIcon = ({ className, style }: P) => (
  <svg className={className} style={style} width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M5 12.5 10 17.5 19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const HeartIcon = ({ className, style, filled }: P & { filled?: boolean }) => (
  <svg className={className} style={style} width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 20.3S3.5 15.2 3.5 9A4.6 4.6 0 0 1 12 6.5 4.6 4.6 0 0 1 20.5 9c0 6.2-8.5 11.3-8.5 11.3Z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
)

export const ShareIcon = ({ className, style }: P) => (
  <svg className={className} style={style} width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5 21 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
)

export const BellIcon = ({ className, style }: P) => (
  <svg className={className} style={style} width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2H4.5l1.5-2ZM9.5 20.5a2.5 2.5 0 0 0 5 0"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
)

export const ClockIcon = ({ className, style }: P) => (
  <svg className={className} style={style} width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export const PlayIcon = ({ className, style }: P) => (
  <svg className={className} style={style} width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" fill="currentColor" />
  </svg>
)

export const LockIcon = ({ className, style }: P) => (
  <svg className={className} style={style} width="16" height="16" viewBox="0 0 24 24" fill="none">
    <rect x="4.5" y="10.5" width="15" height="10.5" rx="3" stroke="currentColor" strokeWidth="2" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" strokeWidth="2" />
  </svg>
)

/* ---------- service glyphs (outline, 28px) ---------- */

const g = { stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export const ServiceGlyph = ({ name, className, style }: { name: string; className?: string; style?: CSSProperties }) => {
  const paths: Record<string, React.ReactNode> = {
    register: (
      <>
        <rect x="5" y="3.5" width="18" height="21" rx="3" {...g} />
        <path d="M9.5 9.5h9M9.5 13.5h9M9.5 17.5h5" {...g} />
      </>
    ),
    calc: (
      <>
        <rect x="5.5" y="3.5" width="17" height="21" rx="3" {...g} />
        <rect x="9" y="7" width="10" height="4.5" rx="1.2" {...g} />
        <path d="M9.5 15.5h.01M14 15.5h.01M18.5 15.5h.01M9.5 20h.01M14 20h.01M18.5 20h.01" {...g} strokeWidth={2.6} />
      </>
    ),
    law: (
      <>
        <path d="M14 4v20M8 24h12M5 9h18M5 9l-2.5 7a3.6 3.6 0 0 0 5 0L5 9ZM23 9l-2.5 7a3.6 3.6 0 0 0 5 0L23 9Z" {...g} />
      </>
    ),
    place: (
      <>
        <path d="M4 24V11l10-6.5L24 11v13" {...g} />
        <path d="M10 24v-7h8v7M2.5 24h23" {...g} />
      </>
    ),
    marketing: (
      <>
        <path d="M4 12v4.5a1.5 1.5 0 0 0 1.5 1.5H8l9 5V5L8 10H5.5A1.5 1.5 0 0 0 4 11.5" {...g} />
        <path d="M21 10.5a4.5 4.5 0 0 1 0 7M9 18l1.5 5.5" {...g} />
      </>
    ),
    account: (
      <>
        <path d="M4 22.5 10 15l4.5 4L24 6.5" {...g} />
        <path d="M18 6.5h6v6" {...g} />
      </>
    ),
    mentor: (
      <>
        <circle cx="14" cy="9" r="4.5" {...g} />
        <path d="M5 24c0-5 4-8 9-8s9 3 9 8" {...g} />
      </>
    ),
    export: (
      <>
        <circle cx="14" cy="14" r="10" {...g} />
        <path d="M4 14h20M14 4c3 3 4 6.5 4 10s-1 7-4 10c-3-3-4-6.5-4-10s1-7 4-10Z" {...g} />
      </>
    ),
    lease: (
      <>
        <circle cx="9.5" cy="18" r="4.5" {...g} />
        <path d="M13 15 23 5M19.5 8.5l3 3M17 11l2.5 2.5" {...g} />
      </>
    ),
    patent: (
      <>
        <circle cx="14" cy="11" r="6.5" {...g} />
        <path d="m10 16.5-2 8 6-3 6 3-2-8" {...g} />
      </>
    ),
    support: (
      <>
        <path d="M5 15v-2a9 9 0 0 1 18 0v2" {...g} />
        <rect x="3.5" y="14.5" width="5" height="7" rx="2" {...g} />
        <rect x="19.5" y="14.5" width="5" height="7" rx="2" {...g} />
        <path d="M22 21.5c0 2-2 3-5 3h-2" {...g} />
      </>
    ),
    docs: (
      <>
        <path d="M9 4h9l5 5v13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" {...g} />
        <path d="M11 15l2.5 2.5L18 13" {...g} />
      </>
    ),
    internship: (
      <>
        <circle cx="14" cy="8.5" r="4" {...g} />
        <path d="M5.5 23.5v-1.5a5 5 0 0 1 5-5h7a5 5 0 0 1 5 5v1.5" {...g} />
        <path d="M12 17l2 3 2-3" {...g} />
      </>
    ),
  }
  return (
    <svg className={className} style={style} width="28" height="28" viewBox="0 0 28 28" fill="none">
      {paths[name]}
    </svg>
  )
}

/* ---------- decorative elements from the mockup ---------- */

/** Thick 3D zigzag stroke used behind the name and banner titles */
export const Scribble = ({ className, style, color = '#6b58b8', shade = '#4d3f8c' }: P & { color?: string; shade?: string }) => (
  <svg className={className} style={style} viewBox="0 0 200 50" fill="none" preserveAspectRatio="none">
    <path
      d="M8 38 60 12 64 40 124 12 128 40 192 12"
      stroke={shade}
      strokeWidth="17"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(1.5 3)"
    />
    <path d="M8 38 60 12 64 40 124 12 128 40 192 12" stroke={color} strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/** Zigzag lightning arrow. dir=left — yellow one, dir=right — purple one */
export const ZigArrow = ({ className, style, dir = 'right', color, shade }: P & { dir?: 'left' | 'right'; color?: string; shade?: string }) => {
  const c = color ?? (dir === 'left' ? '#e7ae45' : '#8a6cf0')
  const s = shade ?? (dir === 'left' ? '#b98524' : '#5f47c2')
  const d = 'M6 30 L30 15 L34 27 L58 13 L62 25 L92 17'
  const head = 'M80 8 L93 17 L79 26'
  return (
    <svg
      className={className}
      style={{ ...style, transform: dir === 'left' ? 'rotate(180deg)' : undefined }}
      viewBox="0 0 100 36"
      fill="none"
    >
      <g transform="translate(1.2 2.4)" stroke={s} strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
        <path d={head} />
      </g>
      <g stroke={c} strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
        <path d={head} />
      </g>
    </svg>
  )
}

/** Three-ray "attention" burst */
export const Rays = ({ className, style, color = '#7b5cf0', shade = '#4f38b0' }: P & { color?: string; shade?: string }) => (
  <svg className={className} style={style} viewBox="0 0 60 50" fill="none">
    {[shade, color].map((fill, i) => (
      <g key={fill} fill={fill} transform={i === 0 ? 'translate(1 1.6)' : undefined}>
        <path d="M4 5.5a2.5 2.5 0 0 1 2.5-2.8h8a2.5 2.5 0 0 1 2.5 2.8l-2 14.5a2.5 2.5 0 0 1-2.5 2.1H9a2.5 2.5 0 0 1-2.5-2.1L4 5.5Z" />
        <path d="M27.5 3.1a2.5 2.5 0 0 1 3.2-1.4l7 2.8a2.5 2.5 0 0 1 1.3 3.3l-8.5 19.3a2.5 2.5 0 0 1-3.2 1.3l-4.4-1.8a2.5 2.5 0 0 1-1.4-3.1L27.5 3.1Z" />
        <path d="M49.3 22.4a2.5 2.5 0 0 1 3.5.4l3.5 4.9a2.5 2.5 0 0 1-.6 3.5L41.3 42a2.5 2.5 0 0 1-3.3-.3l-3-3.3a2.5 2.5 0 0 1 .3-3.6l14-12.4Z" />
      </g>
    ))}
  </svg>
)

/** Pixel "СТАРТ" sticker */
export const StartSticker = ({ className, style }: P) => (
  <svg className={className} style={style} width="64" height="30" viewBox="0 0 64 30" fill="none" shapeRendering="crispEdges">
    <path d="M6 4h52l3 3v14l-3 3v3H8l-3-3V8l1-1V4Z" fill="#6b3fb3" />
    <path d="M6 2h52l3 3v14l-3 3H6l-3-3V5l3-3Z" fill="#be88e3" />
    <path d="M7 4h50l2 2v12l-2 2H7l-2-2V6l2-2Z" fill="#a8dcaf" />
    <text
      x="32"
      y="15.5"
      textAnchor="middle"
      fontFamily="'VK Sans Display Expanded', monospace"
      fontSize="10"
      fontWeight="900"
      letterSpacing="0.02em"
      fill="#1f1a2e"
    >
      СТАРТ
    </text>
  </svg>
)

/** Pixel 3D "ТЕСТ" sticker (brand yellow + StartSticker purple frame) */
export const QuizPinSticker = ({ className, style }: P) => (
  <svg className={className} style={style} width="58" height="26" viewBox="0 0 58 26" fill="none" shapeRendering="crispEdges">
    <path d="M6 4h46l3 3v11l-3 3v3H7l-3-3V7l1-1V4Z" fill="#6b3fb3" />
    <path d="M6 2h46l3 3v11l-3 3H6l-3-3V5l3-3Z" fill="#be88e3" />
    <path d="M7 4h44l2 2v9l-2 2H7l-2-2V6l2-2Z" fill="#f5c06a" />
    <text
      x="29"
      y="10.5"
      textAnchor="middle"
      dominantBaseline="central"
      fontFamily="'VK Sans Display Expanded', monospace"
      fontSize="9.5"
      fontWeight="900"
      letterSpacing="0.04em"
      fill="#1f1a2e"
    >
      ТЕСТ
    </text>
  </svg>
)

/** Pixel "HOT" sticker */
export const HotSticker = ({ className, style }: P) => (
  <svg className={className} style={style} width="64" height="30" viewBox="0 0 64 30" fill="none" shapeRendering="crispEdges">
    <path d="M6 4h52l3 3v14l-3 3v3H8l-3-3V8l1-1V4Z" fill="#7a35d8" />
    <path d="M6 2h52l3 3v14l-3 3H6l-3-3V5l3-3Z" fill="#d49b38" />
    <path d="M7 4h50l2 2v12l-2 2H7l-2-2V6l2-2Z" fill="#f5c06a" />
    <text x="32" y="15.5" textAnchor="middle" fontFamily="'VK Sans Display Expanded', monospace" fontSize="11" fontWeight="900" fill="#1f1a2e">
      HOT
    </text>
  </svg>
)

/** Pixel "0%" sticker */
export const ZeroPercentSticker = ({ className, style }: P) => (
  <svg className={className} style={style} width="64" height="30" viewBox="0 0 64 30" fill="none" shapeRendering="crispEdges">
    <path d="M6 4h52l3 3v14l-3 3v3H8l-3-3V8l1-1V4Z" fill="#3b1875" />
    <path d="M6 2h52l3 3v14l-3 3H6l-3-3V5l3-3Z" fill="#7a35d8" />
    <path d="M7 4h50l2 2v12l-2 2H7l-2-2V6l2-2Z" fill="#c499f3" />
    <text x="32" y="15.5" textAnchor="middle" fontFamily="'VK Sans Display Expanded', monospace" fontSize="11" fontWeight="900" fill="#120d1d">
      0%
    </text>
  </svg>
)

/** Pixel "15.10 ДЕДЛАЙН" sticker */
export const DeadlineSticker = ({ className, style }: P) => (
  <svg className={className} style={style} width="64" height="30" viewBox="0 0 64 30" fill="none" shapeRendering="crispEdges">
    <path d="M6 4h52l3 3v14l-3 3v3H8l-3-3V8l1-1V4Z" fill="#4d1b28" />
    <path d="M6 2h52l3 3v14l-3 3H6l-3-3V5l3-3Z" fill="#e05368" />
    <path d="M7 4h50l2 2v12l-2 2H7l-2-2V6l2-2Z" fill="#ff8a99" />
    <text x="32" y="15.5" textAnchor="middle" fontFamily="'VK Sans Display Expanded', monospace" fontSize="10.5" fontWeight="900" fill="#2d0b13">
      15.10
    </text>
  </svg>
)

/** Pixel 3D "ПРОЙТИ КВИЗ" sticker (Cyber Gold) */
export const QuizSticker = ({ className, style }: P) => (
  <svg className={className} style={style} width="120" height="30" viewBox="0 0 120 30" fill="none" shapeRendering="crispEdges">
    <path d="M6 4h108l3 3v14l-3 3v3H8l-3-3V8l1-1V4Z" fill="#7a35d8" />
    <path d="M6 2h108l3 3v14l-3 3H6l-3-3V5l3-3Z" fill="#d49b38" />
    <path d="M7 4h106l2 2v12l-2 2H7l-2-2V6l2-2Z" fill="#f5c06a" />
    <text
      x="60"
      y="15.5"
      textAnchor="middle"
      fontFamily="'VK Sans Display Expanded', monospace"
      fontSize="10"
      fontWeight="900"
      letterSpacing="0.04em"
      fill="#1f1a2e"
    >
      ПРОЙТИ КВИЗ
    </text>
  </svg>
)

/** Pixel 3D "ПРОЙТИ КВИЗ" sticker (Neon Purple) */
export const QuizStickerPurple = ({ className, style }: P) => (
  <svg className={className} style={style} width="120" height="30" viewBox="0 0 120 30" fill="none" shapeRendering="crispEdges">
    <path d="M6 4h108l3 3v14l-3 3v3H8l-3-3V8l1-1V4Z" fill="#2d1354" />
    <path d="M6 2h108l3 3v14l-3 3H6l-3-3V5l3-3Z" fill="#6029b5" />
    <path d="M7 4h106l2 2v12l-2 2H7l-2-2V6l2-2Z" fill="#c499f3" />
    <text
      x="60"
      y="15.5"
      textAnchor="middle"
      fontFamily="'VK Sans Display Expanded', monospace"
      fontSize="10"
      fontWeight="900"
      letterSpacing="0.04em"
      fill="#120d1d"
    >
      ПРОЙТИ КВИЗ
    </text>
  </svg>
)

/** Golden twin sparkle */
export const TwinSparkle = ({ className, style, size = 26 }: P & { size?: number }) => (
  <svg className={className} style={style} width={size} height={size * 0.8} viewBox="0 0 50 40" fill="none">
    <path d="M18 4 L21 13 L30 16 L21 19 L18 28 L15 19 L6 16 L15 13 Z" fill="#b98524" transform="translate(1.5, 2)" />
    <path d="M18 4 L21 13 L30 16 L21 19 L18 28 L15 19 L6 16 L15 13 Z" fill="#f5c06a" />
    <path d="M38 18 L39.5 23 L44 24.5 L39.5 26 L38 31 L36.5 26 L32 24.5 L36.5 23 Z" fill="#b98524" transform="translate(1, 1.5)" />
    <path d="M38 18 L39.5 23 L44 24.5 L39.5 26 L38 31 L36.5 26 L32 24.5 L36.5 23 Z" fill="#f5c06a" />
  </svg>
)

/** Golden clay coin with ₽ */
export const ClayCoin = ({ className, style, size = 26 }: P & { size?: number }) => (
  <svg className={className} style={style} width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="22" r="16" fill="#b98524" />
    <circle cx="20" cy="19" r="16" fill="#f5c06a" />
    <circle cx="20" cy="19" r="13" stroke="#b98524" strokeWidth="1.5" fill="none" />
    <text x="20" y="25" textAnchor="middle" fontFamily="'VK Sans Display Expanded', sans-serif" fontWeight="900" fontSize="16" fill="#755010">₽</text>
  </svg>
)

/** Golden sparkle clay */
export const SparkleClay = ({ className, style, size = 26 }: P & { size?: number }) => (
  <svg className={className} style={style} width={size} height={size} viewBox="0 0 40 40" fill="none">
    <path d="M20 4 L23.5 15.5 L35 19 L23.5 22.5 L20 34 L16.5 22.5 L5 19 L16.5 15.5 Z" fill="#b98524" transform="translate(1.5, 2.5)" />
    <path d="M20 4 L23.5 15.5 L35 19 L23.5 22.5 L20 34 L16.5 22.5 L5 19 L16.5 15.5 Z" fill="#f5c06a" />
    <circle cx="20" cy="19" r="3" fill="#fff" opacity="0.8" />
  </svg>
)

