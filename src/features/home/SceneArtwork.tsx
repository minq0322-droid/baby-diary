import { useId } from 'react';
import type { SceneChoice } from './sceneChoice';

export function SceneObject({ scene }: { scene: SceneChoice; }) {
  const hillGradient = useId();
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      {scene === 'sunset' && <>
        <defs>
          <linearGradient id={hillGradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a98caa" stopOpacity=".65" />
            <stop offset=".45" stopColor="#a98caa" stopOpacity=".45" />
            <stop offset="1" stopColor="#a98caa" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M7 51C8 46 18 44 24 42C34 37 42 42 49 45C55 47 58 50 56 53C51 60 13 61 7 55C6 54 6 52 7 51Z" fill={`url(#${hillGradient})`} />
        <path d="M26 34H43V49H26Z" fill="#b77e78" />
        <path d="M22 35L34 24L47 35Z" fill="#806278" />
        <path className="scene-glow" d="M32 38H38V44H32Z" fill="#fff2b8" />
      </>}
      {scene === 'dandelion' && <g className="scene-seed-sway">
        <path d="M32 24Q30 34 34 46" fill="none" stroke="#b4a382" strokeWidth="1" />
        <g fill="none" stroke="#fffcef" strokeWidth="1" strokeLinecap="round">
          <path d="M32 24L16 17M32 24L20 12M32 24L26 9M32 24V8M32 24L38 9M32 24L44 12M32 24L48 17" />
          <path d="M13 18L16 17L16 14M17 13L20 12L21 9M23 10L26 9L28 7M29 8H35M36 7L38 9L41 10M43 9L44 12L47 13M48 14V17L51 18" opacity=".75" />
        </g>
        <ellipse cx="34" cy="47" rx="1.5" ry="4" fill="#b4a382" />
        <g transform="translate(0 17) rotate(-15 32 25)">
          <ellipse cx="32" cy="25" rx="7" ry="9" fill="#463c38" />
          <circle cx="32" cy="16" r="3" fill="#463c38" />
          <path className="ladybug-wing" d="M32 17C20 17 23 36 32 33Z" fill="#cf3f35" />
          <path d="M33 17C43 17 42 34 33 33Z" fill="#ef5843" />
          <g fill="#52403c"><circle cx="28" cy="23" r="1.4" /><circle cx="28" cy="29" r="1.2" /><circle cx="36" cy="25" r="1.5" /></g>
        </g>
      </g>}
      {scene === 'moon' && <path className="scene-glow" d="M32 19Q34 30 45 32Q34 34 32 45Q30 34 19 32Q30 30 32 19Z" fill="#fff0bf" />}
      {scene === 'lantern' && <g className="scene-glow">
        <path d="M25 22Q32 19 39 22L38 40Q32 44 26 40Z" fill="#ffd18c" />
        <path d="M28 23L29 40M35 23L35 40" stroke="#b88462" fill="none" />
        <path d="M29 41H35" stroke="#ffe4a2" strokeWidth="2" />
      </g>}
    </svg>
  );
}

export function SceneThumbnail({ scene }: { scene: SceneChoice; }) {
  const night = scene === 'moon' || scene === 'lantern';
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" fill={night ? '#202b44' : scene === 'sunset' ? '#efc4cf' : '#dce7c9'} />
      {scene === 'sunset' && <>
        <circle cx="24" cy="24" r="11" fill="#ffe5ae" />
        <path d="M0 47Q20 27 43 48T70 44V64H0" fill="#b396b1" />
        <path d="M0 58Q35 39 64 53V64H0" fill="#907e9b" />
      </>}
      {scene === 'dandelion' && <>
        <path d="M30 64Q35 42 28 27" stroke="#77916a" fill="none" />
        {Array.from({ length: 12 }, (_, i) => <path key={i} d="M28 27L28 12M24 13L28 16L32 13" transform={`rotate(${i * 30} 28 27)`} stroke="#fffcef" fill="none" />)}
        <circle cx="28" cy="27" r="5" fill="#d7ba7b" />
      </>}
      {night && <>
        <g fill="#f6e5bd"><circle cx="12" cy="14" r="1" /><circle cx="48" cy="21" r="1" /><circle cx="43" cy="52" r="1" /></g>
        {scene === 'moon' ? <circle cx="31" cy="31" r="14" fill="#e1e9ea" /> : <>
          <path d="M20 18Q32 13 44 18L41 42Q32 48 23 42Z" fill="#edc28b" />
          <path d="M32 45V55" stroke="#d1a36f" />
        </>}
      </>}
    </svg>
  );
}
