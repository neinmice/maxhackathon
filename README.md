# ZVERY — Бизнес-навигатор

Базовый skeleton проекта команды ZVERY. Human-контекст находится в соседнем каталоге `../docs/`, полный EA-контекст — в Obsidian и в пакетах команды.

## Состояние проекта

- **Актуальная рабочая ветка в GitHub:** [`feat/frontend-gold-polish`](https://github.com/neinmice/maxhackathon/tree/feat/frontend-gold-polish) — зафиксирована в репозитории, запушена на remote `origin`, CI пройден со статусом `✓ SUCCESS`.
- **Статус фронтенда:** Полная визуальная и функциональная полировка фронтенда завершена (все разделы, кроме ЛК, приведены к Golden Standard).

Открытые пункты: production Docker runtime локально не запускался; VPS Deploy на `95.181.213.55` ожидает релиза команды.

TODO/FIXME в коде — 0. Заглушки в UI осознанные: разделы «в разработке» (Личный кабинет) и демо-ассистент без LLM.

### Baseline 2026-09-30 (read-only, свежий)

Дата: 2026-09-30. Scope: состояние рабочей копии на момент принятого read-only baseline; задача документационная, runtime-код не менялся. Свежий HEAD — `bd27af9c` (ветка `feat/frontend-gold-polish`, cwd репозитория); родительский каталог — не Git-репозиторий.

| Команда | cwd | Exit | Результат |
|---|---|---|---|
| `git status --porcelain=v1` | корень репозитория | н/д | Вывод пуст — изменённых файлов нет |
| `npm run build` | [`apps/miniapp`](apps/miniapp) | 0 | `tsc -b && vite build`, Vite 8.3.0, 1931 modules |
| `node scripts/honesty-regressions.mjs` | [`apps/miniapp`](apps/miniapp) | 1 | Сбой в [`scripts/honesty-regressions.mjs`](apps/miniapp/scripts/honesty-regressions.mjs:298) — «bot down: health must not become mock_ok»: ожидаемый reject не произошёл, последующие assertions не достигнуты |
| pytest api/bot | [`services/api`](services/api), [`services/bot`](services/bot) | не запускался | `python3.12` отсутствует (системный Python 3.14.7), `.venv` нет → BLOCKED, не PASS |
| HTTP `127.0.0.1:3001` | — | 200 | Чужой Vite-процесс (PID 49843) из [`apps/miniapp`](apps/miniapp), text/html, 977 bytes; процесс не изменялся. Порт 3000 занят чужим Python-процессом (PID 40079) — не трогали |

**Не доказано:** build не доказывает runtime/API/MAX/visual; HTTP 200 на `:3001` не доказывает network/API/MAX-интеграцию или функциональность; отсутствие pytest-прогонов — ограничение окружения, а не дефект продукта.

**Блокеры:** honesty-regressions exit 1 — health маскирует недоступность bot (открытый дефект честности); pytest api/bot BLOCKED — нет `python3.12` (CI ожидает Python 3.12) и нет `.venv`; текущий CI-workflow не содержит honesty-шаг.

**Исторические данные (не свежие прогоны):** цифры из разделов «Реализация полировки» ниже и «Последние локальные прогоны» в разделе [Проверки](#проверки) — не перепроверялись и не являются результатами baseline 2026-09-30.

**Ограничения evidence:** memo-ID для этих прогонов инструментом не возвращены и не указываются; сырые логи не копируются; новые shell-команды, сборки и тесты в рамках документационной задачи не запускались. Контракты прочитаны без изменений: API `:8000`, bot `:8001` ([`docs/API_CONTRACT.md`](docs/API_CONTRACT.md), [`openapi.yaml`](openapi.yaml)); каталог — единственный источник ID; конкурс требует бот с подключённым Mini App, запрещает секреты и вводящие в заблуждение данные, требует доступный основной сценарий в MAX, Docker и явную маркировку модельных данных.

### Пакет 2 принят (2026-09-30): честный health-контракт `getHealth`

Принят Пакет 2 плана [`docs/DESLOP_PLAN.md`](docs/DESLOP_PLAN.md) (Задача 7). Изменённые файлы Пакета 2:

- [`apps/miniapp/src/api/client.ts`](apps/miniapp/src/api/client.ts:49) — `getHealth()` больше не возвращает `demo_ok`/`mock_ok`: network → `ApiErrorResponse` c `code: 'network_error'`; HTTP !ok → error-envelope с сохранением server `code`/`requestId`; non-JSON/schema mismatch → `invalid_response`; валидный `{status, version}` — resolve.
- [`apps/miniapp/scripts/honesty-regressions.mjs`](apps/miniapp/scripts/honesty-regressions.mjs:298) — H1-assertion переписана на реальный контракт `code`/`requestId`, добавлена проверка non-JSON health.
- Новый focused harness [`apps/miniapp/scripts/health-contract.mjs`](apps/miniapp/scripts/health-contract.mjs:1) — 7 failure modes + валидный ответ.

Evidence (cwd `apps/miniapp`):

| Команда | Exit |
|---|---|
| `node scripts/health-contract.mjs` | 0 |
| `npm run build` | 0 |
| `node scripts/honesty-regressions.mjs` (после Пакета 2) | 1 — сбой на quiz assertion [`scripts/honesty-regressions.mjs`](apps/miniapp/scripts/honesty-regressions.mjs:305) |

memo-ID прогонов: `memo-df9e4f44`, `memo-59ed431b`; boundary baseline — `memo-9352a1c4`. До Пакета 2 honesty был exit 1 на старом `mock_ok` guard (строка «Baseline 2026-09-30» выше). **Полный honesty PASS не заявлен** — quiz-пункты остаются красными.

UI не менялся; production consumer `getHealth` в `src/` не найден — error screen не добавлялся. Accepted dirty baseline сохранён без переопределения смысла: defensive bridge, user-id guard, webhook self-echo guard; H3/H4/H5 не менялись.

**Не доказано:** полный honesty PASS, Zero Regression, API/bot/visual/network/MAX PASS. **Не запускалось:** pytest api/bot — нет окружения Python 3.12/pytest. **Блокеры:** honesty exit 1 на quiz assertion (Задача 5 плана), pytest BLOCKED, в CI нет honesty-шага (Задача 8). **Rollback:** revert [`client.ts`](apps/miniapp/src/api/client.ts:49) и [`honesty-regressions.mjs`](apps/miniapp/scripts/honesty-regressions.mjs:298), удалить [`health-contract.mjs`](apps/miniapp/scripts/health-contract.mjs:1).

### Пакет 3 принят (2026-09-30): API-only canonical catalog

Принят Пакет 3 плана [`docs/DESLOP_PLAN.md`](docs/DESLOP_PLAN.md). Изменённые файлы Пакета 3:

- [`apps/miniapp/src/api/client.ts`](apps/miniapp/src/api/client.ts:107) — удалён fixture/fallback; typed rejection для catalog/recommendations/saved; `getMeasure()` проверяет body-id, `getAllMeasures()` — массив.
- [`apps/miniapp/src/store.tsx`](apps/miniapp/src/store.tsx:58) — default saved пуст, localStorage фильтруется против canonical ID, state меняется только после server save/remove success.
- [`apps/miniapp/src/App.tsx`](apps/miniapp/src/App.tsx:78) — удалён default measure, валидация empty/oversized ID. Ограничение: query-путь `?startapp=measure&id=...` ещё не равен ADR-форме `measure_<id>`.
- [`apps/miniapp/src/pages/Other.tsx`](apps/miniapp/src/pages/Other.tsx:172) — grants/search строятся из API; [`MeasureDetailSheet.tsx`](apps/miniapp/src/components/MeasureDetailSheet.tsx:31) — только server fields и маркировка `MODEL DATA`, synthetic factual claims убраны.
- [`apps/miniapp/scripts/honesty-regressions.mjs`](apps/miniapp/scripts/honesty-regressions.mjs:468) — обновлён только H3 guard; новый focused harness [`catalog-contract.mjs`](apps/miniapp/scripts/catalog-contract.mjs:1).

Контрактная матрица: catalog/recommendations/saved/measure — только API, без fixture/fallback; сохранения — server-success-first; deep link — строгая валидация ID, query-форма ограничена.

Evidence (cwd `apps/miniapp`):

| Команда | Exit |
|---|---|
| `node scripts/catalog-contract.mjs` | 0 |
| `node scripts/health-contract.mjs` | 0 |
| `npm run build` | 0 |
| `node scripts/honesty-regressions.mjs` (после Пакета 3) | 1 — pre-existing H4 quiz assertion [`scripts/honesty-regressions.mjs`](apps/miniapp/scripts/honesty-regressions.mjs:305) |

memo-ID прогонов: `memo-3bb34424`; предыдущие: `memo-9352a1c4`, `memo-df9e4f44`, `memo-59ed431b`.

Accepted baseline semantics не менялись: defensive `initBridge`, user-id/self-echo guards. Python tests не запускались.

**Не доказано / не заявлять:** build/health/catalog PASS не означает full honesty/API/bot/visual/network/MAX PASS; полный honesty PASS не заявлен (exit 1 на quiz assertion). **Открытые блокеры:** H2, H4 (honesty exit 1 на quiz assertion), H5 — детали в [`docs/DESLOP_PLAN.md`](docs/DESLOP_PLAN.md); ограничение deep-link (query-путь ≠ ADR-форме `measure_<id>`). **Rollback:** revert [`client.ts`](apps/miniapp/src/api/client.ts:107), [`store.tsx`](apps/miniapp/src/store.tsx:58), [`App.tsx`](apps/miniapp/src/App.tsx:78), [`Other.tsx`](apps/miniapp/src/pages/Other.tsx:172), [`MeasureDetailSheet.tsx`](apps/miniapp/src/components/MeasureDetailSheet.tsx:31), [`honesty-regressions.mjs`](apps/miniapp/scripts/honesty-regressions.mjs:468); удалить [`catalog-contract.mjs`](apps/miniapp/scripts/catalog-contract.mjs:1).

> **Уточнение (2026-09-30, после Пакета 4):** приёмка Пакета 3 не распространяется на появившиеся в ходе подзадачи коммиты `994a889` (merge) и `1224a83` — их авторство/источник не установлены. Канонический deep-link `measure_<id>` (ограничение выше) после merge требует отдельной перепроверки; приёмка не означает закрытия H1–H5.

### Пакет 4 (2026-09-30): серверный квиз/сертификат — реализация и заявленные проверки; итоговая приёмка ограничена

Запись по **отчёту исполнителя** (не свежие прогоны приёмщика). Изменённые файлы (пути от `apps/miniapp/src`, кроме `scripts` — от `apps/miniapp`):

- [`client.ts`](apps/miniapp/src/api/client.ts:1) — `submitQuiz` server-only, schema-валидация, инварианты `passed`/`certificate`;
- [`QuizPage.tsx`](apps/miniapp/src/pages/QuizPage.tsx:29), [`QuizModal.tsx`](apps/miniapp/src/components/QuizModal.tsx:103) — удалены query fake-results и локальный success; добавлен retry;
- [`CertificatesPage.tsx`](apps/miniapp/src/pages/CertificatesPage.tsx:165) — удалён bootstrap из `quiz_completed`;
- [`Other.tsx`](apps/miniapp/src/pages/Other.tsx:269) — бейдж «5/5» зависит от persisted certificates;
- новый harness [`scripts/quiz-contract.mjs`](apps/miniapp/scripts/quiz-contract.mjs:1); [`catalog-contract.mjs`](apps/miniapp/scripts/catalog-contract.mjs:1) синхронизирован на `invalid_response`.

Заявленные прогоны (cwd `apps/miniapp`, отчёт исполнителя, exit 0): `honesty-regressions`, `quiz-contract`, `catalog-contract`, `health-contract`, `npm run build`; red-green «passed без сертификата»: exit 1 → 0. memo-ID `memo-04df770d` / `memo-0858e39f` при точечной сверке оказались инспекциями кода (assertions honesty-скрипта; бейдж `Other.tsx`), а не логами финальных прогонов; связь «команда → memo» не установлена.

Git-граница (read-only проверка 2026-09-30, cwd репозитория, exit 0): ветка `feat/frontend-gold-polish`, HEAD `da1847a`; в истории присутствуют `1224a83` и merge `994a889` — источник/авторство не установлены и никому не приписываются; tracked diff пуст, untracked — только [`scripts/quiz-contract.mjs`](apps/miniapp/scripts/quiz-contract.mjs:1).

**Не доказано / не заявлять:** H4 visual PASS не подтверждён (неизменность части разметки не заменяет визуальную проверку); H1–H5 не объявляются закрытыми по зелёному honesty — канонический deep-link `measure_<id>` (оставлен Пакетом 3) после merge требует отдельной проверки, H5 wiring/mapping отдельно не принят; проверка corrupted JSON не доказывает отбрасывание структурно правдоподобных старых fake-certificates — криптографической верификации локального payload нет, provenance и миграция старых записей требуют отдельного review; Python/API/bot tests не запускались; visual/network/MAX-гейты отложены владельцем. Общий проект PASS не заявляется.

**Rollback:** blanket-откат файлов или merge-коммитов запрещён — риск уничтожения baseline и изменений других пакетов; только точечный revert отдельных изменений после отдельного согласования и проверки diff; сейчас ничего не откатывается.

### Независимая приёмка: частичное соответствие (2026-09-30)

Verdict независимого debug-review: **health ACCEPT; catalog/deep-link PARTIAL; quiz/storage PARTIAL.** Пакеты 3–4 считать полностью принятыми нельзя; исторические записи выше сохраняются без изменений.

Evidence проверяющего (отчёт независимого debug-review, не новые прогоны этой задачи; cwd [`apps/miniapp`](apps/miniapp), все exit 0): `node scripts/health-contract.mjs`, `node scripts/catalog-contract.mjs`, `node scripts/quiz-contract.mjs`, `node scripts/honesty-regressions.mjs`, `npm run build`. Индивидуальные memo-ID прогонам инструментом не выданы; `memo-2406505f` относится только к grep/чтению и прогонам не присваивается. Lint-скрипт не объявлен — линт-гейт в evidence отсутствует.

Подтверждённые пробелы (post-read сверка 2026-09-30):

- **Deep-link:** [`App.tsx`](apps/miniapp/src/App.tsx:83) — по review принимает legacy `startapp=measure&id=...`; канонический `measure_<id>` не единственный путь. [`catalog-contract.mjs`](apps/miniapp/scripts/catalog-contract.mjs:1) не исполняет реальную связку App/bridge — зелёный тест не доказывает integration.
- **Лимиты ID:** [`maxBridge.ts`](apps/miniapp/src/lib/maxBridge.ts:164) допускает длинные ID (текущий код — payload до 512 символов, строка 165). Проверяющий сопоставил 200 символов с прежним клиентским лимитом 128, тогда как ранее в контрактах обсуждался лимит payload 512. Противоречие лимитов (128 vs 512) вынесено на сверку с каноническим контрактом MAX; **200 символов не фиксируется как дефект**.
- **Storage:** [`storage.ts`](apps/miniapp/src/lib/storage.ts:99), [`saveCertificate`](apps/miniapp/src/lib/storage.ts:109) — runtime-воспроизведение: структурно валидные legacy `demo-cert-1`/`cert-true` принимаются и отображаются как обычные сертификаты; corrupted JSON тест этого не ловит. Origin marker сам по себе — не криптографическая проверка. Требуются политика legacy/provenance и targeted regression.
- **`getDeepLinkPayload`** не используется App; источники payload дублируются. Не удалять как dead code без графа потребителей.
- **Retry** сохраняет ответы и не генерирует результат локально (по проверке кода); visual PASS не доказан.

Git-граница review: начало HEAD `610a2458`, конец `0b17152`; `styles.css` оставался dirty; авторство не установлено — результаты не считать привязанными к неизменному snapshot.

Не проверялось: Python/API/bot/visual/network/MAX. Следующий технический gate — закрыть реальные deep-link/storage пробелы и перепроверить на стабильном snapshot перед Пакетом 5. Общий PASS и blanket rollback не заявляются.

### Контракт корректирующего пакета — deep-link подпакет реализован, независимая приёмка ожидается (спецификация 2026-09-30)

Спецификация закрытия пробелов Пакетов 3–4 (verdict PARTIAL выше). **Статус: Deep-link — корректировка реализована (по отчёту исполнителя), независимая приёмка ожидается.** Пункт 1 (deep link) реализован: новый production-модуль [`apps/miniapp/src/lib/deepLink.ts`](apps/miniapp/src/lib/deepLink.ts:33) (`classifyStartParam`/`resolveLaunchParam`/`applyLaunchParam` — канонический `measure_<id>`, payload ≤ 512 / ID ≤ 504, lowercase-сегменты ID; первый непустой источник bridge → query → hash, невалидный приоритетный не проваливается вниз); [`App.tsx`](apps/miniapp/src/App.tsx:63) подключает resolver/orchestration и реальный `getMeasure` через `apiClient`; новый harness [`scripts/deep-link-contract.mjs`](apps/miniapp/scripts/deep-link-contract.mjs:1) импортирует production-модули; одна structural assertion [`scripts/honesty-regressions.mjs`](apps/miniapp/scripts/honesty-regressions.mjs:463) обновлена. Пункт 2 (storage v2) **не реализован** — всё ниже в части storage остаётся спецификацией.

Заявленные прогоны исполнителя (cwd `apps/miniapp`, не прогоны приёмщика): `deep-link-contract`/`catalog-contract`/`health-contract`/`quiz-contract` и `npm run build` — exit 0; [`honesty-regressions.mjs`](apps/miniapp/scripts/honesty-regressions.mjs:1) на рабочем дереве — **exit 1** на onboarding assertion (строка 467); изолированная реконструкция с HEAD-версией onboarding дала exit 0 — это **не PASS рабочего дерева**. Наличие UI goal IDs `start`/`grants`/`growth`/`education` само по себе не доказывает phantom saved IDs: записан только конфликт assertion/изменившегося onboarding; семантика требует H5 review. Авторство правок не устанавливалось и никому не приписывается.

Git-граница перепроверена read-only 2026-09-30 приёмщиком (memo_exec, exit 0): ветка `feat/frontend-gold-polish`, HEAD `0b17152` неизменен, но сторонние рабочие файлы менялись в ходе сессий — **стабильный snapshot всего проекта не доказан**. Текущий tracked dirty: `README.md`, `honesty-regressions.mjs`, `App.tsx`, `OnboardingSheet.tsx`, `SpotlightTutorial.tsx`, `SearchModal.tsx`, `Assistant.tsx`, `Other.tsx`, `assistantAnswers.tsx`, `TaxesService.tsx`, `styles.css`, `vite.config.ts`, `data/catalog/measures.json`; untracked: `scripts/deep-link-contract.mjs`, `src/lib/deepLink.ts`. Чужие hunks сохранены, ничего не откатывается. Новому коду нужна независимая приёмка; новых независимых PASS не заявляется.

**1) Deep link — канонический payload `measure_<id>`:**
- Полный payload ≤ 512 символов ⇒ ID ≤ 504 (`measure_` = 8). Алфавит ID: lowercase `a-z`, цифры, дефисы между непустыми сегментами.
- Legacy `startapp=measure&id=...` исключается — реализовано в [`deepLink.ts`](apps/miniapp/src/lib/deepLink.ts:33) (`classifyStartParam`); App больше не читает `params.get('id')` (guard [`honesty-regressions.mjs`](apps/miniapp/scripts/honesty-regressions.mjs:465)). Прежняя пометка «сейчас принимается в App.tsx — пробел» описывала pre-implementation состояние и устарела.
- Один production resolver используется App и тестируется импортом реального модуля. Приоритет источников: `WebApp.initDataUnsafe.start_param` → query `startapp`/`tgWebAppStartParam`/`start_param` → hash, в том же порядке; первый непустой invalid источник не замещается менее приоритетным. Дублирующий [`getDeepLinkPayload()`](apps/miniapp/src/lib/maxBridge.ts:139) не удалять без графа потребителей.
- Unknown ID / network / mismatch response карточку не открывают. Обычные маршруты, quiz launch, MAX init/back/sendData guards сохраняются.
- Raw launch param и [`initBridge`](apps/miniapp/src/lib/maxBridge.ts:1) сами по себе identity не удостоверяют; [`start_app_payload()`](services/bot/app/handlers.py:114) в bot handlers — **парсер/валидатор** start payload (формат + реестр ID), не доказательство HMAC-аутентификации. Проверка подлинности launch data должна происходить на сервере; конкретный механизм подписи называется только после чтения реального кода — здесь не выдумывается. Серверный regex `A-Za-z0-9_-` ([`handlers.py`](services/bot/app/handlers.py:110)) шире lowercase-парсера фронтенда — drift для отдельной проверки, весь backend согласованным не заявляется.

**2) Versioned certificate cache v2:**
- Старый фактический ключ [`zvery_certificates_v1`](apps/miniapp/src/lib/storage.ts:7) остаётся байт-в-байт, не мигрируется и не показывается автоматически как server history. Имя `zvery_certificates_v2` коллизий в кодовой базе не имеет (проверено поиском 2026-09-30) — перепроверить перед реализацией.
- Сохраняются точные поля валидного server submit response: `attempt_id`, `score`, `passed=true`, `pass_score`, `certificate {certificate_id, title, disclaimer, payload}`; локальные `cached_at`/`display_name` явно помечаются как не-серверные. Текущий shape — [`StoredCertificate`](apps/miniapp/src/lib/storage.ts:91) без версии/origin.
- Запись только после успешного submit ([`saveCertificate()`](apps/miniapp/src/lib/storage.ts:109)); read валидирует версию/shape, malformed игнорирует, corrupted JSON даёт пустой список без перезаписи ([`loadCertificates()`](apps/miniapp/src/lib/storage.ts:99)).
- Version/origin marker и shape validation НЕ доказывают HMAC-подлинность: v2 — локальный кэш ответа, не криптографически верифицированная история. Revalidation endpoint по архитектурному чтению не обнаружен — не выдумывать.
- Нужны тесты реальных storage/client (не mock-only): legacy records, malformed, offline/no-write, valid response. База — [`catalog-contract.mjs`](apps/miniapp/scripts/catalog-contract.mjs:1).

Следующий этап: независимая приёмка реализованного deep-link подпакета (реализация storage v2 остаётся открытой) на стабильной границе до Пакета 5. Удаление/откат чужих файлов и blanket revert запрещены.

### Storage v2 реализован; приёмка и честность UI-формулировок остаются открытыми (2026-09-30)

Пункт 2 спецификации выше реализован по **отчёту code** (не прогоны приёмщика); независимая приёмка ожидается. Изменено **пять** файлов (фраза исполнителя про «откат четырёх» ошибочна):

- [`apps/miniapp/src/lib/storage.ts`](apps/miniapp/src/lib/storage.ts:11) — cache `zvery_certificates_v2`; [`StoredCertificateV2`](apps/miniapp/src/lib/storage.ts:98) с `schema_version: 2` хранит точные поля server quiz result (`attempt_id`, `score`, `passed: true`, `pass_score`, `certificate {certificate_id, title, disclaimer, payload}`) плюс явно локальные `cached_at`/`display_name`; runtime-валидация [`isValidV2Entry()`](apps/miniapp/src/lib/storage.ts:131), dedup по `certificate_id` ([строка 215](apps/miniapp/src/lib/storage.ts:215)), presentation-адаптер [`loadCertificateViews()`](apps/miniapp/src/lib/storage.ts:231).
- [`QuizPage.tsx`](apps/miniapp/src/pages/QuizPage.tsx:41) и [`QuizModal.tsx`](apps/miniapp/src/components/QuizModal.tsx:134) — [`saveCertificateResult()`](apps/miniapp/src/lib/storage.ts:177) после успешного submit; [`CertificatesPage.tsx`](apps/miniapp/src/pages/CertificatesPage.tsx:169) — чтение через адаптер; Other badge получает v2 через `loadCertificates`, сам файл в подпакете не менялся.
- Legacy `zvery_certificates_v1` ([строка 10](apps/miniapp/src/lib/storage.ts:10)) байт-в-байт не читается, не переписывается, не мигрируется и не показывается автоматически.
- [`scripts/quiz-contract.mjs`](apps/miniapp/scripts/quiz-contract.mjs:65) расширен: legacy byte-stability (65–70, 189, 229), точный v2 roundtrip (191), malformed/damaged JSON без перезаписи (217–222), no-write guard (235).

Заявленные прогоны исполнителя (cwd `apps/miniapp`): RED legacy exit 1 → GREEN exit 0; quiz/catalog/health/deep-link harness и `npm run build` — exit 0; honesty-regressions — **exit 1** на H5 onboarding assertion. Дополнительный temp-прогон с отключённой assertion — диагностический эксперимент, **не** доказательство PASS полного honesty и не основание закрывать H5. Memo: `memo-4c3ed3b8` — hashes; `memo-70198910`/`memo-3b6c87fc` — diff, не логи тестов; индивидуальные ID прогонам не присваивались. Git-граница на старте документирования (read-only, memo_exec exit 0): ветка `feat/frontend-gold-polish`, HEAD `0b17152` не изменился; tracked dirty расширился, в том числе `storage.ts`, `QuizPage.tsx`, `QuizModal.tsx`, `CertificatesPage.tsx`, `quiz-contract.mjs`, плюс внешние удаления ассетов — чужие hunks сохранены, стабильный snapshot не доказан.

**Не доказано / не заявлять:** version/shape не доказывают HMAC или подлинность localStorage; старые записи сохранены, но не считаются серверной историей. [`CertificatesPage.tsx`](apps/miniapp/src/pages/CertificatesPage.tsx:146) сохраняет вводящие в заблуждение формулировки — «Криптографическая верификация: SHA-256 Validated · ст. 60 ФЗ №273» (строка 146), «верифицированный именной сертификат» ([211](apps/miniapp/src/pages/CertificatesPage.tsx:211)), «Верифицирован» ([294](apps/miniapp/src/pages/CertificatesPage.tsx:294)): нужен отдельный designer-пакет, общий H4 PASS не пишется. MAX sendData сохранён по отчёту; вызов bridge — не evidence доставки, live MAX не проверялся. Deep-link independent gate, H5/CI/Python/API/bot/visual/network/MAX открыты. Rollback только точечный после согласования, blanket запрещён.

### Финальный итог автоматизации (2026-09-30): verify-агрегатор принят; общая приёмка частичная, работы приостановлены

Завершён последний разрешённый пакет: автоматические frontend-проверки собраны в одну команду. Запуск: `cd apps/miniapp && npm run verify`. Изменено:

- [`apps/miniapp/package.json`](apps/miniapp/package.json:9) — новый script `verify`;
- [`apps/miniapp/scripts/verify-frontend.js`](apps/miniapp/scripts/verify-frontend.js:1) — агрегатор health/catalog/quiz/deep-link/honesty/build: продолжает сбор результатов и возвращает exit 1 при любом провале;
- [`.github/workflows/ci.yml`](.github/workflows/ci.yml:38) — frontend-job переключён на `npm run verify`; обычный build сохранён, API/bot/guards jobs и Python 3.12/npm ci не менялись.

| Шаг | Статус |
|---|---|
| health / catalog / quiz / deep-link harness (4) | PASS |
| `npm run build` | PASS |
| honesty-regressions | **FAIL** — [`honesty-regressions.mjs`](apps/miniapp/scripts/honesty-regressions.mjs:467), actual `true` / expected `false`: assertion запрещает UI goal IDs `start`/`grants`/`growth`/`education` в OnboardingSheet — отдельное от saved IDs пространство; по диагностике DevOps — test drift, фантомные сохранения не доказаны; тест не отключали и не исправляли, H5 не принят |
| pytest api/bot | NOT RUN / BLOCKED — нет `python3.12` (системный 3.14.7), pytest/fastapi-окружение не готово; ничего не устанавливалось |
| lint | NOT RUN — script отсутствует |
| visual / network / MAX | NOT RUN |

Memo evidence: финальный прогон [`verify`](apps/miniapp/scripts/verify-frontend.js:1) — `memo-cebbba2c` (exit 1, failed_steps=1); baseline — `memo-fb50e440` (exit 1); diff/hashes/`git diff --check` — `memo-c164781d` (exit 0). Relevant runtime/test hashes в финальном прогоне не менялись. Git-граница: ветка `feat/frontend-gold-polish`, HEAD `0b17152de149727204b7e09272371baff19a1a94` — факт той проверки, не вечная гарантия. CI config локально валиден; GitHub run NOT RUN. Неподтверждённые UI claims сертификатов/доверие localStorage остаются вне закрытого scope.

**Итог: автоматизация выполнена, общая приёмка частичная; работы приостановлены по текущему scope.** Общий PASS и CI PASS не заявляются.

### Реализация полировки (2026-09-29)

> **Статус фронтенда:** Весь фронтенд приложения, кроме Личного кабинета (ЛК), теперь полностью отполирован и приведен к единому золотому дизайн-стандарту Главной страницы.

- **Сквозная гармонизация стилей по эталону Главной страницы:**
  - **Карточки:** Все карточки во всех разделах приведены к канону: фон `#2a2a2b`, рамка `1px solid #363638`, скругление `var(--radius-card, 16px)`, пружинящий отклик `:active { transform: scale(0.96); }`.
  - **Пины и бейджи:** Полностью устранены круглые и разнокалиберные пилюли (`999px`, `2rem`, `1.2rem`). Все бейджи переведены на фирменный сквиркл `border-radius: 6px` с шрифтом `VK Sans Display` (`var(--ui)`), начертанием `700`, регистром `uppercase` и трекингом `0.04em`.
  - **Иконки и чистота зависимостей:** Устранены остаточные зависимости от `lucide-react`. Все пиктограммы переведены на нативные SVG-глифы (`ServiceGlyph`, `CheckIcon`, `BellIcon`, `ClockIcon`). Иконки сервисов унифицированы по фирменной палитре (золото/фиолетовый), удален случайный синий цвет.
- **Реорганизация раздела «Обучение» (`/learning`):**
  - Закреплена верхняя плашка «Продолжить обучение» с визуалом плеера, индикатором прогресса урока и акцентным градиентом.
  - Выделен самостоятельный раздел «Тесты» с карточкой «Тест на знание основ бизнеса» (индикаторы «5 вопросов», «Сертификат», «Налоги и гранты», тайминг 3-5 мин, счётчик прогресса).
  - Каталог курсов четко разделен на категории «Мои курсы» (активные курсы с прогресс-баром) и «Все курсы» (каталог доступных программ).
- **Экран прохождения теста (`/quiz`):**
  - Добавлен заголовок «Основы бизнеса» с нативной кнопкой «Назад».
  - Справа сверху интегрирован сквиркл-бейдж счётчика вопросов `1/5` в каноничном стиле ZVERY.
  - Варианты ответов приведены к карточкам `16px` на фоне `#2a2a2b` с рамкой `1px solid #363638` (`#8455f6` при выборе).
- **Полировка экрана Ассистента (`/assistant`) и Таббара:**
  - Идеальное центрирование и плотная подгонка маскота к плашке заголовка (`margin-left: -1.95rem`) с сохранением 3D-лучей сверху.
  - Круглая центральная кнопка таббара: устранён зазор/артефакт слева, текстура двери расширена до краёв (`mascot-door-tab.webp`), маскот идеально вписан в светящийся портал без черных пустот на любых разрешениях.
- **Глобальная WebP-оптимизация графики (Zero Layout Shift):**
  - Все 13 ассетов (маскоты, истории, бейджи) конвертированы в `.webp` с сохранением оригинальных пропорций, разрешения и прозрачности.
  - Суммарный вес ассетов снижен с **3.99 МБ** до **~489 КБ** (**-87.7%**, почти в 9 раз легче и быстрее загрузка в Web/Telegram/MAX miniapp).
  - Сборка `tsc -b && vite build` — 167ms (0 ошибок TS).
- **Текущий статус готовности:** **Весь фронтенд, кроме Личного кабинета (ЛК), полностью отполирован** (Главная, Все сервисы, Гранты и поддержка, Обучение, Квиз и сертификат, Ассистент, Таббар, все шторки и чек-листы). Единственный оставшийся финальный экран для доводки — **Личный кабинет (`/profile`)**.

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
- **Пустые состояния:** Компонент `EmptyState` с 3D-маскотом `mascot-shrug.webp` для поиска и каталога мер.
- **Проверки:** `npm run build` — 0 ошибок TS; Playwright Visual QA — 0 runtime-ошибок в консоли; тесты API и бота — 100% PASS.

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

CI: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) активен и проверен в GitHub Actions (miniapp build + honesty, pytest api/bot, compose- и client-guard). **Статус прогона для ветки `feat/frontend-gold-polish`:** `✓ SUCCESS` (зелёный чек, время выполнения ~25 секунд).

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

## Следующий шаг

Полная локальная приёмка незакоммиченного дерева ветки `feat/final-mvp-polish` (`npm run build` + honesty-regressions + pytest api/bot + `docker compose config`), затем коммит и тег релиза. *Предложено, не выполнено.*
