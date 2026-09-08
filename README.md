# Sync45 API

Sync45 reconciles Paystack transactions against a configured ledger source,
classifies discrepancies, generates AI insights, and stores completed reports.

## Routes

### `GET /health`

Checks Paystack and the configured ledger connector. Returns `200` with
`status: "ready"` when both are available, or `503` with `status: "degraded"`
when a connector cannot be reached.

### `POST /api/reconciliation/reconcile`

Runs the full reconciliation flow: Paystack -> ledger -> normalization ->
matching -> classification -> report -> AI insights -> report persistence.

Request body:

```json
{
  "organizationId": "org-001",
  "from": "2026-01-01",
  "to": "2026-01-31"
}
```

### `GET /api/reconciliation/reports`

Returns all persisted reconciliation reports. Filter by organization with
`/api/reconciliation/reports?organizationId=org-001`.

### `GET /api/reconciliation/reports/:id`

Returns one persisted report by its report ID. A missing ID returns JSON `404`.

### `POST /api/ai/insights`

Generates AI insights for a report supplied in the request body as
`{ "report": { ... } }`. The response always has `summary`, `risks`,
`recommendations`, `confidence`, and `generatedAt`. If Groq is unavailable,
Sync45 returns a predictable fallback insight instead of failing the request.

## Local testing

1. Install dependencies and create `.env` from your deployment/local settings.
2. Set `PAYSTACK_SECRET_KEY` and choose `LEDGER_SOURCE`:
	`mongodb`, `postgresql`, `mysql`, or `excel`.
3. Configure the selected ledger connection. For AI, set `GROQ_API_KEY`.
4. Start the API:

```bash
npm install
npm run dev
```

5. Check readiness:

```bash
curl http://localhost:5000/health
```

6. Run a reconciliation with the JSON body above, then use the returned report
	ID to test the history endpoints.

Reports are stored in `data/reconciliation-reports.json` by default. Override
this with `RECONCILIATION_STORE_PATH`. On Render, use a persistent disk or an
external database if reports must survive redeploys.

Before deployment, verify `npm run build`, test `/health`, run one real
reconciliation with safe dates, and confirm the report appears in both history
endpoints.
