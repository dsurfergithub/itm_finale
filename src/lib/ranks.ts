export interface Rank {
  min: number;
  name: string;
  /** What this rank unlocks in the city, shown as the next goal. */
  unlock: string;
}

export const RANKS: Rank[] = [
  { min: 0, name: 'Recién llegado', unlock: 'Tu primer distrito' },
  { min: 1000, name: 'Vecino', unlock: 'Paseo marítimo iluminado' },
  { min: 5000, name: 'Conocido', unlock: 'Muelle y barcos en la bahía' },
  { min: 15000, name: 'Figura local', unlock: 'Noria en el paseo' },
  { min: 50000, name: 'Leyenda de la costa', unlock: 'Fuegos artificiales sobre la ciudad' },
];

export function getRankIndex(respect: number): number {
  let index = 0;
  RANKS.forEach((rank, i) => {
    if (respect >= rank.min) index = i;
  });
  return index;
}

export function getRankData(respect: number) {
  const index = getRankIndex(respect);
  const current = RANKS[index];
  const next = RANKS[index + 1];
  const percentage = next ? Math.floor(((respect - current.min) / (next.min - current.min)) * 100) : 100;
  return {
    index,
    rank: current.name,
    percentage: Math.max(0, Math.min(100, percentage)),
    next,
    toNext: next ? next.min - respect : 0,
  };
}
