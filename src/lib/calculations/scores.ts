export const SCORE_LABELS = { 4: "Siempre", 3: "Casi siempre", 2: "Algunas veces", 1: "Nunca" } as const;

export function average(scores: number[]) {
  if (!scores.length) return null;
  return scores.reduce((total, score) => total + score, 0) / scores.length;
}

export function scorePercentage(score: number) {
  if (score < 1 || score > 4) throw new RangeError("El puntaje debe estar entre 1 y 4.");
  return score / 4 * 100;
}
