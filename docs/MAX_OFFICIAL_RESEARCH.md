# Official MAX research

Checked 2026-09-20 against official documentation.

- Mini Apps work only inside MAX chat bots; autonomous Mini Apps are not supported.
- Configure the application URL in the bot settings and select the opening button: Open, Start, Play or unnamed.
- `open_app` inline keyboard button opens a Mini App inside the bot.
- Deep-link: `https://max.ru/<botName>?startapp=<payload>`; payload max 512 characters, only A-Z/a-z/0-9/_/-.
- MAX Bridge exposes `window.WebApp.initData` and the start parameter. Never trust raw client data without server validation.
- Bot API host: `https://platform-api2.max.ru`; token only through `Authorization`.
- Production webhook uses HTTPS and a trusted certificate. Long Polling is for development only.

Sources:
- https://dev.max.ru/docs/webapps/introduction
- https://dev.max.ru/help/miniapps
- https://dev.max.ru/docs-api
