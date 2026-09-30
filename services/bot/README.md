# ZVERY MAX Bot Service

## Что реализовано

Сервис собирает MAX-интеграцию в одном месте и не дублирует каталог или правила рекомендаций:

- `POST /webhooks/max` принимает события MAX;
- проверяет `X-Max-Bot-Api-Secret`;
- дедуплицирует повторную доставку по хэшу события: claim становится `processed` только после успеха, сбой отпускает claim, зависший `processing` можно забрать снова через 2 минуты, готовые записи хранятся 7 дней; это не exactly-once доставка во внешний MAX;
- обрабатывает `bot_started`, `/start`, текстовые команды и callback-события;
- формирует меню с `open_app` и deep-link payload для Mini App;
- отправляет сообщения через `https://platform-api2.max.ru`;
- проверяет `X-Max-Init-Data` на сервере через HMAC-SHA256;
- сохраняет пользователей, сохранённые меры, прогресс чеклистов, глобальный флаг согласия (одно значение на пользователя, не подписка на меру) и результаты квиза в PostgreSQL;
- запускает отдельный worker напоминаний: один раз отправляет сообщение в 09:00 по `Europe/Moscow` за заданное число дней до `deadline`, если пользователь включил уведомления и у него сохранена мера либо есть незавершённый чеклист;
- формирует payload сертификата как base64url JSON и HMAC-SHA256, без публичной верификации; название и дисклеймер сертификата уже в боте, счёт и факт прохождения считает только сервер, PDF и explanations не реализованы и ждут решения владельца;
- `GET /health` отвечает 503, пока база недоступна;
- предоставляет endpoint регистрации webhook через management-команду.
- PDF сертификата и публичная верификация пока не реализованы: текущий сертификат — подписанный payload для Mini App, а не государственный документ.

## Важное ограничение по данным квиза

Ключ правильных ответов не зашит в код. Его должен утвердить владелец продуктового контента и передать через `QUIZ_ANSWER_KEY_JSON`. Пока переменная пуста, submit квиза возвращает `quiz_not_configured`.

Пример:

```dotenv
QUIZ_ANSWER_KEY_JSON={"v1":{"q1":"a","q2":"b"}}
QUIZ_PASS_SCORE=70
REMINDER_POLL_SECONDS=60
REMINDER_LEAD_DAYS=1
```

Для текущего тематического квиза ZVERY ключ из пяти вопросов имеет вид:

```dotenv
QUIZ_ANSWER_KEY_JSON={"v1":{"q1":"a","q2":"b","q3":"c","q4":"a","q5":"b"}}
```

`deadline` берётся только из каталога. Записи с `deadline: null` не порождают напоминания; это позволяет включить worker до утверждения продуктовых сроков.

## Чеклисты

Прогресс чеклиста хранится на стороне bot в PostgreSQL и доступен авторизованным Mini App запросам:

- `GET /api/v1/measures/{measure_id}/checklist` — список документов и отметок;
- `POST /api/v1/measures/{measure_id}/checklist` — сохранить одну отметку `{item_key, completed}`.

Если пользователь не передал валидный `X-Max-Init-Data`, оба endpoint возвращают `401`.

## Локальный запуск

Из этой директории:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. uvicorn app.main:app --reload --port 8001
```

Для работы PostgreSQL задайте `DATABASE_URL`. `InMemoryStore` используется только тестами обработчиков и не заменяет проверку Postgres. **PostgresStore на этой машине не проверен**: на `127.0.0.1:5432` отвечает чужой контейнер, требующий пароль; отдельная БД не создавалась, сохранение данных после рестарта не доказано.

Проверка:

```bash
curl http://localhost:8001/health
```

Тесты:

```bash
pytest
```

## Регистрация webhook

В `.env` должны быть заполнены:

```dotenv
MAX_BOT_TOKEN=...
MAX_BOT_USERNAME=t826_hakaton_max_bot
MAX_WEBHOOK_SECRET=...
PUBLIC_BASE_URL=https://полный-домен
```

Затем:

```bash
PYTHONPATH=. python -m app.manage register-webhook
```

В Docker:

```bash
docker compose -f infra/compose.yaml exec bot python -m app.manage register-webhook
```

## Production

Инструкция для Ubuntu 24 находится в `docs/VPS_DEPLOYMENT.md`. Caddy принимает HTTPS на `80/443`, Mini App отдаётся с `/`, API остаётся на `/api`, а webhook направляется в bot-сервис через `/webhooks/max`.

Токены и секреты не должны попадать в Git, frontend bundle или логи.
