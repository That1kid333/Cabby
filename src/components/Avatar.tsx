import React from 'react';

interface AvatarProps {
  name: string;
  size?: number;
  ring?: boolean;
  className?: string;
}

const PALETTE = [
  ['#7FA65C', '#4F6B3A'],
  ['#8FA6A3', '#4C7A82'],
  ['#C9A24B', '#8A5A2E'],
  ['#8A7CA8', '#5C4A78'],
  ['#B5716B', '#7A3B35'],
  ['#7A97A0', '#3F5F66']
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
      className={`flex items-center justify-center rounded-xl font-bold text-[#14150F] shrink-0 ${ring ? 'ring-2 ring-[#4F6B3A]/60' : ''} ${className}`}
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
