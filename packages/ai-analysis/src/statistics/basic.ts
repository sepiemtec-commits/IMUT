export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function standardDeviation(values: number[]): number | null {
  if (values.length < 2) return null;
  const m = mean(values)!;
  const variance =
    values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function min(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.min(...values);
}

export function max(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.max(...values);
}

/** Últimos valores que excedem o limite, em ordem cronológica */
export function countTrailingAbove(values: number[], limit: number): number {
  let count = 0;
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] > limit) count++;
    else break;
  }
  return count;
}
