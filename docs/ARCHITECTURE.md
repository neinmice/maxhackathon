# Architecture

```text
MAX Bot -> HTTPS webhook -> services/bot -> MAX API / PostgreSQL
    \-> MAX Bridge -> React Mini App -> API gateway -> services/api + services/bot
```

`services/api` не знает о React. `apps/miniapp` не содержит каталог и секреты. `services/bot` владеет MAX transport: webhook, исходящими сообщениями, проверкой launch data и данными пользователя. `data/catalog` — подготовленные данные с источником и статусом.

## Boundary rules

- API contract changes require review in `packages/contracts`, `openapi.yaml` and `DATA-API.yaml`.
- MAX launch data is verified server-side in `services/bot` before a session is trusted.
- Webhook живёт в `services/bot` по пути `/webhooks/max`; reverse proxy направляет этот путь в bot-сервис.
- MAX token, webhook secret и ключ подписи сертификатов живут только в environment/secret store.
- Current repository contains no real MAX token and no live external integration calls until a human configures `.env` on the VPS.
- Future LLM is an optional explanation layer only; deterministic rules remain authoritative.

## Ownership

GitHub and technical integration are owned by Sasha. Stas owns product scope and visual direction. Pasha owns the Mini App frontend. Do not require Stas to execute routine merges; request his sign-off for product and visual decisions.
