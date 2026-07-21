import React from 'react';
import robotMascotAsset from '@/assets/robot-mascot.png.asset.json';

const robotMascot = robotMascotAsset.url;

const normalizeRobotClasses = (className = '') =>
  className
    .split(/\s+/)
    .filter((token) => token && !/^(w-|h-|scale-|translate-y-|object-)/.test(token))
    .join(' ');

export const RobotMascot: React.FC<{ className?: string; showStatus?: boolean }> = ({
  className,
  showStatus = true,
}) => (
  <span className="relative inline-flex w-20 h-20 items-center justify-center">
    <img
      src={robotMascot}
      alt="Assistente"
      className={`w-20 h-20 object-contain ${normalizeRobotClasses(className)}`}
      draggable={false}
      decoding="async"
      loading="eager"
      style={{ objectFit: 'contain', background: 'transparent' }}
    />
    {showStatus && (
      <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)] ring-2 ring-[#0a0c0a]" />
      </span>
    )}
  </span>
);
