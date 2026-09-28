# Отчёт для независимого ревью (состояние на конец сессии)

> Назначение: это отчёт о фактически выполненной работе и фактическом состоянии репозитория для независимого ревью Claude. Это **не** план работ и **не** заявление о готовности продукта. Статусы в матрице — буквальные: `DONE`, `PARTIAL`, `BLOCKED`, `NOT_APPLICABLE` — с оговорками, где они есть.

---

## 7.1 База (git-состояние)

Проверенные факты этой сессии:

- Исходная ветка: `chore/bootstrap-skeleton`, SHA `2ec1d2b5d85ae1a6f3fbd6b05ac0b894b155d767`.
- Эта ветка является предком `origin/feature/unified-mvp_Pavel` = `c22ee1e0c15f9f85456252140580dc52d0bcd121`.
- Рабочая ветка: `fix/honest-vertical`. HEAD остался на `c22ee1e`, **нового коммита нет**.
- До начала работы рабочее дерево было чистым.
- **Все исправления находятся в незакоммиченном состоянии** (working tree / index).
- Push, merge и любые действия на VPS в этой сессии не выполнялись.

## 7.2 Матрица статусов

| Пункт | Статус | Оговорка / факт |
|---|---|---|
| A | DONE | — |
| B1 | DONE | Полный production runtime не поднимался |
| B2 | DONE | Реальный MAX не проверялся |
| B3 | DONE | Убраны: локальный сертификат, signed-proof, CERT-ZVERY, `mock_ok`, фикстурный каталог |
| B4 | DONE | — |
| C1–C2 | PARTIAL | Один контракт, но каталог синтетический |
| C3 | DONE | Локально на `127.0.0.1:19080`; на VPS не поднимался |
| D | PARTIAL | Серверный сценарий есть; реального MAX нет |
| E1 | PARTIAL | Серверный HMAC-сертификат есть; PDF и explanations отсутствуют |
| E2 | DONE | Согласие глобальное и по умолчанию выключено |
| E3 | BLOCKED | Напоминания не отправляются; передача описана в [`docs/REMINDERS_HANDOFF.md`](REMINDERS_HANDOFF.md) |
| E4 | DONE | Claim до успеха, не exactly-once |
| E5 | BLOCKED | Postgres на VPS не доказан; локальный `5432` — чужой процесс, с паролем |
| F1–F2 | DONE | — |
| F3 | PARTIAL | Скриншоты есть; визуальная проверка не является проверкой MAX |
| G1 | NOT_APPLICABLE | Массовое удаление не проводилось |
| G2 | PARTIAL | — |
| G3 | PARTIAL | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) существует; GitHub Actions не запускался |

## 7.3 Проверки (команды и логи)

| Проверка | Результат | Лог |
|---|---|---|
| API pytest | 34 passed | `/tmp/maxhackathon-e-api-pytest.log` |
| Bot pytest | 22 passed, 1 skipped (skip из-за пароля Postgres) | `/tmp/maxhackathon-e-bot-pytest.log` |
| API pytest после трёх синтетических записей каталога | 34 passed | `/tmp/maxhackathon-synth-api-pytest.log` |
| `npm run build` (miniapp) | exit 0 | `/tmp/maxhackathon-f6-build.log` |
| `honesty-regressions` | exit 0 | `/tmp/maxhackathon-d-honesty.log` |
| Gateway: `save` / `quiz` / `opt-in` без initData | 401 JSON на все три | `/tmp/maxhackathon-c3-gateway.log` |
| Локальный CI guard | exit 0 | `/tmp/maxhackathon-g-ci-check.log` |

Оговорка: CI guard — локальная проверка. **Это не прогон GitHub Actions.**

## 7.4 Контракт каталога

- В [`data/catalog/measures.json`](../data/catalog/measures.json) сейчас **три синтетические записи**: `demo-kazan-support-001`, `demo-moscow-support-001`, `demo-spb-support-001`.
- Все записи — `MODEL DATA`, `deadline: null`, без сумм; ссылка на `example.invalid` не кликабельна.
- Карточка меры показывает пометку «Примерочные данные».
- Это **ещё не** девять записей agro/services/it. Такое расширение только запланировано в [`docs/POLISH_PLAN.md`](POLISH_PLAN.md) и на ревью **не выдавать за сделанное**.
- `recommendations` фильтрует равенством (equality filter).
- Добавлен маршрут `GET /api/v1/measures`.
- Закладки остались на стороне bot.

## 7.5 Runtime и UI

- Скриншоты Visual QA: [`docs/visual-qa/`](visual-qa).
- Кадр [`long-title-380.png`](visual-qa/long-title-380.png) после последней правки: длинный заголовок отображается **над** карточкой, не поверх неё.
- При выключенном backend ожидаемы: 404 каталога и отказ квиза.
- Реальные MAX, Android и iOS **не проверялись**.

## 7.6 Осталось (не входит в выполненную работу этого отчёта)

- Деплой на `95.181.213.55` и `zverybot.ru` не запускался.
- Postgres после рестарта не доказан.
- PDF и explanations не реализованы.
- Напоминания не отправляются (см. п. E3).
- GitHub Actions не запускался.
- Следующий объём полировки записан в [`docs/POLISH_PLAN.md`](POLISH_PLAN.md) и в выполненную работу этого отчёта **не входит**.

---

## Инструкция для независимого ревью (Claude)

1. Смотреть `git diff` относительно `c22ee1e` — все изменения незакоммичены, нового коммита нет.
2. **Не считать этот отчёт доказательством**: каждый статус из матрицы 7.2 проверять по коду, тестам и логам самостоятельно.
3. Отдельно проверить:
   - отсутствие локальной выдачи сертификата (п. B3: локальный сертификат, signed-proof, CERT-ZVERY, `mock_ok`, фикстурный каталог удалены);
   - маршруты gateway и их поведение без `initData` (п. 7.3);
   - отрицательные тесты (401 JSON без initData);
   - незакоммиченное состояние рабочего дерева.
4. В выводах ревью не использовать формулировки «готово» и «100%» — состояние частичное, часть пунктов PARTIAL/BLOCKED (см. 7.2 и 7.6).
