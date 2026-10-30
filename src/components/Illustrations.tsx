import { useId } from 'react';
import { District } from '../types';
import { hashString, SceneKind, sceneFor } from '../lib/scenes';

const NIGHT = '#1b0f1e';
const DUSK = '#3a1d42';

/** Deterministic pseudo-random sequence so illustrations don't change between renders. */
function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x6d2b79f5) >>> 0;
    return (s % 10000) / 10000;
  };
}

/** Palm tree silhouette rising from (x, baseY). */
function Palm({ x, baseY, h, lean = 1, color = NIGHT }: { x: number; baseY: number; h: number; lean?: number; color?: string }) {
  const topX = x + lean * h * 0.18;
  const topY = baseY - h;
  const leaves = [-150, -115, -70, -30, 10, 40].map(angle => {
    const rad = (angle * Math.PI) / 180;
    const len = h * 0.42;
    const ex = topX + Math.cos(rad) * len;
    const ey = topY + Math.sin(rad) * len * 0.4 + len * 0.45;
    const mx = (topX + ex) / 2;
    const my = Math.min(topY, ey) - len * 0.18;
    const w = len * 0.12;
    return `M${topX},${topY} Q${mx},${my - w} ${ex},${ey} Q${mx},${my + w * 1.6} ${topX},${topY}Z`;
  });
  return (
    <g fill={color}>
      <path d={`M${x - h * 0.03},${baseY} Q${x + lean * h * 0.02},${baseY - h * 0.55} ${topX},${topY} L${topX + h * 0.035},${topY + 2} Q${x + lean * h * 0.06},${baseY - h * 0.5} ${x + h * 0.04},${baseY}Z`} />
      {leaves.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
}

function Sun({ cx, cy, r, id }: { cx: number; cy: number; r: number; id: string }) {
  const stripes = [0.25, 0.42, 0.58, 0.72, 0.84];
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sun`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a3" />
          <stop offset="0.55" stopColor="#ffb36b" />
          <stop offset="1" stopColor="#ff6f73" />
        </linearGradient>
        <mask id={`${id}-sunmask`}>
          <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill="#fff" />
          {stripes.map((s, i) => (
            <rect key={i} x={cx - r} y={cy + r * (s * 2 - 1) + 4} width={r * 2} height={1.5 + i * 1.1} fill="#000" />
          ))}
        </mask>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-sun)`} mask={`url(#${id}-sunmask)`} />
    </g>
  );
}

const SKIES: Record<SceneKind, [string, string, string]> = {
  city: ['#ffb36b', '#ff6f6f', '#6b3aa8'],
  coast: ['#ffd27a', '#ff7f8f', '#5a4ab8'],
  gym: ['#ff9a6a', '#ff4f8b', '#5b2a9a'],
  studio: ['#ffd98a', '#ff8a6a', '#7b3a8e'],
  workshop: ['#ffa66a', '#e8508a', '#3e2a8a'],
};

/** Illustrated strip for cards and hero areas, chosen from the mission category. */
export function Scene({ category, className = '', seed }: { category: string; className?: string; seed?: string }) {
  const id = useId().replace(/:/g, '');
  const kind = sceneFor(category);
  const rand = rng(hashString(seed ?? category));
  const [top, mid, bottom] = SKIES[kind];
  const W = 400;
  const H = 160;
  const ground = 132;

  const far = Array.from({ length: 12 }, (_, i) => ({ x: i * 36 - 10, w: 30 + rand() * 18, h: 26 + rand() * 30 }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={bottom} />
          <stop offset="0.55" stopColor={mid} />
          <stop offset="1" stopColor={top} />
        </linearGradient>
        <linearGradient id={`${id}-sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff8f86" />
          <stop offset="1" stopColor="#3b2a7a" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-sky)`} />
      <Sun cx={kind === 'coast' ? 200 : 120 + rand() * 160} cy={kind === 'coast' ? 112 : 92} r={kind === 'coast' ? 46 : 38} id={id} />

      {kind !== 'coast' && (
        <g fill={DUSK} opacity="0.75">
          {far.map((b, i) => (
            <rect key={i} x={b.x} y={ground - b.h - 8} width={b.w} height={b.h + 8} />
          ))}
        </g>
      )}

      {kind === 'city' && <CityLayer rand={rand} ground={ground} />}
      {kind === 'coast' && (
        <g>
          <rect y={112} width={W} height={H - 112} fill={`url(#${id}-sea)`} />
          {[118, 126, 136, 148].map((y, i) => (
            <rect key={y} x={150 - i * 14} y={y} width={100 + i * 28} height={1.6} fill="#ffd6a0" opacity={0.7 - i * 0.12} />
          ))}
          <path d={`M0,${H} L0,138 Q60,128 120,${H}Z`} fill={NIGHT} />
          <path d={`M${W},${H} L${W},132 Q330,126 270,${H}Z`} fill={NIGHT} />
          <Palm x={40} baseY={146} h={92} lean={1} />
          <Palm x={74} baseY={152} h={64} lean={-1} />
          <Palm x={352} baseY={144} h={100} lean={-1} />
        </g>
      )}
      {kind === 'gym' && (
        <g fill={NIGHT}>
          <rect x={150} y={96} width={170} height={ground - 96 + 30} />
          <rect x={172} y={70} width={10} height={26} />
          <rect x={286} y={70} width={10} height={26} />
          <rect x={160} y={78} width={150} height={9} rx={4} />
          <rect x={150} y={60} width={16} height={44} rx={4} />
          <rect x={302} y={60} width={16} height={44} rx={4} />
          <rect x={168} y={108} width={134} height={6} fill={mid} opacity="0.85" />
          <rect x={0} y={ground} width={W} height={H - ground} />
          <Palm x={95} baseY={ground + 2} h={96} lean={1} />
          <Palm x={360} baseY={ground + 2} h={80} lean={-1} />
        </g>
      )}
      {kind === 'studio' && (
        <g>
          <path d={`M120,${ground} V70 Q200,34 280,70 V${ground}Z`} fill={NIGHT} />
          <path d={`M168,${ground - 6} V92 Q200,72 232,92 V${ground - 6}Z`} fill="#ffc65c" opacity="0.9" />
          <rect x={198} y={80} width={4} height={ground - 86} fill={NIGHT} />
          <rect x={168} y={106} width={64} height={4} fill={NIGHT} />
          <rect x={0} y={ground} width={W} height={H - ground} fill={NIGHT} />
          <circle cx={92} cy={ground - 14} r={16} fill={NIGHT} />
          <rect x={88} y={ground - 10} width={8} height={12} fill={NIGHT} />
          <Palm x={330} baseY={ground + 2} h={90} lean={-1} />
          <Palm x={52} baseY={ground + 2} h={70} lean={1} />
        </g>
      )}
      {kind === 'workshop' && (
        <g>
          <path d={`M110,${ground} V86 L200,58 L290,86 V${ground}Z`} fill={NIGHT} />
          <rect x={140} y={96} width={120} height={ground - 96} fill="#ff8a6a" opacity="0.9" />
          {[0, 1, 2, 3, 4, 5].map(i => (
            <rect key={i} x={140} y={100 + i * 6} width={120} height={2} fill={NIGHT} opacity="0.55" />
          ))}
          <rect x={0} y={ground} width={W} height={H - ground} fill={NIGHT} />
          <path d={`M300,${ground} q4,-16 22,-18 h34 q14,0 22,12 l14,4 v2Z`} fill={NIGHT} />
          <circle cx={318} cy={ground} r={7} fill={NIGHT} />
          <circle cx={372} cy={ground} r={7} fill={NIGHT} />
          <Palm x={60} baseY={ground + 2} h={98} lean={1} />
        </g>
      )}
    </svg>
  );
}

function CityLayer({ rand, ground }: { rand: () => number; ground: number }) {
  const buildings = Array.from({ length: 9 }, (_, i) => {
    const w = 26 + rand() * 22;
    return { x: 18 + i * 42 + rand() * 6, w, h: 40 + rand() * 62 };
  });
  return (
    <g>
      {buildings.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={ground - b.h} width={b.w} height={b.h + 30} fill={NIGHT} />
          {Array.from({ length: Math.floor(b.h / 16) }, (_, r) =>
            [0, 1].map(c =>
              rand() > 0.55 ? (
                <rect key={`${r}-${c}`} x={b.x + 6 + c * (b.w / 2 - 2)} y={ground - b.h + 8 + r * 14} width={5} height={6} fill="#ffc65c" opacity="0.85" />
              ) : null,
            ),
          )}
        </g>
      ))}
      <rect x={0} y={ground} width={400} height={30} fill={NIGHT} />
      <Palm x={8} baseY={ground + 2} h={84} lean={1} />
      <Palm x={392} baseY={ground + 2} h={70} lean={-1} />
    </g>
  );
}

/** ITM monogram: sunset tile with block letters. Same artwork as the app icon. */
export function Monogram({ size = 40, className = '' }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} role="img" aria-label="Into The Mission">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#ff9a5a" />
          <stop offset="0.5" stopColor="#ff4f8b" />
          <stop offset="1" stopColor="#5b2fb0" />
        </linearGradient>
      </defs>
      <clipPath id={`${id}-tile`}>
        <rect width="512" height="512" rx="112" />
      </clipPath>
      <rect width="512" height="512" rx="112" fill={`url(#${id}-bg)`} />
      <circle cx="256" cy="250" r="150" fill="#ffd27a" opacity="0.55" />
      <path clipPath={`url(#${id}-tile)`} d="M0,420 H40 V372 H78 V398 H112 V350 H150 V404 H360 V362 H392 V340 H430 V388 H472 V366 H512 V512 H0Z" fill={NIGHT} opacity="0.9" />
      <g transform="translate(256 240) skewX(-8) translate(-256 -240)">
        <g fill={NIGHT} opacity="0.35" transform="translate(0 10)">
          <ITMLetters />
        </g>
        <g fill="#fbeee0">
          <ITMLetters />
        </g>
      </g>
    </svg>
  );
}

function ITMLetters() {
  return (
    <>
      <rect x="66" y="150" width="48" height="180" />
      <rect x="130" y="150" width="130" height="46" />
      <rect x="171" y="150" width="48" height="180" />
      <path d="M276 330 V150 H326 L361 232 L396 150 H446 V330 H402 V236 L374 300 H348 L320 236 V330 Z" />
    </>
  );
}

const DISTRICT_COLORS = ['#ff7a59', '#3fd0c9', '#ff4f8b', '#ffc65c', '#a98bff', '#7fe0a8'];

export function districtColor(index: number) {
  return DISTRICT_COLORS[index % DISTRICT_COLORS.length];
}

export function districtLevel(d: District) {
  return Math.min(6, 1 + Math.floor(d.completions / 3));
}

/**
 * The player's city along the shore. Each district grows buildings as missions are
 * completed there, and each rank adds a landmark (lights, pier, Ferris wheel, fireworks).
 */
export function CityPanorama({
  districts,
  rankIndex,
  selectedId,
  onSelect,
}: {
  districts: District[];
  rankIndex: number;
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  const id = useId().replace(/:/g, '');
  const slot = 150;
  const W = Math.max(600, districts.length * slot + 120);
  const H = 300;
  const shore = 220;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-full" style={{ minWidth: `${Math.max(100, (W / 600) * 100)}%` }} role="img" aria-label="Tu ciudad">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a1f6e" />
          <stop offset="0.45" stopColor="#d9467f" />
          <stop offset="0.8" stopColor="#ff8a5c" />
          <stop offset="1" stopColor="#ffc46e" />
        </linearGradient>
        <linearGradient id={`${id}-sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9a7a" />
          <stop offset="0.4" stopColor="#8a4a9e" />
          <stop offset="1" stopColor="#2b1a52" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-sky)`} />
      <Sun cx={W * 0.62} cy={shore - 20} r={70} id={id} />

      {rankIndex >= 4 &&
        [0.2, 0.42, 0.8].map((fx, i) => (
          <g key={i} transform={`translate(${W * fx} ${50 + i * 14})`} stroke={['#ffe9a3', '#3fd0c9', '#ff9ac0'][i]} strokeWidth="2" strokeLinecap="round">
            {Array.from({ length: 10 }, (_, k) => {
              const a = (k / 10) * Math.PI * 2;
              return <line key={k} x1={Math.cos(a) * 6} y1={Math.sin(a) * 6} x2={Math.cos(a) * 18} y2={Math.sin(a) * 18} />;
            })}
          </g>
        ))}

      <rect y={shore} width={W} height={H - shore} fill={`url(#${id}-sea)`} />
      {[8, 18, 30, 46].map((dy, i) => (
        <rect key={dy} x={W * 0.62 - 90 + i * 10} y={shore + dy} width={180 - i * 20} height={2} fill="#ffd6a0" opacity={0.6 - i * 0.12} />
      ))}

      {rankIndex >= 2 && (
        <g fill={NIGHT}>
          <rect x={W - 150} y={shore + 6} width={120} height={6} />
          {[0, 1, 2, 3, 4].map(i => (
            <rect key={i} x={W - 146 + i * 28} y={shore + 6} width={4} height={26} />
          ))}
          <path d={`M${W - 250},${shore + 40} h46 l-8,10 h-30Z M${W - 228},${shore + 40} v-24 l14,20Z`} />
        </g>
      )}

      {rankIndex >= 3 && (
        <g transform={`translate(70 ${shore - 64})`} stroke={NIGHT} strokeWidth="3" fill="none">
          <circle r="52" />
          {Array.from({ length: 8 }, (_, k) => {
            const a = (k / 8) * Math.PI * 2;
            return <line key={k} x1="0" y1="0" x2={Math.cos(a) * 52} y2={Math.sin(a) * 52} />;
          })}
          <path d="M-30,64 L0,0 L30,64" strokeWidth="5" />
        </g>
      )}

      {districts.map((d, i) => {
        const x0 = 100 + i * slot;
        const level = districtLevel(d);
        const rand = rng(hashString(d.id + d.name));
        const color = districtColor(i);
        const selected = d.id === selectedId;
        const kind = sceneFor(d.name);
        const buildings = Array.from({ length: level + 1 }, (_, b) => ({
          x: x0 + 8 + b * ((slot - 36) / (level + 1)),
          w: (slot - 36) / (level + 1) - 4,
          h: 24 + level * 12 + rand() * (18 + level * 10),
        }));
        return (
          <g
            key={d.id}
            onClick={() => onSelect?.(d.id)}
            className={onSelect ? 'cursor-pointer' : undefined}
            role={onSelect ? 'button' : undefined}
            aria-label={`${d.name}, nivel ${level}`}
          >
            <rect x={x0 - 4} y={60} width={slot - 20} height={shore - 40} fill="transparent" />
            {buildings.map((b, k) => (
              <g key={k}>
                <rect x={b.x} y={shore - b.h} width={b.w} height={b.h} fill={NIGHT} />
                <rect x={b.x} y={shore - b.h} width={b.w} height={3} fill={color} />
                {Array.from({ length: Math.floor(b.h / 14) - 1 }, (_, r) =>
                  rand() > 0.45 ? <rect key={r} x={b.x + b.w / 2 - 2} y={shore - b.h + 10 + r * 14} width={4} height={5} fill={color} opacity="0.85" /> : null,
                )}
              </g>
            ))}
            {kind === 'coast' || kind === 'gym' ? <Palm x={x0 + slot - 26} baseY={shore} h={60} lean={-1} /> : null}
            {selected && <rect x={x0 - 2} y={shore + 4} width={slot - 24} height={4} rx={2} fill="#fbeee0" />}
          </g>
        );
      })}

      <rect y={shore} width={W} height={4} fill={NIGHT} />
      {rankIndex >= 1 &&
        Array.from({ length: Math.floor(W / 40) }, (_, i) => (
          <circle key={i} cx={20 + i * 40} cy={shore - 2} r={2.2} fill="#ffe9a3" />
        ))}
      <Palm x={30} baseY={shore + 2} h={90} lean={1} />
    </svg>
  );
}
