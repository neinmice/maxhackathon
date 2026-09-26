# API contract

Prefix: `/api/v1` except `/health`.

Errors use `{error:{code,message,request_id}}`. Dates are ISO-8601. Unknown user input returns a typed 4xx, not a traceback.

Initial routes:

- `GET /health`
- `GET /api/v1/catalog/filters`
- `POST /api/v1/recommendations`
- `GET /api/v1/measures/{measure_id}`
- `POST /api/v1/auth/max/launch-data` (bot service)
- `POST|DELETE /api/v1/measures/{measure_id}/save` (bot service, verified MAX launch data)
- `GET /api/v1/measures/saved` (bot service, verified MAX launch data)
- `POST /api/v1/quiz/submit` (bot service, verified MAX launch data)
- `POST /api/v1/notifications/opt-in` (bot service, verified MAX launch data)
- `POST /webhooks/max` (bot service, MAX secret)

`/webhooks/max` не является браузерным API: его вызывает только MAX. Все пользовательские bot routes требуют заголовок `X-Max-Init-Data`, кроме endpoint явной проверки launch data. Update OpenAPI, tests and frontend types together.
