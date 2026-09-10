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

### `POST /api/reconciliation/upload-csv`

Adds a request-scoped CSV ledger file. The endpoint accepts a multipart form
field named `file`, validates that the uploaded file is a CSV, validates the
required columns (`reference`, `amount`, `currency`, `status`, `customer`,
`paidAt`), and returns a safe JSON response containing a `fileId`.

### `POST /api/ai/insights`

Generates AI insights for a report supplied in the request body as
`{ "report": { ... } }`. The response always has `summary`, `risks`,
`recommendations`, `confidence`, and `generatedAt`. If Groq is unavailable,
Sync45 returns a predictable fallback insight instead of failing the request.

### CSV reconciliation workflow

1. Upload a CSV by sending a multipart form with the file field named `file` to
   `POST /api/reconciliation/upload-csv`.
2. Receive a `fileId` in the response.
3. Point the same reconciliation request at `ledgerSource: "csv"` and send
   `csvFileId` in the request body.
4. The service uses the CSV file as the ledger source and continues through the
   standard Paystack -> CSV ledger -> normalization -> matching ->
   classification -> AI -> persistence pipeline.

Example CSV:

```csv
reference,amount,currency,status,customer,paidAt
SYNC45-TEST-001,5000,NGN,success,test1@example.com,2026-09-01
SYNC45-TEST-002,3000,NGN,success,test2@example.com,2026-09-01
```

Example reconciliation body:

```json
{
  "organizationId": "org-001",
  "from": "2026-09-01",
  "to": "2026-09-30",
  "ledgerSource": "csv",
  "csvFileId": "<fileId from upload-csv>"
}
```

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
