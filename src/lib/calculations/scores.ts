export const SCORE_LABELS = { 4: "Siempre", 3: "Casi siempre", 2: "Algunas veces", 1: "Nunca" } as const;

export function average(scores: number[]) {
  if (!scores.length) return null;
  return scores.reduce((total, score) => total + score, 0) / scores.length;
}

export function scorePercentage(score: number) {
  if (score < 1 || score > 4) throw new RangeError("El puntaje debe estar entre 1 y 4.");
  return score / 4 * 100;
}

const scoreFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const percentageFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

export function formatScore(score: number) {
  return scoreFormatter.format(score);
}

export function formatScorePercentage(score: number) {
  const percentage = score === 0 ? 0 : scorePercentage(score);
  return `${percentageFormatter.format(percentage)} %`;
}

export function formatScoreResult(score: number) {
  return `${formatScore(score)} / 4 · ${formatScorePercentage(score)}`;
}
