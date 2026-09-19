# ZVERY — Бизнес-навигатор

Базовый skeleton проекта команды ZVERY. Human-контекст находится в соседнем каталоге `../docs/`, полный EA-контекст — в Obsidian и в пакетах команды.

## Цель skeleton

Дать воспроизводимую основу для Bot/Mini App, на которую можно безопасно наращивать продукт. Сейчас используется только подготовленный fixture-каталог; реальные госинтеграции не имитируются.

## Запуск API

```bash
cd services/api
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Проверка: `GET http://localhost:8000/health`.

## Запуск Mini App shell

```bash
cd apps/miniapp
npm install
npm run dev
```

## Docker

```bash
docker compose -f infra/compose.yaml up --build
```

## Контракт

- `openapi.yaml` — HTTP-контракт;
- `DATA-API.yaml` — данные для проверки жюри;
- `docs/ARCHITECTURE.md` — границы слоёв;
- `docs/MAX_OFFICIAL_RESEARCH.md` — проверенные MAX mechanics;
- `docs/API_CONTRACT.md` — правила изменения API;
- `AGENTS.md` — правила EA-агентов.

## Ограничения MVP

Казань, Москва, Санкт-Петербург; курируемые данные; детерминированные рекомендации; без LLM как финального решения, live scraping, автоподачи и PII-документов.
