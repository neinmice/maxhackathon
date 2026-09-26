# Развёртывание на Ubuntu 24

## До запуска

1. Настройте домен `zverybot.ru`.
2. Укажите DNS A-запись этого домена на `95.181.213.55`.
3. Откройте на VPS входящие TCP-порты `80` и `443`. Не публикуйте `5432`, `8000` и `8001` в production firewall.
4. Установите Docker Engine и Docker Compose plugin.
5. Клонируйте репозиторий на VPS и создайте файл `.env` на основе `.env.example`. `.env` не коммитится.

## Обязательные переменные `.env`

```dotenv
APP_ENV=production
POSTGRES_DB=navigator
POSTGRES_USER=navigator
POSTGRES_PASSWORD=CHANGE_DB_PASSWORD
MAX_BOT_TOKEN=получить-в-кабинете-MAX
MAX_BOT_USERNAME=публичный_username_бота
MAX_WEBHOOK_SECRET=случайный-секрет-минимум-32-байта
PUBLIC_DOMAIN=zverybot.ru
PUBLIC_BASE_URL=https://zverybot.ru
CERTIFICATE_SIGNING_SECRET=отдельный-случайный-секрет-минимум-32-байта
QUIZ_ANSWER_KEY_JSON=
QUIZ_PASS_SCORE=70
```

Сгенерировать секрет на VPS:

```bash
openssl rand -base64 48
```

## Первый запуск

После того как DNS уже указывает на VPS:

```bash
docker compose -f infra/compose.yaml --profile production up --build -d
docker compose -f infra/compose.yaml ps
curl https://zverybot.ru/health
curl https://zverybot.ru/bot/health
```

Caddy автоматически выпустит и будет обновлять TLS-сертификат. При ошибке сертификата сначала проверьте A-запись и доступность портов `80` и `443`.

## Регистрация webhook в MAX

После создания бота в MAX, заполнения токена и запуска контейнеров:

```bash
docker compose -f infra/compose.yaml exec bot python -m app.manage register-webhook
```

Команда регистрирует `https://zverybot.ru/webhooks/max` и события `bot_started`, `message_created`, `message_callback`.

## Роутинг

| Путь | Сервис |
| --- | --- |
| `/` | Mini App |
| `/api/v1/catalog/*`, `/api/v1/recommendations`, `/api/v1/measures/{id}` | API |
| `/webhooks/max`, launch data, квиз, сохранения и opt-in | Bot |

## Безопасность

- Не передавайте токен MAX, webhook secret и certificate secret в Git, фронтенд или чат.
- Mini App отправляет исходный `WebApp.initData`; bot проверяет подпись перед операциями пользователя.
- Если Ubuntu не доверяет сертификату, используемому MAX API, добавьте доверенный CA в системное хранилище и задайте путь через `MAX_CA_BUNDLE_PATH`.
