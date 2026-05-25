# Módulo de IA — IMUT

Pacote: `@imut/ai-analysis` (TypeScript puro, sem dependência de banco).

## Fluxo em produção

```text
ESP32 → mqtt-ingest → SensorReading
                    → fila ALERTS → worker → evaluateAnomaly()
                                              → Alert (2 ciclos)
                                              → AiInsight
                                              → e-mail responsáveis

Cron domingo → worker → buildWeeklyAnalysis() → WeeklyReport + AiInsight
```

## Regras de alerta

1. **Limite absoluto**: temperatura > `Device.tempMaxCelsius` ou umidade > `Device.humidityMaxPercent`
2. **2 ciclos consecutivos** (4 min cada): `Device.alertAfterCycles` (padrão 2)
3. **Elevação anormal**: valor > média móvel + 2× desvio padrão das leituras anteriores
4. **Ambiente afetado**: `environment` da leitura / device

## TensorFlow

Defina `ML_BACKEND=tensorflow` e coloque o modelo em `ML_MODEL_PATH`. Até lá, use `statistical` (regressão linear para projeção).

Ver `packages/ai-analysis/README.md`.
