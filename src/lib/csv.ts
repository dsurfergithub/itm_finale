import { Mission } from '../types';
import { MissionDraft, normalizeDifficulty, suggestRewards } from './missions';

export const CSV_HEADERS = ['NOMBRE', 'DIFICULTAD', 'UBICACION', 'DURACION_MINUTOS', 'RECOMPENSA_CASH', 'RECOMPENSA_RESPETO', 'CATEGORIA', 'RECURRENCIA'];

export interface CsvRow {
  line: number;
  draft: MissionDraft;
  errors: string[];
  duplicate: boolean;
}

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toUpperCase();

/** Minimal RFC 4180 parser: quoted fields, escaped quotes, comma or semicolon. */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, '');
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(field.trim());
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(field.trim());
      if (row.some(c => c !== '')) rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  row.push(field.trim());
  if (row.some(c => c !== '')) rows.push(row);
  return rows;
}

const RECURRENCE: Record<string, MissionDraft['recurrence']> = { DIARIA: 'DAILY', DAILY: 'DAILY', SEMANAL: 'WEEKLY', WEEKLY: 'WEEKLY' };

export function previewCsv(text: string, existing: Mission[]): CsvRow[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const header = rows[0].map(normalize);
  const hasHeader = header.includes('NOMBRE') || header.includes('NAME');
  const col = (name: string, fallback: number) => {
    const index = header.indexOf(name);
    return hasHeader && index !== -1 ? index : fallback;
  };
  const idx = {
    name: col('NOMBRE', 0),
    difficulty: col('DIFICULTAD', 1),
    location: col('UBICACION', 2),
    minutes: col('DURACION_MINUTOS', 3),
    cash: col('RECOMPENSA_CASH', 4),
    respect: col('RECOMPENSA_RESPETO', 5),
    category: col('CATEGORIA', 6),
    recurrence: col('RECURRENCIA', 7),
  };

  const seen = new Set(existing.filter(m => !m.archived).map(m => `${normalize(m.name)}|${normalize(m.category)}`));

  return rows.slice(hasHeader ? 1 : 0).map((cells, i) => {
    const get = (index: number) => cells[index]?.trim() ?? '';
    const errors: string[] = [];
    const name = get(idx.name);
    if (!name) errors.push('Falta el nombre');
    const minutes = parseInt(get(idx.minutes), 10);
    if (!Number.isFinite(minutes) || minutes <= 0) errors.push('Duración no válida');
    const difficulty = normalizeDifficulty(get(idx.difficulty) || 'NORMAL');
    const suggested = suggestRewards(Number.isFinite(minutes) && minutes > 0 ? minutes : 30, difficulty);
    const cash = parseInt(get(idx.cash), 10);
    const respect = parseInt(get(idx.respect), 10);

    const draft: MissionDraft = {
      name,
      difficulty,
      location: get(idx.location),
      minutes: Number.isFinite(minutes) && minutes > 0 ? minutes : 30,
      rewardCash: Number.isFinite(cash) && cash >= 0 ? cash : suggested.rewardCash,
      rewardRespect: Number.isFinite(respect) && respect >= 0 ? respect : suggested.rewardRespect,
      category: get(idx.category) || 'General',
      recurrence: RECURRENCE[normalize(get(idx.recurrence))] ?? 'NONE',
    };

    const key = `${normalize(draft.name)}|${normalize(draft.category)}`;
    const duplicate = !!name && seen.has(key);
    seen.add(key);
    return { line: i + (hasHeader ? 2 : 1), draft, errors, duplicate };
  });
}

const quote = (value: string | number) => {
  const s = String(value);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const RECURRENCE_OUT = { NONE: '', DAILY: 'DIARIA', WEEKLY: 'SEMANAL' } as const;

export function missionsToCsv(missions: Mission[]): string {
  const lines = missions.map(m =>
    [m.name, m.difficulty, m.location, Math.round(m.durationSeconds / 60), m.rewardCash, m.rewardRespect, m.category, RECURRENCE_OUT[m.recurrence]]
      .map(quote)
      .join(','),
  );
  const example = lines.length ? [] : ['Revisar correo,EASY,Oficina,15,600,60,Trabajo,DIARIA', 'Entrenamiento,HARD,Gimnasio,45,3950,395,Salud,'];
  return [CSV_HEADERS.join(','), ...lines, ...example].join('\n') + '\n';
}

export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
