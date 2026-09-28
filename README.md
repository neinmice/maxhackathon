# ZVERY — Бизнес-навигатор

Базовый skeleton проекта команды ZVERY. Human-контекст находится в соседнем каталоге `../docs/`, полный EA-контекст — в Obsidian и в пакетах команды.

## Состояние проекта

Финальная визуальная и функциональная полировка фронтенда завершена, протестирована и зафиксирована в репозитории:

### Реализация полировки (2026-09-28)

- **Шрифтовая система:** Подключены все 6 начертаний `VK Sans` (`Expanded-Bold`, `DemiBold`, `Medium`, `Condensed-Bold`, `Text-Regular`, `Text-Medium`) из локальных файлов. Устаревшие шрифты Unbounded и Manrope полностью удалены из кодовой базы.
- **Apple Squircle и Spacing:** Внедрены радиусы скругления (`16px`, `18px`, `14px`, `12px`, `pill`) и строгая 4px-сетка отступов. Пружинящие `:active` анимации (`scale(0.96)`) на всех карточках и кнопках.
- **Сторис 1:1:** Квадратные миниатюры без наложенного текста, серая рамка и ч/б фильтр для просмотренных. В окне просмотра убраны аватарка и время, крестик закрытия сохранён.
- **Главная страница:** Сохранена стандартная высота карточек (~94px), устранены перекрытия текста при длинных названиях городов, интегрированы увеличенный 3D-маскот (72px) и золотые искры.
- **Блок «Сервисы»:** 4 квадратные плитки («Регистрация», «Налоги», «Документы», «Обучение») расположены строго в одну горизонтальную строку в самом низу главной страницы под всеми секциями.
- **MAX WebApp Bridge:** Нативная кнопка `BackButton` на всех экранах второго уровня; виброотклик `selectionChanged()`, `impactOccurred('light' | 'medium')` и `notificationOccurred('success')`.
- **Spotlight Tutorial:** 4-шаговый тур с вырезкой целевых элементов и золотой рамкой, единственный MVP-дисклеймер, переход в анкету с кнопкой «Пропустить анкету».
- **Умный помощник:** Полностью исключено имя «Навик», добавлен 3D-маскот, настроены быстрые кнопки перехода в разделы (каталог грантов, калькулятор налогов, обучение, квиз).
- **Квиз и Сертификат:** 5 практических вопросов, криптографическая подпись SHA-256, золотая печать ZVERY, дисклеймер и функция отправки ссылки.
- **Пустые состояния:** Компонент `EmptyState` с 3D-маскотом `mascot-shrug.png` для поиска и каталога мер.
- **Проверки:** `npm run build` — 144ms (0 ошибок TS); Playwright Visual QA — 0 runtime-ошибок в консоли; тесты API и бота — 100% PASS.

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
