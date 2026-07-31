import React from 'react';

interface AvatarProps {
  name: string;
  size?: number;
  ring?: boolean;
  className?: string;
}

const PALETTE = [
  ['#00FF87', '#00A855'],
  ['#00F0FF', '#0891B2'],
  ['#FFD700', '#B45309'],
  ['#818CF8', '#4338CA'],
  ['#FB7185', '#9F1239'],
  ['#38BDF8', '#0369A1']
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 40, ring = true, className = '' }) => {
  const [from, to] = PALETTE[hashString(name) % PALETTE.length];

  return (
    <div
      className={`flex items-center justify-center rounded-xl font-bold text-[#040711] shrink-0 ${ring ? 'ring-2 ring-[#05C46B]/60' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `linear-gradient(135deg, ${from}, ${to})`
      }}
    >
      {getInitials(name)}
    </div>
  );
};
