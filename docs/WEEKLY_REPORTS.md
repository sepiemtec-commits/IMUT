# Relatório semanal automático — IMUT

## Agendamento (BullMQ)

- Fila: `reports`
- Job: `weekly-report`
- Cron: **domingo 08:00** (timezone da empresa)
- Apenas empresas com assinatura `ACTIVE` ou `TRIALING`

```bash
pnpm worker:dev
```

## Pipeline

```text
1. Buscar leituras (7 dias) + alertas
2. @imut/ai-analysis — temperatura, umidade, tendências
3. PDFKit — gerar PDF
4. Salvar WeeklyReport + pdfPath
5. Nodemailer — e-mail ao administrador (owner) + responsáveis
```

## Conteúdo do relatório

- Resumo executivo
- Temperatura e umidade por ambiente (média, min, máx, tendência)
- Insights automáticos
- Lista de alertas do período (até 50 no PDF)
- Anexo PDF no e-mail

## Variáveis

```env
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM=relatorios@imut.app
REPORTS_STORAGE_PATH=storage/reports
```

## Disparo manual (teste)

```ts
// Redis + worker ativos
await reportsQueue.add('weekly-report', { companyId: '...' });
```

## API mobile

`GET /v1/reports/weekly` — lista relatórios (summary + metrics; `pdfPath` no servidor).
