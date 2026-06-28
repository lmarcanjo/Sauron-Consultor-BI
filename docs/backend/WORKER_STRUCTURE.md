# SAURON BACKEND — WORKER MICROSERVICE STRUCTURE

---

## 1. DIRECTORY STRUCTURE

The worker service is optimized for single-responsibility job processing:
```
apps/worker/
  └── src/
       ├── main.ts               # Listener bootstrap
       ├── contracts/            # Type-safe job payload contracts
       │    └── job.contracts.ts
       ├── health/               # Observability and connection monitors
       │    └── worker-health.ts
       └── processor/            # Execution loop routing
            └── job.processor.ts
```

---

## 2. BACKOFF RETRY & EXCEPTION STRATEGIES

The `JobProcessor` implements strict fault-tolerance policies:
- **Max Attempts**: Standardized to `3` executions.
- **Exponential Backoff**: Subsequent retries scale using:
  $$\text{Delay} = \text{defaultDelay} \times 2^{\text{attempt} - 1}$$
- **Quarantine Routine**: If a job fails terminally across all attempts, it is quarantined in the **Dead-Letter Queue (DLQ)** to prevent thread blocking and memory inflation.

---

## 3. INTEGRATED JOB DIRECTORY

1. **`spreadsheet.import`**: Coordinates bulk sheet parsing.
2. **`story.export`**: Generates high-contrast PDFs or executive reports.
3. **`compensation.generate`**: Calculates strategic salary distributions and payout matrices.
4. **`meeting.summary`**: Generates bulleted case histories.
5. **`data.sync`**: Cleans and matches raw database records.
