export type SceneKind = 'city' | 'coast' | 'gym' | 'studio' | 'workshop';

const KEYWORDS: [SceneKind, string[]][] = [
  ['gym', ['salud', 'deporte', 'gym', 'gimnasio', 'entren', 'fitness', 'correr', 'yoga', 'cuerpo']],
  ['studio', ['estudio', 'estudiar', 'aprend', 'lectura', 'leer', 'idioma', 'curso', 'musica', 'música', 'arte', 'creativ', 'escrib']],
  ['workshop', ['hogar', 'casa', 'taller', 'proyecto', 'bricolaje', 'limpieza', 'coche', 'reparar', 'jardin', 'jardín']],
  ['coast', ['ocio', 'viaje', 'social', 'familia', 'amigos', 'descanso', 'playa', 'personal', 'medit']],
  ['city', ['trabajo', 'work', 'negocio', 'dinero', 'finanzas', 'oficina', 'empresa', 'clientes']],
];

const ORDER: SceneKind[] = ['city', 'coast', 'gym', 'studio', 'workshop'];

export function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function sceneFor(category: string): SceneKind {
  const c = category.toLowerCase();
  for (const [kind, words] of KEYWORDS) {
    if (words.some(w => c.includes(w))) return kind;
  }
  return ORDER[hashString(c) % ORDER.length];
}

/** Accent per scene, used for chips and the district colour in the city. */
export const SCENE_ACCENT: Record<SceneKind, string> = {
  city: 'var(--color-coral)',
  coast: 'var(--color-teal)',
  gym: 'var(--color-pink)',
  studio: 'var(--color-sun)',
  workshop: 'var(--color-violet-soft)',
};

export const SCENE_LABEL: Record<SceneKind, string> = {
  city: 'Centro',
  coast: 'Costa',
  gym: 'Gimnasio',
  studio: 'Estudio',
  workshop: 'Taller',
};
