# ZVERY MAX Bot Service

## Что реализовано

Сервис собирает MAX-интеграцию в одном месте и не дублирует каталог или правила рекомендаций:

- `POST /webhooks/max` принимает события MAX;
- проверяет `X-Max-Bot-Api-Secret`;
- дедуплицирует повторную доставку по хэшу события;
- обрабатывает `bot_started`, `/start`, текстовые команды и callback-события;
- формирует меню с `open_app` и deep-link payload для Mini App;
- отправляет сообщения через `https://platform-api2.max.ru`;
- проверяет `X-Max-Init-Data` на сервере через HMAC-SHA256;
- сохраняет пользователей, сохранённые меры, opt-in напоминаний и результаты квиза в PostgreSQL;
- формирует подписанный payload сертификата;
- предоставляет endpoint регистрации webhook через management-команду.

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

Для работы PostgreSQL задайте `DATABASE_URL`. Для тестов кода без базы используется `InMemoryStore`.

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
