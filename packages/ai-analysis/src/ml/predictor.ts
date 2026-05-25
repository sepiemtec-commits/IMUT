import type { ReadingPoint } from "../types.js";

export type AnalysisBackend = "statistical" | "tensorflow";

export interface TemperaturePrediction {
  predictedNext: number;
  confidence: number;
  method: AnalysisBackend;
}

/**
 * Contrato para backends de ML.
 * Implementação atual: {@link StatisticalPredictor}.
 * Futuro: {@link TensorFlowPredictor} carregando modelo .json / SavedModel.
 */
export interface MlPredictor {
  readonly backend: AnalysisBackend;
  predictTemperature(readings: ReadingPoint[]): Promise<TemperaturePrediction | null>;
  predictHumidity?(readings: ReadingPoint[]): Promise<TemperaturePrediction | null>;
}

export type MlBackendOption = AnalysisBackend | "auto";

import { StatisticalPredictor } from "./statistical-predictor.js";
import { TensorFlowPredictor } from "./tensorflow-predictor.js";

export function createPredictor(backend: MlBackendOption = "statistical"): MlPredictor {
  if (backend === "tensorflow") return new TensorFlowPredictor();
  return new StatisticalPredictor();
}
