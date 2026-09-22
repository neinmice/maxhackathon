import React from 'react';

// Mascot Face Avatar for Headers and Navigation
export const MascotAvatarIcon: React.FC<{ size?: number; className?: string }> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mascotHeadGrad" x1="20" y1="20" x2="80" y2="85" gradientUnits="userSpaceOnUse">
        <stop stopColor="#9D6BFF" />
        <stop offset="0.5" stopColor="#7045C6" />
        <stop offset="1" stopColor="#481F94" />
      </linearGradient>
      <linearGradient id="mascotEyeGrad" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#6EE7B7" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
      <filter id="mascotGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    {/* Cat / Robot Ears */}
    <path d="M22 45 L15 18 L42 32 Z" fill="#7045C6" stroke="#B89FFE" strokeWidth="3" strokeLinejoin="round" />
    <path d="M25 40 L20 25 L36 34 Z" fill="#FFD21E" opacity="0.85" />
    <path d="M78 45 L85 18 L58 32 Z" fill="#7045C6" stroke="#B89FFE" strokeWidth="3" strokeLinejoin="round" />
    <path d="M75 40 L80 25 L64 34 Z" fill="#FFD21E" opacity="0.85" />
    {/* Head Shell */}
    <rect x="18" y="28" width="64" height="54" rx="24" fill="url(#mascotHeadGrad)" stroke="#C4B5FD" strokeWidth="2.5" filter="url(#mascotGlow)" />
    {/* Visor Screen */}
    <rect x="25" y="38" width="50" height="34" rx="14" fill="#0D091A" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
    {/* Glowing Eyes */}
    <circle cx="38" cy="53" r="5.5" fill="#34D399" />
    <circle cx="39.5" cy="51.5" r="2" fill="#FFFFFF" />
    <circle cx="62" cy="53" r="5.5" fill="#34D399" />
    <circle cx="63.5" cy="51.5" r="2" fill="#FFFFFF" />
    {/* Cute Mouth / Smile */}
    <path d="M46 60 Q50 63 54 60" stroke="#FFD21E" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// High-fidelity Mascot Peeking out of the Door (Exact visual match from Canva reference)
export const MascotDoorIllustration: React.FC<{ className?: string }> = () => (
  <div style={{ position: 'relative', width: 260, height: 210, margin: '0 auto' }}>
    <svg width="260" height="210" viewBox="0 0 260 210" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Wall / Door Frame Shadow */}
        <filter id="doorShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="-8" dy="12" stdDeviation="14" floodColor="#000000" floodOpacity="0.75" />
        </filter>
        <linearGradient id="doorFrameGrad" x1="30" y1="10" x2="160" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#31195E" />
          <stop offset="1" stopColor="#170B30" />
        </linearGradient>
        <linearGradient id="openDoorGrad" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#7E47EB" />
          <stop offset="0.7" stopColor="#5524B0" />
          <stop offset="1" stopColor="#320E77" />
        </linearGradient>
        <linearGradient id="mascotBodyGrad" x1="120" y1="70" x2="190" y2="160" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A78BFA" />
          <stop offset="0.6" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#4C1D95" />
        </linearGradient>
        <linearGradient id="goldenLight" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#FFE14D" stopOpacity="0.8" />
          <stop offset="1" stopColor="#FFD21E" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Door Opening (Dark Interior Glow) */}
      <rect x="55" y="20" width="130" height="185" rx="16" fill="#0C0617" />
      <path d="M55 20 Q120 15 185 20 L185 205 L55 205 Z" fill="rgba(112, 69, 198, 0.25)" />

      {/* Open Door Leaf (angled open perspective) */}
      <path
        d="M55 20 L15 35 L15 205 L55 205 Z"
        fill="url(#openDoorGrad)"
        stroke="#9065ED"
        strokeWidth="2.5"
        filter="url(#doorShadow)"
      />
      {/* Door Handle */}
      <rect x="25" y="115" width="18" height="6" rx="3" fill="#FFD21E" />
      <circle cx="28" cy="118" r="4" fill="#FFE14D" />

      {/* Mascot Pushing / Peeking through Door */}
      {/* Left Hand Holding Door Frame */}
      <path d="M50 110 Q58 112 60 120 Q56 126 48 122 Z" fill="#8B5CF6" stroke="#C4B5FD" strokeWidth="2" />
      
      {/* Mascot Head (Peeking out at angle) */}
      <g transform="translate(10, -5)">
        {/* Left Ear */}
        <path d="M85 62 L75 35 L105 48 Z" fill="#7C3AED" stroke="#DDD6FE" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M86 56 L80 42 L98 50 Z" fill="#FFD21E" opacity="0.9" />

        {/* Right Ear */}
        <path d="M142 62 L152 35 L122 48 Z" fill="#7C3AED" stroke="#DDD6FE" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M140 56 L146 42 L128 50 Z" fill="#FFD21E" opacity="0.9" />

        {/* Main Head Capsule */}
        <rect x="80" y="45" width="70" height="62" rx="26" fill="url(#mascotBodyGrad)" stroke="#C4B5FD" strokeWidth="3" />

        {/* Visor */}
        <rect x="88" y="56" width="54" height="38" rx="16" fill="#0E0720" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />

        {/* Glowing Eyes */}
        <ellipse cx="102" cy="74" rx="7" ry="6.5" fill="#34D399" />
        <circle cx="104" cy="72" r="2.5" fill="#FFFFFF" />
        <ellipse cx="128" cy="74" rx="7" ry="6.5" fill="#34D399" />
        <circle cx="130" cy="72" r="2.5" fill="#FFFFFF" />

        {/* Cute Smile */}
        <path d="M111 82 Q115 86 119 82" stroke="#FFD21E" strokeWidth="2.5" strokeLinecap="round" />

        {/* Right Hand Waving or Resting on Door */}
        <path d="M145 105 Q158 100 162 110 Q156 122 142 116 Z" fill="#8B5CF6" stroke="#C4B5FD" strokeWidth="2" />
      </g>

      {/* Excitement Burst Rays above head */}
      <path d="M125 15 L125 8" stroke="#FFD21E" strokeWidth="3" strokeLinecap="round" />
      <path d="M105 20 L99 15" stroke="#FFD21E" strokeWidth="3" strokeLinecap="round" />
      <path d="M145 20 L151 15" stroke="#FFD21E" strokeWidth="3" strokeLinecap="round" />
    </svg>
  </div>
);

// Neon [START] Sticker (matching Canva mockup)
export const StartSticker: React.FC = () => (
  <div style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3px 8px',
    borderRadius: 8,
    background: 'linear-gradient(135deg, #FF007A 0%, #7928CA 100%)',
    border: '1.5px solid #00F5FF',
    boxShadow: '0 0 10px rgba(0, 245, 255, 0.6), 0 0 16px rgba(255, 0, 122, 0.4)',
    transform: 'rotate(-5deg)',
    fontFamily: 'monospace, system-ui, sans-serif',
    fontWeight: 900,
    fontSize: 10,
    letterSpacing: '0.12em',
    color: '#00F5FF',
    textShadow: '0 0 6px #00F5FF',
    userSelect: 'none',
  }}>
    START
  </div>
);

// Hand-drawn Yellow Squiggle & Purple Wavy Arrow for the 90% Banner
export const SquiggleDecorations: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pointerEvents: 'none' }}>
    {/* Yellow Lightning Squiggle */}
    <svg width="42" height="18" viewBox="0 0 42 18" fill="none">
      <path
        d="M2 12 L14 4 L22 14 L34 3 L40 9"
        stroke="#FFD21E"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>

    {/* Purple Wavy Arrow */}
    <svg width="50" height="20" viewBox="0 0 50 20" fill="none">
      <path
        d="M2 10 Q12 2 22 10 T42 10 L36 4 M42 10 L36 16"
        stroke="#8B5CF6"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

// Purple Sunburst 3-Rays Sticker for «Финансовая поддержка >»
export const SunburstSticker: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 4 }}>
    <path d="M12 2 L12 8" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />
    <path d="M19 5 L15 10" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />
    <path d="M22 12 L16 12" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
