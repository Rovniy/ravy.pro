# Error monitoring & alerts (GCP-native)

The app runs on Firebase App Hosting (Cloud Run / GCP). Server `console.*` flows
to **Cloud Logging**; genuine failures are emitted as structured `severity:ERROR`
entries with a stack trace and the `ReportedErrorEvent` `@type`, so **Cloud Error
Reporting** groups them automatically. Browser errors are forwarded by
`plugins/error-reporting.client.ts` → `POST /api/client-error` → the same
pipeline, tagged `context.kind = "client"`.

What's in code (already done):

- `server/utils/report-error.ts` — `reportServerError` / `reportServerEvent`.
- `server/plugins/error-reporting.ts` — Nitro `error` hook: 5xx → ERROR, 401/403 → WARNING.
- `server/api/client-error.post.ts` — rate-limited browser-error sink.
- Background jobs (contract-scan, steam generation/retry, audit-write) and the
  Stripe webhook report through the same util with a `context.kind` tag.

What must be configured **once in the GCP console** (per project `xploit-games`).
Replace `PROJECT_ID=xploit-games` and the notification email as needed.

## 1. Notification channel (email)

```bash
gcloud beta monitoring channels create \
  --display-name="Ravy alerts" \
  --type=email \
  --channel-labels=email_address=YOU@example.com \
  --project=xploit-games
# note the returned channel id: projects/xploit-games/notificationChannels/NNN
```

## 2. Error Reporting notifications

Console → **Error Reporting** → ⚙ / "Notifications" → enable email on
**new** and **regressed** errors. (Covers every `ERROR` we emit, server + client.)

## 3. Alert: Cloud Run 5xx rate

Console → **Monitoring → Alerting → Create policy**:

- Metric: **Cloud Run Revision → Request count** (`run.googleapis.com/request_count`).
- Filter: `service_name = ravy-pro` and `response_code_class = 5xx`.
- Condition: count **> 0** (or a small threshold) over a rolling **5 min** window.
- Notifications: the channel from step 1.

## 4. Alert: payment / webhook failures (log-based)

Console → **Logging → Log Analytics / Logs Explorer**, confirm a query, then
**Create log-based alert**:

```
resource.type="cloud_run_revision"
severity>=WARNING
( jsonPayload.context.kind="stripe-webhook"
  OR jsonPayload.context.kind="steam-generation"
  OR jsonPayload.context.kind="steam-retry"
  OR jsonPayload.context.kind="access-audit-write" )
```

- Alert when matching entries **> 0** in **5 min**; notify the step-1 channel.

(Adjust the `kind` list as new money/critical paths are added — every report
passes a `context.kind`, so this stays a one-line edit.)

## 5. Verify end-to-end

1. Trigger a server error (e.g. hit a paid endpoint with a broken config) and a
   client error (throw in a component) in production.
2. Console → **Error Reporting** → both appear, grouped, with `kind` in the
   payload (filter `jsonPayload.context.kind="client"` for browser errors).
3. Confirm the alert email arrives for the 5xx / payment policies.

## Notes

- Logs are retained per Cloud Logging defaults; **no TTL** is applied to error data.
- `context.kind` values currently emitted: `client`, `contract-scan`,
  `steam-generation`, `steam-retry`, `steam-email`, `stripe-webhook`,
  `access-denied`, `access-audit-write`, `rate-limit`.
