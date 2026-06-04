export function getRankData(respect: number) {
  const levels = [
    { min: 0, max: 1000, name: 'NOVATO' },
    { min: 1000, max: 5000, name: 'SICARIO' },
    { min: 5000, max: 15000, name: 'CAPO' },
    { min: 15000, max: 50000, name: 'JEFE SUPREMO' },
    { min: 50000, max: 1000000, name: 'OG INTERNACIONAL' }
  ];

  let currentLevel = levels[0];
  for (const level of levels) {
    if (respect >= level.min) {
      currentLevel = level;
    }
  }

  let percentage = 100;
  if (currentLevel.name !== 'OG INTERNACIONAL') {
    const range = currentLevel.max - currentLevel.min;
    const progress = respect - currentLevel.min;
    percentage = Math.floor((progress / range) * 100);
  }

  return { rank: currentLevel.name, percentage };
}
