import { mean } from "./basic.js";

/**
 * Média móvel simples (SMA). Retorna série alinhada ao fim da janela.
 */
export function movingAverage(values: number[], window: number): number[] {
  if (window < 1 || values.length < window) return [];
  const result: number[] = [];
  for (let i = window - 1; i < values.length; i++) {
    const slice = values.slice(i - window + 1, i + 1);
    result.push(mean(slice)!);
  }
  return result;
}

export function lastMovingAverage(
  values: number[],
  window: number,
): number | null {
  const series = movingAverage(values, window);
  return series.length > 0 ? series[series.length - 1]! : null;
}
