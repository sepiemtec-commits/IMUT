import type { ReadingPoint } from "../types.js";
import type { MlPredictor, TemperaturePrediction } from "./predictor.js";

/**
 * Stub para integração futura com TensorFlow.js / tfjs-node.
 *
 * Passos previstos:
 * 1. npm install @tensorflow/tfjs-node
 * 2. Carregar modelo em models/temperature-lstm/
 * 3. Normalizar features [temp, humidity, hour_sin, hour_cos]
 * 4. Retornar predição com confidence do modelo
 */
export class TensorFlowPredictor implements MlPredictor {
  readonly backend = "tensorflow" as const;
  private loaded = false;

  async loadModel(_modelPath: string): Promise<void> {
    // await tf.loadLayersModel(`file://${modelPath}/model.json`);
    this.loaded = false;
    throw new Error(
      "TensorFlow: instale @tensorflow/tfjs-node e forneça o modelo em ML_MODEL_PATH",
    );
  }

  async predictTemperature(
    _readings: ReadingPoint[],
  ): Promise<TemperaturePrediction | null> {
    if (!this.loaded) {
      await this.loadModel(
        process.env.ML_MODEL_PATH ?? "./models/temperature",
      );
    }
    return null;
  }
}
