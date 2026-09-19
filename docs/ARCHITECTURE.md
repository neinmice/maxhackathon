# Architecture

```text
MAX Bot -> webhook -> FastAPI -> prepared catalog
    \-> MAX Bridge -> React Mini App -> same API
```

`services/api` не знает о React. `apps/miniapp` не содержит каталог и секреты. `services/bot` вызывает публичный API и маршрутизирует события. `data/catalog` — подготовленные данные с источником и статусом.

## Boundary rules

- API contract changes require review in `packages/contracts`, `openapi.yaml` and `DATA-API.yaml`.
- MAX launch data is verified server-side before a session is trusted.
- Current skeleton has no real MAX token and no external integration calls.
- Future LLM is an optional explanation layer only; deterministic rules remain authoritative.
