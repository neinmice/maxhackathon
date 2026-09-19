# API contract

Prefix: `/api/v1` except `/health`.

Errors use `{error:{code,message,request_id}}`. Dates are ISO-8601. Unknown user input returns a typed 4xx, not a traceback.

Initial routes:

- `GET /health`
- `GET /api/v1/catalog/filters`
- `POST /api/v1/recommendations`
- `GET /api/v1/measures/{measure_id}`
- `POST /api/v1/quiz/submit` (reserved contract)
- `POST /api/v1/notifications/opt-in` (reserved contract)
- `POST /webhooks/max` (reserved contract)

Do not add fields by guessing. Update OpenAPI, tests and frontend types together.
