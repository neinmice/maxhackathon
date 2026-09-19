# Инструкции EA-агентам ZVERY

Сначала прочитай этот файл, `README.md`, `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md` и профильную задачу.

## Нельзя

- менять scope, API или модель данных без ADR и согласования Стаса;
- подключать live scraping, недоступные госAPI, автоподачу, банковские операции или PII-документы;
- считать model/fixture data реальной интеграцией;
- класть секреты в Git или frontend bundle;
- использовать генеративный AI как финальное решение продукта;
- добавлять Unicode-эмодзи в Mini App;
- менять чужой слой без review владельца.

## Структура ответственности

- `apps/miniapp` — Паша, frontend/UI.
- `services/api` — Саша, FastAPI/API.
- `services/bot` — Саша, MAX Bot handlers.
- `data` — Стас утверждает содержание; Саша подключает seed.
- `packages/contracts` — совместная зона, изменения только через review Стаса.
- `docs` — архитектура и контракты.

## Definition of Done

Задача имеет тест, обработку ошибок, документацию и PR с evidence. Сначала план, затем изменение. При конфликте источников агент останавливается и сообщает о нём.

## Ownership update (2026-09-20)

- GitHub administration is owned by Sasha: issues, branches, PR approvals, merges, CI and release tags.
- Stas owns product scope, visual direction and final product/content review; he does not perform routine GitHub merges.
- Pasha owns frontend/UI implementation and submits frontend PRs.
- A product/visual concern is escalated to Stas; a technical/merge concern is handled by Sasha.

## Mandatory start protocol for human-launched AI

Before any file change, the AI must: (1) analyze the current state, (2) produce a scoped plan, (3) ask exactly five numbered clarification questions, and (4) wait for the human phrase `План одобрен, можно делать`. Until that phrase it must not edit files, write code, create PRs or merge. After approval it repeats the approved plan, lists files, implements, tests and reports evidence.
