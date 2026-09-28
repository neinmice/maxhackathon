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
- сохраняет пользователей, сохранённые меры, глобальный флаг согласия (одно значение на пользователя, не подписка на меру) и результаты квиза в PostgreSQL; напоминания и календарные события не отправляются;
- формирует payload сертификата как base64url JSON и HMAC-SHA256, без публичной верификации; название и дисклеймер сертификата уже в боте, счёт и факт прохождения считает только сервер, PDF и explanations не реализованы и ждут решения владельца;
- `GET /health` отвечает 503, пока база недоступна;
- предоставляет endpoint регистрации webhook через management-команду.
- Отправка напоминаний и PDF сертификата не реализованы.

## Важное ограничение по данным квиза

Ключ правильных ответов не зашит в код. Его должен утвердить владелец продуктового контента и передать через `QUIZ_ANSWER_KEY_JSON`. Пока переменная пуста, submit квиза возвращает `quiz_not_configured`.

Пример:

```dotenv
QUIZ_ANSWER_KEY_JSON={"v1":{"q1":"a","q2":"b"}}
QUIZ_PASS_SCORE=70
```

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
MAX_BOT_USERNAME=...
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
