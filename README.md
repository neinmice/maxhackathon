# ZVERY — Бизнес-навигатор

Базовый skeleton проекта команды ZVERY. Human-контекст находится в соседнем каталоге `../docs/`, полный EA-контекст — в Obsidian и в пакетах команды.

## Состояние

Работа идёт в ветке `fix/honest-vertical`. База — коммит `c22ee1e`. Изменения в рабочей копии **не закоммичены**. Это не готовый MVP: список проверенного и непроверенного — в [`docs/TEAM_REPORT_UNIFIED_MVP.md`](docs/TEAM_REPORT_UNIFIED_MVP.md).

## Полировка — 2026-09-28

Факты состояния ветки `fix/honest-vertical` (правки не закоммичены), не «готовый MVP»:

- Шрифты: VK Sans woff2 в [`apps/miniapp/public/fonts/`](apps/miniapp/public/fonts) и в `../presentation/assets/fonts/`. Unbounded и Manrope сняты из CSS приложения ([`apps/miniapp/src/styles.css`](apps/miniapp/src/styles.css), [`apps/miniapp/src/styles/`](apps/miniapp/src/styles)) и из [`../presentation/deck.css`](../presentation/deck.css). В [`docs/PASHA_TASKS.md`](docs/PASHA_TASKS.md) строка стека всё ещё упоминает Unbounded — это документ, не бандл.
- Каталог: 9 записей `demo-<region>-<sector>-001` (города `kazan`/`moscow`/`spb`, отрасли `agro`/`services`/`it`), помечены MODEL DATA — [`data/catalog/measures.json`](data/catalog/measures.json).
- Первое обучение: 4 шага до анкеты, ключ `zvery_intro_seen` ([`apps/miniapp/src/components/FirstRunIntro.tsx`](apps/miniapp/src/components/FirstRunIntro.tsx)). Пропуск анкеты — кнопка «Пропустить анкету» ([`apps/miniapp/src/components/OnboardingSheet.tsx`](apps/miniapp/src/components/OnboardingSheet.tsx)).
- Помощник: кнопки «Меры», «Налоги», «Обучение», «Квиз», «Как устроен подбор» ([`apps/miniapp/src/pages/assistantAnswers.tsx`](apps/miniapp/src/pages/assistantAnswers.tsx)); формулировки отказа без сумм.
- Главная: блок «Сервисы», плитки ведут на `/card/guide`, `/card/forms`, `/services`, `/learning` ([`apps/miniapp/src/data.ts`](apps/miniapp/src/data.ts), [`apps/miniapp/src/pages/Home.tsx`](apps/miniapp/src/pages/Home.tsx)).
- Таббар: активный таб `--purple #7a35d8`, точка `--yellow`, показ точек — ключ `zvery_tab_dots_seen` в `sessionStorage` ([`apps/miniapp/src/components/TabBar.tsx`](apps/miniapp/src/components/TabBar.tsx)).
- Презентация: 16 слайдов, radial-gradient снят, [`../presentation/ZVERY_Бизнес-навигатор.pdf`](../presentation/ZVERY_Бизнес-навигатор.pdf) пересобран. Скрины MAX — открытый блокер, владелец снимет другим агентом.

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
npm ci
npm run build   # проверка сборки: tsc -b && vite build
npm run dev     # dev-сервер на 127.0.0.1:3000
```

## Проверки

Тесты API и bot запускаются pytest из [requirements.txt](services/api/requirements.txt) и [requirements.txt](services/bot/requirements.txt) установленных в venv:

```bash
cd services/api && python -m pytest -q
cd services/bot && python -m pytest -q
```

Guard-скрипт честности Mini App:

```bash
node apps/miniapp/scripts/honesty-regressions.mjs
```

Последние локальные прогоны этой ветки: `npm run build` — 0 ошибок; pytest api — 35 passed; pytest bot — 22 passed, 1 skipped; honesty-regressions — 0 несоответствий. Браузерные кадры: [`docs/visual-qa/home-services-380.png`](docs/visual-qa/home-services-380.png), [`docs/visual-qa/home-services-1440.png`](docs/visual-qa/home-services-1440.png), [`docs/visual-qa/tab-active-380.png`](docs/visual-qa/tab-active-380.png), [`docs/visual-qa/intro-380.png`](docs/visual-qa/intro-380.png), [`docs/visual-qa/assistant-refusal-380.png`](docs/visual-qa/assistant-refusal-380.png). На `:8000` в момент съёмки работал чужой процесс — карточка меры в браузере не снималась.

CI: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) добавлен (miniapp build + honesty, pytest api/bot, compose- и client-guard). **GitHub Actions по нему ещё не запускался** — локально проверены только guard-скрипты.

## Docker

Production-профиль требует приватный env-файл **вне git** с заполненными секретами:

```bash
export APP_ENV_FILE=/path/to/private.env
docker compose --env-file "$APP_ENV_FILE" -f infra/compose.yaml up --build -d
```

Без заполненного `APP_ENV_FILE` bot и `db` отказываются стартовать (проверка пустых и шаблонных секретов). Пошагово — [`docs/VPS_DEPLOYMENT.md`](docs/VPS_DEPLOYMENT.md). Успешный production Docker runtime на этой машине не запускался.

Для локальной разработки есть override [`infra/compose.dev.yaml`](infra/compose.dev.yaml) (API `127.0.0.1:8000`, bot `127.0.0.1:8001`, db `127.0.0.1:5432`, web `127.0.0.1:8080`).

## Запуск Bot service

```bash
cd services/bot
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. uvicorn app.main:app --reload --port 8001
```

Подробная настройка Ubuntu 24, DNS, HTTPS и регистрация MAX webhook описаны в `docs/VPS_DEPLOYMENT.md`.

## Контракт

- `openapi.yaml` — HTTP-контракт;
- `DATA-API.yaml` — данные для проверки жюри;
- `docs/ARCHITECTURE.md` — границы слоёв;
- `docs/MAX_OFFICIAL_RESEARCH.md` — проверенные MAX mechanics;
- `docs/API_CONTRACT.md` — правила изменения API;
- `docs/VPS_DEPLOYMENT.md` — развёртывание на Ubuntu 24;
- `AGENTS.md` — правила EA-агентов.

## Ограничения

Казань, Москва и Санкт-Петербург — адресные регионы. В каталоге девять синтетических записей `demo-<region>-<sector>-001`, все `MODEL DATA`, не официальные меры. Рекомендации детерминированные. Без LLM как финального решения, live scraping, автоподачи и PII-документов. Это не готовый MVP.
