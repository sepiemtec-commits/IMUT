# @imut/ai-analysis

Módulo de inteligência para **temperatura** e **umidade** — estatística simples hoje, **TensorFlow** amanhã.

## Capacidades

| Função | Método |
|--------|--------|
| Detectar elevação anormal | `evaluateAnomaly()` — média móvel + desvio padrão |
| Comparar últimas leituras | histórico ordenado + `countTrailingAbove` |
| Alerta após 2 ciclos consecutivos | `consecutiveCyclesRequired` (padrão 2) |
| Identificar ambiente | campo `environment` em cada leitura |
| Análise semanal | `buildWeeklyAnalysis()` |

## Estatística

- **Média móvel** (`movingAverage`, `lastMovingAverage`)
- **Tendência temporal** — regressão linear (`linearTrend`)
- **Limite absoluto** + **N ciclos consecutivos** acima do limite

## TensorFlow (futuro)

```ts
import { createPredictor } from "@imut/ai-analysis";

const predictor = createPredictor("tensorflow"); // quando ML_MODEL_PATH estiver pronto
```

Implementar em `src/ml/tensorflow-predictor.ts` com `@tensorflow/tfjs-node`.

Variável de ambiente: `ML_BACKEND=statistical|tensorflow`

## Uso

```ts
import { evaluateAnomaly, buildWeeklyAnalysis } from "@imut/ai-analysis";

const result = evaluateAnomaly(readings, {
  tempMaxCelsius: 28,
  humidityMaxPercent: 75,
  consecutiveCyclesRequired: 2,
  movingAverageWindow: 6,
  elevationStdMultiplier: 2,
});

if (result.shouldAlert) {
  console.log(result.environment, result.reason);
}
```

## Testes

```bash
pnpm --filter @imut/ai-analysis test
```
