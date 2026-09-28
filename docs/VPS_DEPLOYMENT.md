# Развёртывание на Ubuntu 24

> **Статус проверки**: gateway-разделение C3 (каталог `:8000` / bot `:8001`) проверялось **локально на `127.0.0.1:19080`**, не на VPS. На этой машине порты `8000` и `8080` были заняты чужим стеком. Production-стек по этой инструкции на VPS не разворачивался; Caddy, TLS и DNS `zverybot.ru` не проверялись.

## До запуска

1. Настройте домен `zverybot.ru`.
2. Укажите DNS A-запись этого домена на `95.181.213.55`.
3. Откройте на VPS входящие TCP-порты `80` и `443`. PostgreSQL, API и bot не публикуются: в [`infra/compose.yaml`](../infra/compose.yaml) наружу выведены только `80` и `443` у Caddy.
4. Установите Docker Engine и Docker Compose plugin.
5. Клонируйте репозиторий. `.env.example` — публичный шаблон, его нельзя передавать контейнерам. Скопируйте ключи в приватный файл вне git, замените каждый `CHANGE_ME` и не коммитьте этот файл.

## Два слоя переменных

- В [`infra/compose.yaml`](../infra/compose.yaml) интерполяция Compose используется только для пути `APP_ENV_FILE` и для `PUBLIC_DOMAIN`. Значения секретов туда не подставляются.
- `env_file` — окружение процесса в контейнере. `environment:` задаёт только `APP_ENV=production` и публичный домен Caddy. Поэтому `docker compose config` печатает путь приватного файла, а не токен, webhook secret, certificate secret или пароль БД.
- `APP_ENV=production` отклоняет пустые и известные шаблонные секреты при создании настроек bot. Контейнер `db` делает ту же проверку пароля в своём entrypoint и завершается до запуска PostgreSQL.

## Обязательные переменные приватного env

Имена совпадают с [`.env.example`](../.env.example). Значения ниже — напоминание, что подставлять нужно свои секреты, а не текст из шаблона:

```dotenv
APP_ENV=production
POSTGRES_DB=navigator
POSTGRES_USER=navigator
POSTGRES_PASSWORD=<секрет БД, не из шаблона>
MAX_BOT_TOKEN=<токен из кабинета MAX>
MAX_BOT_USERNAME=<публичный username бота>
MAX_WEBHOOK_SECRET=<случайный секрет минимум 32 байта>
PUBLIC_DOMAIN=zverybot.ru
PUBLIC_BASE_URL=https://zverybot.ru
CERTIFICATE_SIGNING_SECRET=<отдельный случайный секрет минимум 32 байта>
QUIZ_ANSWER_KEY_JSON=
QUIZ_PASS_SCORE=70
```

Сгенерировать секрет на VPS:

```bash
openssl rand -base64 48
```

Проверка конфигурации без запуска контейнеров:

```bash
docker compose --env-file /path/to/private.env -f infra/compose.yaml config --no-env-resolution
```

Флаг обязателен: без него Compose разворачивает `env_file` и печатает секреты. С флагом в выводе остаётся только путь `APP_ENV_FILE`, без значений `MAX_BOT_TOKEN`, `MAX_WEBHOOK_SECRET`, `CERTIFICATE_SIGNING_SECRET` и `POSTGRES_PASSWORD`. Пустые и шаблонные секреты эта команда не запускает: bot отклоняет их при создании настроек, а entrypoint `db` завершается до старта PostgreSQL.

## Первый запуск

После того как DNS уже указывает на VPS и приватный env заполнен:

```bash
export APP_ENV_FILE=/path/to/private.env
docker compose --env-file "$APP_ENV_FILE" -f infra/compose.yaml up --build -d
docker compose --env-file "$APP_ENV_FILE" -f infra/compose.yaml ps
curl https://zverybot.ru/health
curl https://zverybot.ru/bot/health
```

Caddy автоматически выпустит и будет обновлять TLS-сертификат. При ошибке сертификата сначала проверьте A-запись и доступность портов `80` и `443`.

## Локальная разработка

Поставляемый [`infra/compose.yaml`](../infra/compose.yaml) не публикует `5432`, `8000` и `8001`. Для Vite proxy из [`apps/miniapp/vite.config.ts`](../apps/miniapp/vite.config.ts) (`/api` и `/health` → `http://localhost:8000`) добавьте override и не используйте его на VPS:

```bash
docker compose --env-file "$APP_ENV_FILE" \
  -f infra/compose.yaml -f infra/compose.dev.yaml up --build -d
```

Override вешает API на `127.0.0.1:8000`, bot на `127.0.0.1:8001`, PostgreSQL на `127.0.0.1:5432` и web на `127.0.0.1:8080`. Caddy в этом override выключен, пока явно не выбран profile `edge`.

## Регистрация webhook в MAX

После создания бота в MAX, заполнения токена и запуска контейнеров:

```bash
docker compose --env-file "$APP_ENV_FILE" -f infra/compose.yaml exec bot python -m app.manage register-webhook
```

Команда регистрирует `https://zverybot.ru/webhooks/max` и события `bot_started`, `message_created`, `message_callback`.

## Роутинг

| Путь | Сервис |
| --- | --- |
| `/` | Mini App |
| `GET /api/v1/catalog/*`, `POST /api/v1/recommendations`, `GET /api/v1/measures`, `GET /api/v1/measures/{id}` | API `:8000` |
| `/webhooks/max`, launch data, квиз, `POST|DELETE /api/v1/measures/{id}/save`, `GET /api/v1/measures/saved`, opt-in | Bot `:8001` |

`GET /api/v1/measures/saved` не является коллекцией каталога. На прямом порту API этот путь — неизвестный ID `saved` и 404. Caddyfile в фазе C1+C2 не меняется: коллекция уже попадает в API через `handle /api/*`, а saved/save — в bot более ранними правилами.

## Безопасность

- Не передавайте токен MAX, webhook secret и certificate secret в Git, фронтенд или чат.
- Mini App отправляет исходный `WebApp.initData`; bot проверяет подпись перед операциями пользователя.
- Если Ubuntu не доверяет сертификату, используемому MAX API, добавьте доверенный CA в системное хранилище и задайте путь через `MAX_CA_BUNDLE_PATH`.
