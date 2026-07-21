import React from 'react';
import plaAsset from '@/assets/spool-pla.png.asset.json';
import petgAsset from '@/assets/spool-petg.png.asset.json';
import absAsset from '@/assets/spool-abs.png.asset.json';
import tpuAsset from '@/assets/spool-tpu.png.asset.json';
import asaAsset from '@/assets/spool-asa.png.asset.json';
import silkAsset from '@/assets/spool-silk.png.asset.json';

const MATERIAL_COLORS: Record<string, string> = {
  PLA: '#b7ff00',
  PETG: '#ff8a2a',
  TPU: '#22d3ee',
  ABS: '#ef4444',
  ASA: '#a78bfa',
  NYLON: '#f472b6',
  PC: '#60a5fa',
  HIPS: '#fbbf24',
};

export function materialColor(type?: string, fallback = '#b7ff00') {
  if (!type) return fallback;
  const key = String(type).toUpperCase().replace(/[^A-Z]/g, '');
  return MATERIAL_COLORS[key] || fallback;
}

const SPOOL_IMAGES: Record<string, string> = {
  PLA: plaAsset.url,
  PETG: petgAsset.url,
  ABS: absAsset.url,
  TPU: tpuAsset.url,
  ASA: asaAsset.url,
  SILK: silkAsset.url,
};

export function spoolImage(type?: string): string | undefined {
  if (!type) return undefined;
  const key = String(type).toUpperCase().replace(/[^A-Z]/g, '');
  return SPOOL_IMAGES[key];
}

interface FilamentSpoolProps {
  color?: string;
  size?: number;
  className?: string;
  label?: string;
  type?: string;
}

export function FilamentSpool({ color = '#b7ff00', size = 40, className, label, type }: FilamentSpoolProps) {
  const img = spoolImage(type);
  if (img) {
    return (
      <img
        src={img}
        alt={label || `${type} filamento`}
        width={size}
        height={size}
        loading="lazy"
        className={className}
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
    );
  }
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
    >
      {label && <title>{label}</title>}
      {/* Outer flange */}
      <circle cx="32" cy="32" r="30" fill="#15181a" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      {/* Wound filament disc */}
      <circle cx="32" cy="32" r="24" fill={color} />
      {/* Filament wound strands */}
      <g stroke="rgba(0,0,0,0.28)" strokeWidth="0.6" fill="none">
        <circle cx="32" cy="32" r="22" />
        <circle cx="32" cy="32" r="19" />
        <circle cx="32" cy="32" r="16" />
        <circle cx="32" cy="32" r="13" />
      </g>
      {/* Hub */}
      <circle cx="32" cy="32" r="9" fill="#0c0e0d" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
      {/* Center hole */}
      <circle cx="32" cy="32" r="3.4" fill="#000" />
      {/* Specular highlight */}
      <ellipse cx="22" cy="22" rx="7" ry="3" fill="rgba(255,255,255,0.22)" transform="rotate(-35 22 22)" />
    </svg>
  );
}

export default FilamentSpool;