export function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
      </defs>
      
      {/* 99 Circle Icon */}
      <g transform="translate(10, 10)">
        <circle cx="40" cy="40" r="38" fill="none" stroke="url(#gold-grad)" strokeWidth="4" strokeDasharray="180 60" transform="rotate(-45 40 40)"/>
        <circle cx="40" cy="40" r="32" fill="none" stroke="url(#gold-grad)" strokeWidth="2" strokeDasharray="120 40" transform="rotate(45 40 40)"/>
        
        {/* The 99 Text */}
        <text x="40" y="52" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="36" fill="url(#gold-grad)" textAnchor="middle">99</text>
      </g>
      
      {/* PLACEMENT Text */}
      <text x="105" y="62" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="42" fill="url(#gold-grad)" letterSpacing="1">PLACEMENT</text>
      
      {/* Underline */}
      <rect x="105" y="72" width="280" height="4" fill="url(#gold-grad)" />
    </svg>
  );
}
