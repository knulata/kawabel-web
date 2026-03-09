'use client';

import { motion } from 'framer-motion';

interface MascotProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  animate?: boolean;
  className?: string;
}

const SIZES = {
  xs: { w: 18, h: 18 },
  sm: { w: 24, h: 24 },
  md: { w: 32, h: 32 },
  lg: { w: 48, h: 48 },
  xl: { w: 72, h: 72 },
  '2xl': { w: 96, h: 96 },
};

function OwlSVG({ width, height }: { width: number; height: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      width={width}
      height={height}
      role="img"
      aria-label="Kawai the owl"
    >
      {/* Ear tufts */}
      <polygon points="38,42 46,54 50,40" fill="#8B6914" />
      <polygon points="90,42 82,54 78,40" fill="#8B6914" />
      {/* Body */}
      <ellipse cx="64" cy="76" rx="32" ry="34" fill="#8B6914" />
      {/* Belly */}
      <ellipse cx="64" cy="84" rx="22" ry="24" fill="#F5DEB3" />
      {/* Left eye white */}
      <circle cx="50" cy="60" r="15" fill="white" />
      {/* Right eye white */}
      <circle cx="78" cy="60" r="15" fill="white" />
      {/* Left pupil */}
      <circle cx="52" cy="60" r="9" fill="#1a1a1a" />
      {/* Right pupil */}
      <circle cx="80" cy="60" r="9" fill="#1a1a1a" />
      {/* Left eye shine */}
      <circle cx="55" cy="57" r="3.5" fill="white" />
      {/* Right eye shine */}
      <circle cx="83" cy="57" r="3.5" fill="white" />
      {/* Beak */}
      <polygon points="64,66 57,75 71,75" fill="#FF9800" />
      {/* Graduation cap */}
      <polygon points="38,38 64,26 90,38 64,48" fill="#2E7D32" />
      <rect x="60" y="26" width="8" height="5" rx="1" fill="#2E7D32" />
      <circle cx="90" cy="38" r="2.5" fill="#FFD700" />
      <line x1="90" y1="38" x2="94" y2="47" stroke="#FFD700" strokeWidth="2" />
      <circle cx="94" cy="48" r="3" fill="#FFD700" />
      {/* Feet */}
      <ellipse cx="52" cy="108" rx="9" ry="4" fill="#FF9800" />
      <ellipse cx="76" cy="108" rx="9" ry="4" fill="#FF9800" />
    </svg>
  );
}

export function Mascot({ size = 'md', animate = false, className = '' }: MascotProps) {
  const dims = SIZES[size];

  if (animate) {
    return (
      <motion.div
        className={`inline-flex items-center justify-center ${className}`}
        animate={{ y: [0, -3, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      >
        <OwlSVG width={dims.w} height={dims.h} />
      </motion.div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <OwlSVG width={dims.w} height={dims.h} />
    </div>
  );
}

export const MASCOT_NAME = 'Kawai';
