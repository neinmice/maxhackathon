# Official MAX research

Checked 2026-09-26 against official documentation.

- MAX Bridge SDK must be included in Mini App: `<script src="https://st.max.ru/js/max-web-app.js"></script>`. It sets `window.WebApp`.
- Mini App must call `window.WebApp.ready()` upon load, which posts `WebAppReady` event to the MAX container; without this, MAX client times out with a native modal "Какая-то техническая заминка".
- Mini Apps work only inside MAX chat bots; autonomous Mini Apps are not supported.
- Configure the application URL in the bot settings (business.max.ru/self) strictly with `https://` and select the opening button: Open, Start, Play or unnamed.
- `open_app` inline keyboard button opens a Mini App inside the bot (`payload.buttons` with type `open_app` and `web_app: <botName>`).
- Deep-link: `https://max.ru/<botName>?startapp=<payload>`; payload max 512 characters, only A-Z/a-z/0-9/_/-.
- MAX Bridge exposes `window.WebApp.initData` and the start parameter. Never trust raw client data without server validation.
- Bot API host: `https://platform-api2.max.ru`; token only through `Authorization`.
- MAX validates launch data through HMAC-SHA256: derive a secret from `WebAppData` and the bot token, then compare the calculated `hash` in constant time.
- Webhook registration carries a URL, subscribed update types and a secret; the handler verifies `X-Max-Bot-Api-Secret`.
- Webhook events (`message_created`) echo messages sent by the bot (`sender.is_bot: true`, `user_id: 428775011`). The bot must ignore them to prevent self-messaging (which errors with `chat.denied: Invalid chatId: 0`).
- Production webhook uses HTTPS on port 443 and a trusted certificate whose domain matches the webhook URL. Long Polling is for development only.
- Outbound MAX Bot API calls use `platform-api2.max.ru`; the VPS must trust the CA certificate chain required by MAX.

Sources:
- https://dev.max.ru/docs/webapps/introduction
- https://dev.max.ru/help/miniapps
- https://dev.max.ru/docs-api
- https://dev.max.ru/docs-api/methods/POST/subscriptions
- https://dev.max.ru/docs/webapps/validation
