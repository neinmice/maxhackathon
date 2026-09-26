# Official MAX research

Checked 2026-09-26 against official documentation.

- Mini Apps work only inside MAX chat bots; autonomous Mini Apps are not supported.
- Configure the application URL in the bot settings and select the opening button: Open, Start, Play or unnamed.
- `open_app` inline keyboard button opens a Mini App inside the bot.
- Deep-link: `https://max.ru/<botName>?startapp=<payload>`; payload max 512 characters, only A-Z/a-z/0-9/_/-.
- MAX Bridge exposes `window.WebApp.initData` and the start parameter. Never trust raw client data without server validation.
- Bot API host: `https://platform-api2.max.ru`; token only through `Authorization`.
- MAX validates launch data through HMAC-SHA256: derive a secret from `WebAppData` and the bot token, then compare the calculated `hash` in constant time.
- Webhook registration carries a URL, subscribed update types and a secret; the handler verifies `X-Max-Bot-Api-Secret`.
- Production webhook uses HTTPS on port 443 and a trusted certificate whose domain matches the webhook URL. Long Polling is for development only.
- Outbound MAX Bot API calls use `platform-api2.max.ru`; the VPS must trust the CA certificate chain required by MAX.

Sources:
- https://dev.max.ru/docs/webapps/introduction
- https://dev.max.ru/help/miniapps
- https://dev.max.ru/docs-api
- https://dev.max.ru/docs-api/methods/POST/subscriptions
- https://dev.max.ru/docs/webapps/validation
