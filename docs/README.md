# Документация для разработчиков

Эфир открыт для ботов: у бота свой аккаунт, HTTP API и события по WebSocket, как у
Telegram и Discord. Само приложение и сервер закрыты, но всё, что нужно боту, описано здесь.

- **[Правила](rules.md)** — что можно и чего нельзя.
- **[Боты: быстрый старт](bots/README.md)** — создать бота через `@bot_bot` и запустить: Node.js, Python или curl.
- **[Библиотека для Node.js](bots/library.md)** — `npm install efir-bot`.
- **[Библиотека для Python](bots/python.md)** — `pip install efir-bot`.
- **[HTTP API](bots/rest.md)** — каждый запрос, для любого языка, с примерами через curl.
- **[Шлюз событий](bots/gateway.md)** — WebSocket и все события.
- **[Объекты и права](bots/objects.md)** — каждое поле с типом, биты прав.
- **[Ошибки](bots/errors.md)** — все статусы и тексты ошибок с причинами.
- **[Частые проблемы](bots/troubleshooting.md)** — бот не подключается, молчит, не хватает прав.
- **[История изменений](bots/changelog.md)** — что менялось в API.

English version: [en/README.md](en/README.md).

## Где что взять

| Что | Где |
| --- | --- |
| Библиотека для Node.js 22+ | `npm install efir-bot` |
| Библиотека для Python 3.10+ | `pip install efir-bot` |
| Другие языки | прямые HTTP-запросы: [HTTP API](bots/rest.md) и [шлюз событий](bots/gateway.md) |
| Примеры | [examples](examples): [Node.js](examples/nodejs), [Python](examples/python), [без библиотеки](examples/echo-bot.mjs) |
| Токен бота | личка `@bot_bot` в приложении, команда `/newbot` |
| Адрес сервера | у владельца сервера; тот же, к которому подключается приложение, порт `4318` |

Сервер доступен в сети Radmin VPN, как и для приложения: бот должен работать на машине,
которая в неё подключена.
