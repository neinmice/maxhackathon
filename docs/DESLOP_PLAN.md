# DESLOP_PLAN — план исполнения в новом чате (условно разрешено владельцем)

> **Статус: УСЛОВНО РАЗРЕШЕНО ВЛАДЕЛЬЦЕМ; исполнение в новом чате; конфликтующие изменения отдельно согласовать.**
> Ручной фронтенд и правила конкурса сохраняются. Прежний статус «НЕ СОГЛАСОВАНО» и пять формальных вопросов на повторное согласование отменены — владелец разрешил обоснованные улучшения по этому плану. Требовать нового согласования плана целиком не нужно; отступления от плана — отдельно владельцу.
> Скриншот-гейты и network-гейты **ОТЛОЖЕНЫ, не блокеры**. Снимок `d983703 feat/frontend-gold-polish` перепроверяется при исполнении. Сохранённые статусы baseline: **build PASS, honesty FAIL (`getHealth` ложный `demo_ok`), API/bot pytest BLOCKED, lint N/A, visual BLOCKED — никакого Zero Regression до новых прогонов.**
> Консолидация 2026-09-29 (techwriter): план переструктурирован под исполнение (goal/architecture/spec/глобальные ограничения/review focus + последовательные пакеты), старые разделы согласования заменены.

---

## Цель (Goal)

Привести продукт к доказуемой честности поведения и канону каталога без изменения ручного фронтенда: устранить false production success (health, квиз/сертификат, сохранения, рекомендации), восстановить honesty-прогон и CI, подтвердить тестами API/bot/frontend, уплотнить комментарии (русский, минимум) и доказанно дедуплицировать — каждый пакет самостоятелен и проверяем.

## Архитектура (Architecture)

Стек не меняется: React 19 + TypeScript + Vite miniapp (`apps/miniapp`), FastAPI (`services/api`), бот на FastAPI/httpx (`services/bot`), PostgreSQL, Docker/infra. Все правки — в существующих границах: клиентский `ApiClient` с fixture-fallback, store на localStorage, honesty-скрипт как статический регрессионный контракт, CI GitHub Actions. Изменения поведения только там, где план задаёт новый честный контракт (health, quiz, saved, recommendations); DOM/CSS/визуальный слой защищён контрактом сохранения (§ Global Constraints).

## Стек и зафиксированные факты

- Frontend: React 19, TypeScript, Vite, `react-router-dom`; CSS `styles.css` (единственная живая система; `styles/tokens.css`+`styles/main.css` — несмонтированный контур, не удалять).
- API: Python 3.12 (как в CI [`ci.yml:54`](../.github/workflows/ci.yml:54)), FastAPI/uvicorn/pydantic/httpx; Bot: + `psycopg[binary]`.
- **pytest УЖЕ объявлен** в обоих requirements: [`requirements.txt:4`](../services/api/requirements.txt:4), [`requirements.txt:5`](../services/bot/requirements.txt:5) — это обычная зависимость для существующих тестов, не «внедрение тестового фреймворка». FastAPI и psycopg — **runtime-зависимости**, не тестовые: не называть весь requirements тестовым.
- Локальный venv игнорируется git (.gitignore) и **не хранится в репозитории**. Разрешена подготовка изолированной среды из **существующих requirements**; системные установки Python и зависимости вне manifests — только отдельной оговоркой владельцу.
- Снимок `d983703` (git log подтверждён 2026-09-29); при исполнении перепроверить `git log --oneline -1` и `git status -sb`.

## Спецификация (Spec) — источники требований

- **Официальные правила:** [`docs/Официальные правила «Хакатона для студентов по разработке чат-ботов и мини-приложений.md`](../../docs/Официальные%20правила%20«Хакатона%20для%20студентов%20по%20разработке%20чат-ботов%20и%20мини-приложений.md). Юридически значимые пункты:
  - **п. 9.5** — запрещено использование решений генеративных программ (ИИ) **в виде окончательного решения Задания**. Это **НЕ сводится к запрету runtime-LLM**: применимость к AI-рефакторингу/генерации кода — явный риск; при неоднозначности — проверка владельцем/организатором **до спорного пакета**; compliance не заявлять доказанным. Практический вывод: генеративные подсказки — только черновик; каждая строка исполнителя понята, проверена и может быть защищена на очном финале (п. 8.5).
  - **п. 9.2** (в т.ч. 9.2.1 нецензурная брань, 9.2.6 информация о частной жизни третьих лиц, 9.2.8 введение в заблуждение) — нежелательный контент; в проекте дополнительно действует внутренний запрет Unicode-emoji/шрифтов/PII — **внутренние запреты отличать от организаторских**, первые меняются владельцем, вторые нет.
  - **п. 9.3** — авторские и иные права третьих лиц (право на имя, конфиденциальность, изображение): имя «Анастасия» — только явный демо-контекст, не реальная идентичность.
  - **пп. 8.4, 10** — сроки онлайн-этапа (до 30.09.2026) и критерии (Продукт/Техника); **п. 11.1.5** — трек «Эффективный бизнес».
- **Задание трека:** [`docs/Документы проекта/Эффективный бизнес.pdf`](../../docs/Документы%20проекта/Эффективный%20бизнес.pdf). Перед юридическими выводами читать соответствующие пункты источника; конфиденциальное задание **не копировать** в промпты и коммиты сверх необходимого.
- Канон каталога: [`docs/ADR/0001-single-catalog-contract.md`](./ADR/0001-single-catalog-contract.md), [`openapi.yaml`](../openapi.yaml), [`DATA-API.yaml`](../DATA-API.yaml), данные [`data/catalog/measures.json`](../data/catalog/measures.json).

## Глобальные ограничения (Global Constraints)

1. Ручной фронтенд сохраняется: **не менять** DOM и порядок узлов, классы (включая классы без CSS-правил), CSS-каскад и порядок правил, тексты интерфейса/aria-label, шрифты VK Sans (семейства/веса/woff2), цвета/радиусы/отступы, телефонную рамку ≥600px, анимации и `@keyframes`, `prefers-reduced-motion`, фокус (`outline` у `.svc-input:focus` не снимать), маршруты, TabBar, жесты сторис.
2. **Не удалять работающие демо-сценарии молча**: явная маркировка demo ≠ false production success. Убирается только **выдача фиктивного успеха как настоящего** (внешний вид честного сертификата сохраняется).
3. Защищены: security (HMAC, `X-Max-Init-Data`, idempotency), дисклеймеры, атрибуция/провенанс (шапки `QuizModal`/`MeasureDetailSheet`, Canva provenance `MascotProps`), лицензии шрифтов, `no-op`-комментарии как явное намерение.
4. Не удалять «неиспользуемое» без графа imports/tests/tools; `EducationView`/`MascotAssistantView` упоминаются honesty-скриптом.
5. Никакой автоматической идеализации: любое изменение — по пункту плана, с командой проверки и критерием.
6. Коммиты — по пакетам; **push/deploy автоматически не разрешать**.
7. Shell/тесты/логи — через memo_exec (local-memo); discovery листингом до чтения; `5_Extras/` и секреты не читать; Development_Log не вести.
8. Сервер для проверок — управляемый detached-запуск (§ DevOps), чужие процессы на портах не трогать.

## Review Focus (главные риски)

1. **Health маскирует отказ сети** ([`client.ts:49-57`](../apps/miniapp/src/api/client.ts:49)): `catch` возвращает `demo_ok` — «сервис жив» при мёртвом API. Ожидание: rejected promise / явный offline-статус, различающий network error / HTTP !ok / invalid JSON. Тест — Задача 3.
2. **Synthetic certificate из catch** ([`client.ts:210-227`](../apps/miniapp/src/api/client.ts:210)) и `cert=1`-заглушки ([`QuizPage.tsx:18-27`](../apps/miniapp/src/pages/QuizPage.tsx:18), [`QuizModal.tsx:88-96`](../apps/miniapp/src/components/QuizModal.tsx:88)): успех квиза без сервера вводит в заблуждение (п. 9.2.8). Ожидание: результат только от сервера; demo — явно помечено. Тест — Задача 5.
3. **Неканонические ID** в saved-дефолтах ([`store.tsx:58-65`](../apps/miniapp/src/store.tsx:58), `young`/`micro` не из каталога) и локальные `GRANTS` в [`Other.tsx:26`](../apps/miniapp/src/pages/Other.tsx:26) против единого каталога (ADR-0001). Ожидание: только канонические ID, адаптер данных, UI не сносится. Тесты — Задачи 4, 6.
4. **Mutating fallback** (`saveMeasure` → `saved:true`, [`client.ts:145-158`](../apps/miniapp/src/api/client.ts:145)): сохранение «работает» при мёртвом API. Ожидание: честный отказ либо явная локальная пометка с индикатором. Тест — Задача 4.
5. **Deep link `cert=1`** ([`App.tsx:60-63`](../apps/miniapp/src/App.tsx:60)) открывает квиз в «готовом» состоянии. Ожидание: deeplink открывает форму, а не результат. Тест — Задача 5.

---

## Задачи (последовательные пакеты)

### Задача 1: Baseline и источники требований

**Files:** без правок исходников; артефакты в `docs/visual-qa/deslop-baseline/` (untracked, не коммитить без владельца).

**Interfaces:** Produces — зафиксированный baseline-отчёт (git-хэш, статусы прогонов), которым пользуются все задачи.

- [ ] Шаг 1. Перепроверить снимок: `git log --oneline -1 && git status -sb` (cwd `maxhackathon`). Ожидание: `d983703`, ветка `feat/frontend-gold-polish`; если HEAD сдвинулся — зафиксировать новый и продолжать от него.
- [ ] Шаг 2. Прогнать baseline: `npm run build` (cwd `apps/miniapp`), `node scripts/honesty-regressions.mjs` (cwd `apps/miniapp`), `python3 -m pytest -q` (cwd `services/api`, `services/bot`). Ожидание: подтверждение/обновление статусов §Статус; pytest может остаться BLOCKED до Задачи 2.
- [ ] Шаг 3. Прочитать (не копировать) пп. 9.2–9.5 правил и открыть PDF задания; выписать в отчёт 3–5 пунктов-требований трека своими словами со ссылками на пункт/страницу.
- **Критерий:** отчёт baseline существует, статусы воспроизводимы командами выше.
- **Риск/откат:** правок кода нет; откат не требуется.

### Задача 2: Изолированная Python-среда (существующие requirements)

**Files:** Create: `services/api/.venv/`, `services/bot/.venv/` (игнорируются git, в репозиторий не попадают).

**Interfaces:** Produces — `python3 -m pytest` работающий в обоих сервисах; версия Python 3.12 (как CI [`ci.yml:54`](../.github/workflows/ci.yml:54)).

- [ ] Шаг 1. Проверить наличие 3.12: `command -v python3.12 || ls /opt/homebrew/bin/python3.12` (memo_exec). Если нет — **остановиться** и запросить владельца: системная установка вне manifests отдельно оговаривается (см. Global Constraints).
- [ ] Шаг 2. `python3.12 -m venv .venv` и `.venv/bin/pip install -r requirements.txt` — в `services/api` и `services/bot` (cwd соответствующих сервисов).
- [ ] Шаг 3. Проверка: `.venv/bin/python -m pytest -q` (cwd `services/api`, затем `services/bot`). Ожидание: тесты запускаются; FAIL-ы фиксируются как факты (не чинить в этой задаче).
- [ ] Шаг 4. Убедиться, что `.venv` не в git: `git status --porcelain` — venv отсутствует в выводе (gitignore действует). Если появляется — проверить [`​.gitignore`](../.gitignore) и добавить правило отдельным коммитом `chore: ignore local venv`.
- **Критерий:** pytest исполняется локально в обоих сервисах; репозиторий чист от venv.
- **Риск/откат:** удаление каталогов `.venv` полностью откатывает; на CI не влияет.

### Задача 3: Матрица актуальности honesty H1–H5 — ДО исправлений

**Files:** Create: `docs/visual-qa/deslop-baseline/HONESTY_MATRIX.md`; Modify (позже, по матрице): honesty-скрипт/код.

**Interfaces:** Produces — по каждой группе H1–H5: ожидание скрипта, фактическое поведение, вердикт «код прав / тест прав / оба», конкретный fix; потребляется Задачами 4–6 и CI-задачей.

- [ ] Шаг 1. Заполнить матрицу фактами (проверено 2026-09-29, перепроверить при исполнении):
  - **H1** — скрипт ждёт `err.kind`; в [`client.ts:9-19`](../apps/miniapp/src/api/client.ts:9) `ApiErrorResponse` имеет `code`/`requestId`. **Не вводить поле `kind` только ради теста**: сначала grep consumers `err.kind` по `src/` — если потребителей нет, вердикт «тест прав»: переписать assertion на реальный контракт (`code`/`requestId`), поведение — обработка `ApiErrorResponse` по `instanceof`.
  - **H2** — скрипт ждёт экспорты `getDisplayUser`/`getVerifiedInitData`/`measureIdFromStartParam`/`parseStartParam`; реальный контракт [`maxBridge.ts`](../apps/miniapp/src/lib/maxBridge.ts) — `getBridge`, `initBridge`, `getBridgeUser`, `getDeepLinkPayload`, `triggerHaptic`, `triggerSelectionChanged`, `triggerNotification`, `bindBackButton`, `hideBackButton`, `openExternalUrl`. **Реальный контракт сохранить, obsolete-экспорты не создавать**: assertions переписать на существующие функции (поведение: bridge-вызовы защищены try/catch, `getDeepLinkPayload` парсит start_param).
  - **H3** — [`store.tsx:43`](../apps/miniapp/src/store.tsx:43) дефолт `Анастасия` (только явный demo-контекст, п. 9.3 — не реальная идентичность) и [`store.tsx:58-65`](../apps/miniapp/src/store.tsx:58) saved-дефолт `['young','micro']` — **ID не из каталога**: fix кода с миграцией существующего storage (см. Задача 4).
  - **H4** — [`App.tsx:60`](../apps/miniapp/src/App.tsx:60) `params.get('cert')` + synthetic certificate (см. Задача 5): fix кода.
  - **H5** — `requestRecommendations` в OnboardingSheet отсутствует: **проверять поведение, не строку**: цель должна маппиться в рекомендации (см. Задача 6).
- [ ] Шаг 2. Для каждого вердикта «тест прав» записать новое assertion (точный ожидаемый символ/поведение) — вход для правки скрипта в Задаче 7.
- **Критерий:** матрица покрывает H1–H5 целиком, каждый вердикт подтверждён grep/чтением строк.
- **Риск/откат:** документ; откат не требуется.

### Задача 4: Каталог/сохранения/deeplink — только канонические ID; честные сохранения

**Files:** Modify: [`store.tsx`](../apps/miniapp/src/store.tsx) (saved-дефолт + миграция), [`client.ts:145-188`](../apps/miniapp/src/api/client.ts:145) (save/remove/saved fallback), адаптер данных для [`Other.tsx`](../apps/miniapp/src/pages/Other.tsx) (GRANTS → каталог), [`data.ts`](../apps/miniapp/src/data.ts) (источник ID — без переименования UI-сущностей). Test: `apps/miniapp/scripts/honesty-regressions.mjs` (правка H3-assertions), новый smoke `tools/test-catalog-ids.mjs`.

**Interfaces:**
- Consumes: `FIXTURE_MEASURES`/каталог `data/catalog/measures.json` — канонические ID.
- Produces: `useApp().savedMeasures: Set<string>` — только ID, присутствующие в каталоге; `saveMeasure/removeSavedMeasure` — Promise, **reject** при недоступном API вместо ложного успеха (или явный `{saved:false, local:true}` — выбрать один контракт на весь клиент).

- [ ] Шаг 1. Тест (падающий): `tools/test-catalog-ids.mjs` — инициализация store с пустым storage даёт `savedMeasures = ∅`; каждый сохранённый ID ∈ каталог; deeplink `?id=` с неканоническим ID не открывает карточку-фантом. Run: `node tools/test-catalog-ids.mjs` (cwd `maxhackathon`). Expected: FAIL.
- [ ] Шаг 2. Реализация: дефолт saved — пустое множество; миграция `localStorage['zvery_saved_measures']`: отфильтровать ID, отсутствующие в каталоге (запись обратно без несуществующих); `Анастасия` — пометить demo (комментарий «демо-персона, п. 9.3», значение сохранить).
- [ ] Шаг 3. Реализация: mutating fallback `saveMeasure`/`removeSavedMeasure` — при network/!ok возвращать честный отказ (выбранный контракт из Interfaces), UI показывает toast-ошибку; **UI и стили не менять**.
- [ ] Шаг 4. Адаптер: `Other.tsx` читает гранты через единый источник каталога (функция-адаптер в `data.ts` над каталогом), локальный массив `GRANTS` остаётся как demo-данные **с явной пометкой** либо маппится на каталог; сценарий «сохранённые» рендерит только канонические ID.
- [ ] Шаг 5. Run: `node tools/test-catalog-ids.mjs` (cwd `maxhackathon`) — PASS; `npm run build` (cwd `apps/miniapp`) — PASS.
- [ ] Шаг 6. Commit: `fix(honesty): canonical catalog ids for saved/deeplink, honest save fallback`.
- **Критерий:** нет несуществующих ID ни в одном состоянии; сохранение без API не притворяется успешным; визуальные сценарии «Сохранённые/Гранты» работают.
- **Риск/откат:** миграция может очистить demo-сохранения — допустимо; откат — revert коммита.

### Задача 5: Quiz/cert — только серверный результат; no fake-success

**Files:** Modify: [`client.ts:190-228`](../apps/miniapp/src/api/client.ts:190) (убрать catch-локальную выдачу сертификата), [`QuizPage.tsx:18-27,55-63`](../apps/miniapp/src/pages/QuizPage.tsx:18) и [`QuizModal.tsx:88-96`](../apps/miniapp/src/components/QuizModal.tsx:88) (synthetic `cert=1` и catch-сертификат), [`App.tsx:60-63`](../apps/miniapp/src/App.tsx:60) (deeplink открывает форму). Test: расширение honesty-скрипта (assertions «нет synthetic cert в оффлайне»).

**Interfaces:**
- Consumes: `POST /api/v1/quiz/submit` ([`openapi.yaml`](../openapi.yaml)) — единственный источник `QuizSubmitResult`.
- Produces: `submitQuiz(): Promise<QuizSubmitResult>` — **reject** при недоступном сервере; UI показывает честный оффлайн-статус «проверка недоступна» с кнопкой повторить.

- [ ] Шаг 1. Тест (падающий): assertion в honesty-скрипте — в `client.ts`/`QuizPage.tsx`/`QuizModal.tsx` отсутствуют литералы `signed-demo-payload`, `demo-signed-payload`, `ZV-CERT-2026-OK`, catch-ветка локальной оценки; `cert=1` не подставляет готовый `result`. Run: `node scripts/honesty-regressions.mjs` (cwd `apps/miniapp`). Expected: FAIL.
- [ ] Шаг 2. Реализация: `submitQuiz` — при network/!ok reject (ошибка с `code='quiz_unavailable'`); QuizPage/QuizModal: catch → экран/состояние «результат требует сервера» (повторная попытка), **внешний вид сертификата сохраняется** для честного серверного результата.
- [ ] Шаг 3. Deeplink: `cert=1`/`startapp=cert` открывает квиз на первом вопросе (не результат); wording «верифицированный сертификат» на [`Assistant.tsx:172`](../apps/miniapp/src/pages/Assistant.tsx:172) и «Верифицировано криптографической подписью ZVERY Core (SHA-256)» ([`QuizPage.tsx:355`](../apps/miniapp/src/pages/QuizPage.tsx:355), [`QuizModal.tsx:301`](../apps/miniapp/src/components/QuizModal.tsx:301)) — factual correction: подпись вDemo-режиме не заявлять; допускается **только точное переименование** формулировки («подписано SHA-256, проверка сервером») без редизайна. Если честность требует большего — **остановить пакет**, вынести владельцу.
- [ ] Шаг 4. Run: honesty-скрипт (новые assertions) — PASS только по этим пунктам (health ещё красный до Задачи 3-фикса — допустимо, полный PASS не обещать); `npm run build` — PASS.
- [ ] Шаг 5. Commit: `fix(honesty): quiz result only from server, no synthetic certificates`.
- **Критерий:** ни один путь кода не создаёт «пройденный» сертификат без ответа сервера; demo-сертификат, если владелец оставляет, явно помечен «DEMO» в самом UI-тексте.
- **Риск/откат:** внешний вид квиза не меняется; откат — revert.

### Задача 6: Onboarding → профиль → каталог: рекомендации с явным mapping целей

**Files:** Modify: [`components/OnboardingSheet.tsx`](../apps/miniapp/src/components/OnboardingSheet.tsx), [`store.tsx`](../apps/miniapp/src/store.tsx) (цели), адаптер в `data.ts`. Test: `tools/test-recommendations.mjs` (новый).

**Interfaces:**
- Consumes: `POST /api/v1/recommendations` с `RecommendationRequest` ([`types/api.ts`](../apps/miniapp/src/types/api.ts)); каталог целей из фильтров.
- Produces: функция `mapGoalToCatalog(goal: UserGoal): string | null` в `data.ts` — точный mapping «цель онбординга → goal каталога»; `null` для невалидной цели (омит).

- [ ] Шаг 1. Тест (падающий): `node tools/test-recommendations.mjs` — каждая цель онбординга даёт либо валидный goal каталога, либо явный omit; запрос рекомендаций от профиля отправляет ровно mapped-значения; ни одна цель не маппится в пустую строку. Expected: FAIL (функции нет).
- [ ] Шаг 2. Реализация: добавить `mapGoalToCatalog`; OnboardingSheet завершает онбординг → сохранённый профиль → запрос рекомендаций на каталоге; предпочтения профиля хранятся local, рекомендации — на catalog (поведение перепроверить на рантайме, не по строке `requestRecommendations`).
- [ ] Шаг 3. Run: `node tools/test-recommendations.mjs` — PASS; `npm run build` — PASS.
- [ ] Шаг 4. Commit: `fix(honesty): explicit goal-to-catalog mapping in onboarding recommendations`.

### Задача 7: Health не маскирует network/HTTP/invalid JSON (первый honesty-фикс)

**Files:** Modify: [`client.ts:49-57`](../apps/miniapp/src/api/client.ts:49), honesty-скрипт assertion:298 (после Задачи 3). Test: honesty-скрипт + ручная проверка с поднятым/остановленным API.

**Interfaces:** Produces: `getHealth(): Promise<{ status: string; version: string }>` — reject при network error / HTTP !ok / invalid JSON; `demo_ok` исчезает; потребители (баннер статуса) показывают offline-состояние — **не менять их верстку**, только данные.

- [ ] Шаг 1. Проверить consumers `getHealth`/`demo_ok` grep'ом (статус-бандл Home): строк не должно остаться с ожиданием `demo_ok`. Если найдены — адаптировать данные, не вёрстку.
- [ ] Шаг 2. Реализация: убрать catch-fallback; три ветки ошибки различаются (`fetch` reject → network; `res.ok` false → HTTP; `res.json()` reject → invalid JSON), все → reject.
- [ ] Шаг 3. Run: `node scripts/honesty-regressions.mjs` (cwd `apps/miniapp`) — health-assertion PASS; **не обещать полный PASS** — остаются пункты, закрытые Задачами 4–6 и правками H1/H2 (Шаг 4).
- [ ] Шаг 4. Применить матрицу Задачи 3: переписать H1/H2 assertions на реальный контракт (без новых полей и без obsolete-экспортов).
- [ ] Шаг 5. Run: `npm run build` — PASS; honesty — PASS либо честный список оставшихся отклонений.
- [ ] Шаг 6. Commit: `fix(honesty): getHealth rejects on failure instead of demo_ok; H1/H2 assertions match real contract`.

### Задача 8: Восстановить honesty-шаг в CI (devops)

**Files:** Modify: [`ci.yml`](../.github/workflows/ci.yml) (job miniapp: вернуть шаг Honesty после Build), guard [`ci.yml:146-166`](../.github/workflows/ci.yml:146) (игла `mock_ok` расширить/заменить на фактические запрещённые литералы — `demo_ok` и synthetic-cert литералы из Задачи 5, по факту после Задач 5/7).

**Interfaces:** Produces: CI job `miniapp` снова падает на honesty-регрессиях; guard блокирует synthetic-success литералы в `apps/miniapp/src`.

- [ ] Шаг 1. После PASS honesty локально: добавить шаг `- run: node scripts/honesty-regressions.mjs` в job `miniapp` (working-directory уже `apps/miniapp`).
- [ ] Шаг 2. Обновить guard: иглы = запрещённые литералы по фактическому состоянию кода; проверка локальным прогоном inline-скрипта.
- [ ] Шаг 3. Проверка локально: копия inline-guard через `python3 -c` — PASS. CI push **не выполнять без владельца** (Global Constraints п. 6).
- [ ] Шаг 4. Commit: `ci: restore honesty step and update synthetic-success guards`.
- **Риск/откат:** revert коммита; CI-конфиг не влияет на runtime.

### Задача 9: Тесты API/bot/frontend — фактическое покрытие

**Files:** Test: `services/api/tests/`, `services/bot/tests/`; дополняющие тесты — только в этих каталогах.

**Interfaces:** Consumes: venv из Задачи 2; Produces — зафиксированный свежий статус `pytest` обоих сервисов (PASS или честный список FAIL).

- [ ] Шаг 1. `.venv/bin/python -m pytest -q` (cwd `services/api`; затем `services/bot`). Исторические 32/22 passed **не засчитывать** — фиксируется свежий результат.
- [ ] Шаг 2. Если FAIL — чинить минимально **только если тест прав по контракту** [`openapi.yaml`](../openapi.yaml); спорное — в § Unresolved.
- [ ] Шаг 3. Frontend: honesty-скрипт + `npm run build` (cwd `apps/miniapp`) — зафиксировать одной строкой в отчёте.
- [ ] Шаг 4. Сводку вписать в `docs/visual-qa/deslop-baseline/HONESTY_MATRIX.md` (артефакт Задачи 3).
- **Критерий:** три службы имеют свежие документированные прогоны; никаких «исторических PASS».

### Задача 10: Минимальные русские комментарии и доказанная дедупликация

**Files:** Modify: только подтверждённые кандидаты; строки перепроверить заново — после Задач 4–7 они сдвинулись (часть catch-блоков [`client.ts:66,132,155,171,186,207,242`](../apps/miniapp/src/api/client.ts:66) будет удалена/переписана). НЕ трогать: no-op-намерения, шапки-баннеры, Canva provenance, лицензии, `AGENTS.md`/`CONTRIBUTING.md`-договорённости.

- [ ] Шаг 1. Пересобрать реестр `путь:строка` grep-обходом: только реально оставшиеся тавтологичные (пример `ChecklistView.tsx:23` «Calculate total stats» — перепроверить существование файла и строки).
- [ ] Шаг 2. Правки: удалить тавтологию; содержательные → русский с сохранением смысла (не сокращать). Комментарий = один смысл; без нейминга и рефакторинга.
- [ ] Шаг 3. Дедупликация — **только доказанная** графом imports/tests/tools: T1 `toggleDoc` ×4 — свести к одному модулю без изменения DOM/CSS; T2/T3 — по графу. Нет доказательства = не выполнять.
- [ ] Шаг 4. Run: `npm run build` + honesty (cwd `apps/miniapp`) — PASS без новой дельты; Commit: `chore: ru comments cleanup, proven dedup`.
- **Риск/откат:** revert; риск низкий, не нулевой — приёмка по критериям § Статус.

### Задача 11: Portable tools (optional) и infra hardening (optional)

**Files:** Modify: `tools/*.mjs` (единый bootstrap, относительные пути); `infra/` — только оценки, без авто-правок.

- [ ] Шаг 1. Tools: bootstrap-модуль, пути от корня репо; прогон одного скрипта как smoke при работающем dev-сервере (Задача 12).
- [ ] Шаг 2. Infra — только отдельным согласованием: compose config/dry-run без `up` и без секретов; затем оценка Docker context/ignore, bot `:8001` vs runbook `:8000`, non-root/healthchecks. Security-конфигурации не трогать (permissions `contents: read`, concurrency, `APP_ENV_FILE`, nginx JSON 404, `--no-env-resolution`, маршруты Caddy/Vite).
- **Критерий:** tools запускаются из любой cwd; infra-правки вне автоматического объёма.

### Задача 12: Управляемый dev-сервер (devops — отдельная настройка запуска)

**Files:** Create: `tools/dev-server.mjs`. Лог/PID: `docs/visual-qa/deslop-baseline/dev-server.log`, `dev-server.pid`.

**Interfaces:** Produces: `node tools/dev-server.mjs start|stop|status` — вывод `{pid, port, logPath, ready}`; Vite на не-3000 порту (напр. 4310).

- [ ] Шаг 1. Реализация: `spawn` detached, `stdio: ['ignore', logFd, errFd]` (закрытый stdin, перенаправленный output); PID-файл; readiness — bounded-опрос `http://127.0.0.1:PORT` (лимит секунд, интервал), после — перепроверка **отдельным вызовом** `status`.
- [ ] Шаг 2. `stop` — только по собственному PID-файлу; **чужие процессы на 3000 не трогать** (перед kill сверять владельца порта по PID; чужое — пропускать с предупреждением).
- [ ] Шаг 3. Smoke: `start` → повторный `start` (не дублировать) → `status` → `stop`; curl порта до/после. Финальный результат работы сервера **здесь не заявлять** — это настройка запуска. Прежнее «зависание» объяснено ожиданием завершения долгоживущей команды и остановкой владельцем — «Vite неисправен» не утверждать.
- [ ] Шаг 4. Commit: `feat(devops): managed detached dev server with pid/log/readiness`.
- **Риск/откат:** скрипт не влияет на приложение; откат — revert; на 3000 ничего не запускать.

---

## Статус разрешений и отложенные гейты (замена прежних блокеров B1–B4)

- **Общее разрешение:** владелец условно разрешил исполнение плана в новом чате (обоснованные улучшения; ручной фронтенд и правила конкурса сохраняются). Прежнее «НЕ СОГЛАСОВАНО» и пять формальных вопросов отменены; повторно согласовывать весь план не требуется. Отступления/конфликты — отдельно владельцу до спорного пакета.
- **Frontend readiness локального dev-сервера (2026-09-29):** канонический miniapp переиспользовал уже работающий процесс, новый процесс не запускался. URL `http://127.0.0.1:3001/`; PID `49843` (владелец `stanislav`), команда `node ./node_modules/.bin/vite --host 127.0.0.1 --port 3001 --strictPort`, cwd `apps/miniapp`; родитель `46107` (Antigravity language_server) — не останавливался. Независимая повторная проверка memo-d847e1af (exit 0): процесс жив, слушает `127.0.0.1:3001`, HTTP 200; прогоны memo-c493cc90, memo-bb281a93, memo-d847e1af — все exit 0. Порт 3000 (чужой `python3` PID 40079) не трогался; другие серверы не останавливались. Git до/после: ветка `feat/frontend-gold-polish`, HEAD `d983703`, tracked diff пуст; untracked план и `deslop-baseline/` сохранены. **Квалификация: это только frontend readiness (процесс жив + HTTP 200 HTML) — НЕ functional/visual/API/MAX-интеграция и НЕ Zero 4xx/5xx PASS; скриншот- и network-гейты остаются отложенными.** Проблема прежнего запуска — lifecycle/output-wait гипотеза по объяснению владельца, не дефект Vite. Безопасная остановка (не исполнять без владельца): условная проверка PID + полной команды перед `kill`; без `pkill`; чужие процессы не трогать.
- **Отложено (не блокеры):** скриншот-гейты 380/1440 и network-гейты. Историческая диагностика (не переносить как актуальную): порт 3000 — чужой `python3` PID 40079; Vite 4310 дважды ready и SIGKILL, curl HTTP:000; 0 скриншотов; «Zero 4xx/5xx» не заявлять. Ожидаемые отказы proxy на `:8000`/`:8001` при выключенном API отличать от 4xx статики. Новые скриншоты — в новую подпапку `docs/visual-qa/`, не поверх старых; на 1440 ожидать телефон 390 по центру.
- **Критерий приёмки пакетов:** свежие прогоны (исторические цифры полировки ~2026-09-28…29 не засчитываются), diff только по пакету, честный список отклонений вместо «Zero Regression», статусы формулируются явно: build PASS / honesty FAIL / pytest BLOCKED / lint N/A / visual BLOCKED — до новых прогонов.
- **Push/deploy автоматически не разрешать.** memo-ID капсул git/lsof не выдумывать; известны memo-d350e2c7, memo-365166c5, memo-3ce242ed, memo-7463916b, memo-6c0988bf.

## Юридический комплаенс (не заявлять доказанным)

- **п. 9.5** правил: генеративные решения — не окончательное решение Задания. Риск применимости к AI-рефакторингу обозначен явно: весь код из этого плана исполнитель обязан понимать и защищать на финале (п. 8.5); при неоднозначности трактовки — проверка владельцем/организатором до спорного пакета. **Compliance не заявлять доказанным.**
- **п. 9.2** (9.2.1/9.2.6/9.2.8) — нежелательный контент и введение в заблуждение: мотивирует Задачи 4–7. Внутренние запреты Unicode emoji/шрифтов/PII отличать от организаторских — первые меняются владельцем.
- **п. 9.3** — права/авторство: «Анастасия» только явно демо-персона.
- Требования модельных данных, работы в MAX и поставки по треку — из PDF задания; читать по месту, в промпты/коммиты закрытые тексты не копировать.

## Resolved (решено владельцем/фактами)

1. План условно разрешён; реализация в новом чате; конфликты отдельно.
2. pytest уже в requirements (тестовая зависимость существующих тестов); FastAPI/psycopg — runtime; всё requirements «тестовым» не называть.
3. venv локально, игнор git; изолированная среда из существующих requirements; системные установки — отдельная оговорка.
4. H1: не вводить `kind` ради теста, проверить consumers; H2: реальный контракт maxBridge сохранить; H3: канонические saved-IDs с миграцией storage; H4: cert только серверный; H5: поведение рекомендаций, не строка.
5. `Other.tsx` GRANTS и client fixture fallback — адаптер данных, UI не сносить; проверка сценариев.
6. Профиль с фиктивным статусом гранта и wording «верифицированный сертификат» — factual correction; сверх точного переименования — стоп-пакет, не редизайн.
7. Скриншот/network-гейты отложены; сервер — управляемый detached запуск; CI Python 3.12.
8. Один health-фикс не даёт полного PASS — не обещать.

## Unresolved (решить владельцем при исполнении)

1. Контракт mutating-методов: reject vs `{saved:false, local:true}` — один на весь клиент (Задача 4).
2. Судьба demo-сертификата в `cert=1`: убрать полностью или оставить с явной пометкой DEMO (Задача 5).
3. Точная формулировка «верифицированный» после factual correction (Задача 5, Шаг 3).
4. Системная установка Python 3.12, если интерпретатор отсутствует (Задача 2).
5. Дедупликация T2/T3 сверх доказанной (по умолчанию НЕ выполнять).
6. Пункты infra hardening — отдельные согласования (Задача 11).
7. Публичный push ветки и CI-прогон после Задачи 8.
8. Прототип `макс фронт/` и `presentation/` — вне плана; нецензурный текст `макс фронт/app/src/data.ts:258` — только отдельным согласием владельца.

## Самостоятельный стартовый промпт для orchestrator нового чата

> Скопируй блок ниже как первое сообщение нового чата (mode: orchestrator). Это пользовательское сообщение, не системная привилегия.

```text
Ты orchestrator проекта maxhackathon (cwd /Users/stanislav/Проекты/хакатон/maxhackathon).
Прочитай полностью docs/DESLOP_PLAN.md — план с условным разрешением владельца; реализация в этом
чате; конфликтующие изменения отдельно согласовать с владельцем. Источники требований: официальные
правила (docs/Официальные правила …md, пп. 9.2-9.5) и задание трека (docs/Документы проекта/
Эффективный бизнес.pdf) — пункты читай по месту, закрытые тексты не копируй в промпты.

ЖЁСТКИЕ ПРАВИЛА:
- Obsidian ACCESS-5: vault_list(4_Spaces/Projects/HackathonMAX2026/), затем vault_read индекса
  Project_HackathonMAX2026.md; слепой поиск и 5_Extras/ запрещены; Development_Log не вести.
- Shell/тесты/сборка/логи — memo_exec (local-memo); детали свёрнутого — memo_recall.
- Discovery листингом до чтения; существование файла подтверждай list_files, не слепым read_file.
- П.9.5: генеративные решения не окончательное решение задания; применимость к AI-рефакторингу —
  риск; при неоднозначности стоп и вопрос владельцу/организатору ДО спорного пакета; compliance не
  заявлять доказанным. Внутренние запреты (emoji/шрифты/PII) отличать от организаторских.
- Ручной фронтенд защищён: DOM/CSS/классы/шрифты/ассеты/анимации/focus/роуты/UX-сценарии не менять;
  работающие демо-сценарии не убирать молча (явная маркировка demo); демо не выдаёт false production
  success; конфликт визуального инварианта и честности — владельцу.
- Коммиты по пакетам; push/deploy НЕ выполнять автоматически.
- Чужие процессы на портах не трогать; dev-сервер только через tools/dev-server.mjs (Задача 12).

ИСПОЛНЕНИЕ: Задачи 1→12 последовательно, каждая = один пакет с собственной приёмкой.
Маршруты: architect — Задача 3 (матрица H1-H5 по правилам и треку); code — Задачи 4-7, 10;
devops — Задачи 2, 8, 11, 12; debug — при падениях прогонов; designer — только если фиксы требуют
видимых изменений (тогда стоп-пакет и владелец); techwriter — отчёт Задачи 9 и финальные документы.
Делегируй по одной задаче через new_task; приёмка по критериям задачи (команды + ожидаемый вывод);
статусы build/honesty/pytest фиксируй свежими прогонами, исторические цифры не переноси.

ПЕРВЫЙ ЦИКЛ: Задача 1 (baseline + источники требований) → Задача 2 (venv) → Задача 3 (матрица).
Задачи 4-7 не начинать без матрицы Задачи 3. Каждый пакет закрывай attempt_completion с фактами,
путями и проверкой. Пункты § Unresolved выноси владельцу в момент соответствующего пакета.
```

## Self-review документа (techwriter, 2026-09-29)

- Покрытие спецификации: правила пп. 9.2/9.3/9.5 + трек — § Спецификация; H1–H5 — Задачи 3–7; каталог/deeplink/GRANTS — Задачи 4, 6; quiz/cert — Задача 5; CI honesty — Задача 8; тесты — Задача 9; комментарии/дедуп — Задача 10; tools/infra — Задача 11; сервер — Задача 12.
- Каждая задача: точные файлы, интерфейсы, шаги с командами/cwd/ожиданием, критерий, риск/откат.
- Честность: полный honesty PASS не обещан; исторические цифры не засчитаны; compliance не заявлен доказанным; push/deploy не разрешены; результат сервера не заявлен.
- Факты перепроверены на HEAD `d983703` (2026-09-29): `client.ts:9-19,49-57,145-158,190-228`; `QuizPage.tsx:18-27,55-63,355`; `QuizModal.tsx:88-96,301`; `App.tsx:60-63`; `store.tsx:43,58-65`; экспорты `maxBridge.ts`; `Other.tsx:26,174`; `ci.yml:19,146-166`; requirements обоих сервисов; `docs/07-оценка-и-запреты.md`; правила пп. 9.2–9.5.
- Оба документа (этот план и карточка Obsidian) перечитаны после записи.
