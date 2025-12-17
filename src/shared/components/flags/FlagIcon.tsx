"use client";

interface FlagIconProps {
  className?: string;
}

// English/UK Flag (Union Jack) - Simplified version
export function UKFlag({ className = "h-5 w-5" }: FlagIconProps) {
  return (
    <svg
      viewBox="0 0 60 30"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Blue background */}
      <rect width="60" height="30" fill="#012169"/>
      
      {/* White diagonal stripes (from top-left to bottom-right) */}
      <path d="M0 0L60 30" stroke="#fff" strokeWidth="5"/>
      <path d="M60 0L0 30" stroke="#fff" strokeWidth="5"/>
      
      {/* White horizontal and vertical cross */}
      <rect x="25" y="0" width="10" height="30" fill="#fff"/>
      <rect x="0" y="10" width="60" height="10" fill="#fff"/>
      
      {/* Red diagonal stripes */}
      <path d="M0 0L60 30" stroke="#C8102E" strokeWidth="3"/>
      <path d="M60 0L0 30" stroke="#C8102E" strokeWidth="3"/>
      
      {/* Red horizontal and vertical cross */}
      <rect x="27" y="0" width="6" height="30" fill="#C8102E"/>
      <rect x="0" y="12" width="60" height="6" fill="#C8102E"/>
    </svg>
  );
}

// Georgian Flag (Five Cross Flag)
export function GeorgianFlag({ className = "h-5 w-5" }: FlagIconProps) {
  return (
    <svg
      viewBox="0 0 300 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* White background */}
      <rect width="300" height="200" fill="#fff"/>
      
      {/* Large red cross (St. George's Cross) - vertical */}
      <rect x="125" y="0" width="50" height="200" fill="#d00"/>
      {/* Large red cross - horizontal */}
      <rect x="0" y="75" width="300" height="50" fill="#d00"/>
      
      {/* Four smaller Bolnisi crosses in quadrants */}
      {/* Top-left cross */}
      <rect x="35" y="25" width="25" height="25" fill="#fff"/>
      <rect x="43" y="15" width="9" height="45" fill="#d00"/>
      <rect x="28" y="33" width="45" height="9" fill="#d00"/>
      
      {/* Top-right cross */}
      <rect x="240" y="25" width="25" height="25" fill="#fff"/>
      <rect x="248" y="15" width="9" height="45" fill="#d00"/>
      <rect x="233" y="33" width="45" height="9" fill="#d00"/>
      
      {/* Bottom-left cross */}
      <rect x="35" y="150" width="25" height="25" fill="#fff"/>
      <rect x="43" y="140" width="9" height="45" fill="#d00"/>
      <rect x="28" y="158" width="45" height="9" fill="#d00"/>
      
      {/* Bottom-right cross */}
      <rect x="240" y="150" width="25" height="25" fill="#fff"/>
      <rect x="248" y="140" width="9" height="45" fill="#d00"/>
      <rect x="233" y="158" width="45" height="9" fill="#d00"/>
    </svg>
  );
}

// Polish Flag
export function PolishFlag({ className = "h-5 w-5" }: FlagIconProps) {
  return (
    <svg
      viewBox="0 0 640 480"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path fill="#fff" d="M0 0h640v480H0z"/>
      <path fill="#dc143c" d="M0 240h640v240H0z"/>
    </svg>
  );
}

