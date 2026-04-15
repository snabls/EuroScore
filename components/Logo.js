export default function Logo({ size = 'md', showText = true }) {
  const sizes = {
    sm: { star: 28, font: '1.1rem', gap: '0.5rem' },
    md: { star: 44, font: '1.6rem', gap: '0.75rem' },
    lg: { star: 72, font: '2.6rem', gap: '1rem' },
    xl: { star: 100, font: '3.5rem', gap: '1.25rem' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: s.gap,
      userSelect: 'none',
    }}>
      {/* SVG Star Icon */}
      <svg
        width={s.star}
        height={s.star}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="logoGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Outer ring */}
        <circle cx="50" cy="50" r="46" stroke="url(#logoGrad2)" strokeWidth="2" opacity="0.4" />

        {/* Big star */}
        <polygon
          points="50,8 61,35 90,35 67,53 76,80 50,63 24,80 33,53 10,35 39,35"
          fill="url(#logoGrad)"
          filter="url(#glow)"
          opacity="0.95"
        />

        {/* Inner star highlight */}
        <polygon
          points="50,22 57,40 76,40 61,51 67,69 50,58 33,69 39,51 24,40 43,40"
          fill="white"
          opacity="0.15"
        />

        {/* Center dot */}
        <circle cx="50" cy="50" r="6" fill="white" opacity="0.9" />

        {/* Small orbit stars */}
        <circle cx="50" cy="6" r="3" fill="#f59e0b" opacity="0.8" />
        <circle cx="94" cy="50" r="2" fill="#60a5fa" opacity="0.7" />
        <circle cx="6" cy="50" r="2" fill="#60a5fa" opacity="0.7" />
        <circle cx="50" cy="94" r="3" fill="#a78bfa" opacity="0.8" />
      </svg>

      {/* Text */}
      {showText && (
        <span style={{
          fontSize: s.font,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f59e0b 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
        }}>
          EuroScore
        </span>
      )}
    </div>
  );
}
