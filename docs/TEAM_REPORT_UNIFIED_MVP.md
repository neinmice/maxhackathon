# Отчёт по объединению MVP: Команда ZVERY (Хакатон MAX)

**Ветка в Git**: `fix/honest-vertical`, база `c22ee1e`, изменения в рабочей копии **не закоммичены**
**Дата отчёта**: 27 сентября 2026 г.
**Для кого**: Стас (Тимлид / Дизайн), Саша (Бэкенд / Бот), Паша (Фронтенд / UI)

> Этот файл фиксирует текущее состояние и ограничения. Это не заявление о готовом MVP.

> **Указатель:** единственный рабочий план следующего этапа полировки — [`docs/POLISH_PLAN.md`](POLISH_PLAN.md). Устаревшее в этом отчёте: цифры сторис сознательно оставлены как есть, оговорка о синтетике будет добавлена только в презентации; отрасли каталога станут `agro`/`services`/`it` вместо текущего `food` (девять записей, город × отрасль).

---

## 📌 1. Что сделано в объединении

Авторство прежних изменений сохраняется:

1. **Эталонный frontend Стаса из Canva** перенесён в `apps/miniapp`; стили, геометрия и типографика сохранялись как основа (см. [`docs/CODE_PROVENANCE_AND_CHANGES.md`](CODE_PROVENANCE_AND_CHANGES.md)).
2. **Бэкенд и MAX-бот Саши** (`services/api`, `services/bot`) интегрированы с клиентом: аутентификация через `X-Max-Init-Data`, квиз, сохранение мер и глобальный флаг согласия на уведомления.
3. **Задачи Паши** (каркас, онбординг, карточка меры, квиз) реализованы в коде, но с ограничениями, перечисленными ниже; часть из них не может быть закрыта без решения владельца.

---

## 🎨 2. Для Стаса (Дизайн, Frontend и UI-компоненты)

1. **Типографика и дизайн-токены**:
   * Подключены шрифты `@fontsource/unbounded`, `@fontsource/silkscreen` и кастомный `VK Sans Display` (`VKSansDisplay-Regular.woff2` в `public/fonts/`).
   * Сохранены переменные палитры: `--bg: #141414`, `--card: #202022`, `--yellow: #f5c56d`, `--purple: #9d6bc6`.
2. **Векторная графика и маскот**: оригинальный рендер маскота (`mascot-door.png`), векторные компоненты в [`apps/miniapp/src/components/icons.tsx`](../apps/miniapp/src/components/icons.tsx). Unicode-эмодзи в интерфейсе не используются.
3. **Компоненты**: онбординг ([`apps/miniapp/src/components/OnboardingSheet.tsx`](../apps/miniapp/src/components/OnboardingSheet.tsx)), карточка меры ([`apps/miniapp/src/components/MeasureDetailSheet.tsx`](../apps/miniapp/src/components/MeasureDetailSheet.tsx)), квиз ([`apps/miniapp/src/components/QuizModal.tsx`](../apps/miniapp/src/components/QuizModal.tsx)).
4. **Визуальный дефект наложения заголовка закрыт** по кадру [`docs/visual-qa/long-title-380.png`](visual-qa/long-title-380.png): заголовок стоит над карточкой. Кадр принят координатором. Это не проверка реального MAX.

---

## ⚙️ 3. Для Саши (Бэкенд, Бот и Архитектура)

1. **Аутентификация**: пользовательские маршруты bot требуют `X-Max-Init-Data`, проверка подписи — на сервере (HMAC-SHA256).
2. **Deep-linking**: карточка открывается по payload `measure_<id>` с ID каталога; правила описаны в [`docs/API_CONTRACT.md`](API_CONTRACT.md).
3. **API**: один контракт `/api/v1`; каталог на `:8000`, пользовательские маршруты на `:8001`. Нормативное решение — [`docs/ADR/0001-single-catalog-contract.md`](ADR/0001-single-catalog-contract.md).
4. **Сертификат квиза**: название, дисклеймер, `score`/`passed` и payload считает и подписывает **только сервер** (base64url JSON + HMAC-SHA256). Это не подпись государственного документа и не публичная верификация. PDF и explanations заблокированы до решения владельца.
5. **Тесты**: pytest в `services/api` и `services/bot` запускается локально из venv с установленными [requirements.txt](../services/api/requirements.txt) / [requirements.txt](../services/bot/requirements.txt). `InMemoryStore` покрывает только тесты обработчиков.

---

## 📋 4. Статус задач Паши из командной таблицы

Код задач написан, но статусы ниже — фактические, без «100%»:

| № | Задача | Состояние |
|---|---|---|
| **7** | Каркас frontend и дизайн-токены | Сделано на основе макета Стаса |
| **8** | Реестр источников и каталога мер | Три синтетические записи, все `MODEL DATA`; `content_gaps` пустой. Это не официальный реестр |
| **10** | Карточка меры и чеклист | Сделано; для `MODEL DATA` видна пометка «Примерочные данные», `example.invalid` не кликабелен |
| **12** | Onboarding и экран рекомендаций | Сделано; состояния loading/empty/error реализованы |
| **14** | Экраны квиза и сертификата | Сделано; PDF и explanations BLOCKED |
| **17** | Мобильная, error и accessibility проверка | Наложение заголовка на 380px закрыто по принятому кадру [`docs/visual-qa/long-title-380.png`](visual-qa/long-title-380.png). Реальный MAX, Android и iOS не проверялись |

---

## 💻 5. Как запустить и проверить локально

### Фронтенд:

```bash
cd apps/miniapp
npm ci
npm run build    # tsc -b && vite build
npm run dev      # 127.0.0.1:3000 с proxy-разделением API/bot
```

### Тесты бэкенда (pytest из venv с установленными requirements):

```bash
cd services/api && python -m pytest -q
cd services/bot && python -m pytest -q
```

### Guard-скрипты и CI:

```bash
node apps/miniapp/scripts/honesty-regressions.mjs
```

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) добавлен, но GitHub Actions по нему **не запускался** — локально проверены только guard-скрипты.

### Compose:

* production ([`infra/compose.yaml`](../infra/compose.yaml)) требует `APP_ENV_FILE` — приватный env-файл **вне git**; без него bot и `db` отказываются стартовать. Успешный production Docker runtime на этой машине не запускался.
* dev — [`infra/compose.dev.yaml`](../infra/compose.dev.yaml) (API `127.0.0.1:8000`, bot `127.0.0.1:8001`, web `127.0.0.1:8080`).

---

## ⚠️ 6. Ограничения (не закрыто)

* **Каталог**: три синтетические записи — `demo-kazan-support-001`, `demo-moscow-support-001`, `demo-spb-support-001`. Все `MODEL DATA`, не `CONFIRMED`. `content_gaps` для трёх регионов пустой. Отрасль записей `food` устарела: по [`docs/POLISH_PLAN.md`](POLISH_PLAN.md) (п. 2) каталог станет девятью записями город × отрасль `agro`/`services`/`it`.
* **Сертификат**: выдаёт только сервер; PDF и explanations BLOCKED и ждут решения владельца. PDF не входит в handoff напоминаний.
* **Напоминания**: не реализованы. Задание на следующую реализацию — [`docs/REMINDERS_HANDOFF.md`](REMINDERS_HANDOFF.md). Сейчас сохраняется только глобальный флаг согласия, сообщения не отправляются.
* **Деплой не выполнен.** [`docs/VPS_DEPLOYMENT.md`](VPS_DEPLOYMENT.md) описывает `95.181.213.55` и `zverybot.ru`, но сервер этой работой не проверялся. Postgres есть в [`infra/compose.yaml`](../infra/compose.yaml); на VPS его наличие не доказано.
* **PostgresStore**: на этой машине не проверен — чужой Postgres на `127.0.0.1:5432` требует пароль; сохранение данных после рестарта не доказано.
* **Реальный MAX, Android и iOS**: не проверялись. Браузерный тест не равен MAX. VPS и MAX этой работой не проверялись.
* **Gateway**: разделение C3 проверялось локально на `127.0.0.1:19080`, не на VPS (порты `8000` и `8080` были заняты чужим стеком).
* **Визуал**: наложение заголовка закрыто по кадру [`docs/visual-qa/long-title-380.png`](visual-qa/long-title-380.png), принятому координатором.
* **CI**: workflow добавлен, GitHub Actions не запускался.

## ↩️ 7. Откат

Изменения не закоммичены. Откат — `git checkout` / `git restore` от базы `c22ee1e`. Неотслеживаемые файлы (`.github/`, `docs/ADR/`, `docs/visual-qa/`, `infra/compose.dev.yaml`, `apps/miniapp/scripts/` и другие) удалять только осознанно.

---

## 🔎 Независимая проверка

Подробный отчёт независимой проверки координатора будет опубликован в чате команды. Этот файл фиксирует только текущее состояние и ограничения; MVP готовым не называется.
