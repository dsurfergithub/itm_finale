import type { Mission, Difficulty } from "../types";
import { uid } from "./game";
const difficulties: Difficulty[] = [
  "EASY",
  "NORMAL",
  "HARD",
  "VETERAN",
  "EXTREME",
  "INSANE",
];
// RFC 4180 fields, including escaped quotes, separators and newlines inside quotes.
export function parseRows(text: string): string[][] {
  const first = text.replace(/^\uFEFF/, "").split(/\r?\n/)[0];
  const delimiter =
    (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0)
      ? ";"
      : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '"') {
      if (quoted && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === delimiter && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && input[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw new Error("Hay comillas sin cerrar en el CSV.");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
export function importMissions(text: string): Mission[] {
  const rows = parseRows(text);
  if (rows.length < 2)
    throw new Error("Añade al menos una misión debajo de la cabecera.");
  return rows.slice(1).map((r, i) => {
    const [name, difficulty, location, minutes, cash, respect, category] = r;
    const nums = [minutes, cash, respect].map(Number);
    if (
      r.length < 7 ||
      !name ||
      !location ||
      !category ||
      !difficulties.includes(difficulty as Difficulty) ||
      [minutes, cash, respect].some((n) => n === "") ||
      nums.some((n) => !Number.isFinite(n) || n < 0) ||
      nums[0] <= 0 ||
      nums[0] > 1440
    )
      throw new Error(
        `Revisa la fila ${i + 2}: nombre, dificultad, lugar, minutos (1–1440), créditos, respeto y categoría.`,
      );
    return {
      id: uid(),
      name,
      difficulty: difficulty as Difficulty,
      location,
      durationSeconds: Math.round(nums[0] * 60),
      timeRemaining: Math.round(nums[0] * 60),
      rewardCash: nums[1],
      rewardRespect: nums[2],
      category: category.toUpperCase(),
      status: "IDLE",
      recurrence: "none",
    };
  });
}
const quote = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
export function exportMissions(missions: Mission[]) {
  const header =
    "NOMBRE,DIFICULTAD,UBICACION,DURACION_MINUTOS,RECOMPENSA_CASH,RECOMPENSA_RESPETO,CATEGORIA";
  return (
    "\uFEFF" +
    header +
    "\r\n" +
    missions
      .map((m) =>
        [
          m.name,
          m.difficulty,
          m.location,
          m.durationSeconds / 60,
          m.rewardCash,
          m.rewardRespect,
          m.category,
        ]
          .map(quote)
          .join(","),
      )
      .join("\r\n")
  );
}
export function downloadFile(
  name: string,
  content: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
