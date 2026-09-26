# Efir bots

Bots are set up like in Telegram: a separate account with a username ending in `_bot`, which
your code controls. There is no bot interface in the app — everything is through `@bot_bot` and the API.

- [Quick start](#quick-start) — a bot in five minutes
- [Node.js library](library.md) — all API as methods: `npm install efir-bot`
- [Python library](python.md) — the same for Python: `pip install efir-bot`
- [HTTP API](rest.md) — each request, for any language, with curl examples
- [Event gateway](gateway.md) — WebSocket and all events
- [Objects and permissions](objects.md) — each field with type, permission bits
- [Errors](errors.md) — all statuses and error texts with reasons
- [Troubleshooting](troubleshooting.md) — bot won't connect, silent, missing permissions
- [Changelog](changelog.md) — what changed in the API

## Creating a bot

Write in a DM to `@bot_bot` (Direct Messages (Личные сообщения) → Find or start chat (Найти или начать беседу) → `@bot_bot`):

| Command | What it does |
| --- | --- |
| `/newbot` | create a bot: name, then username ending in `_bot`; you'll get a token in response |
| `/mybots` | list your bots |
| `/token @name_bot` | new token; the old one stops working immediately |
| `/setname @name_bot` | change name |
| `/deletebot @name_bot` | delete the bot (needs a confirmation phrase) |
| `/cancel` | cancel the current command |

Username: 5–32 characters, Latin letters, digits and `_`, starts with a letter and
ends with `_bot`. Case is preserved (`@Tetris_bot`), and uniqueness is checked without regard to case.

Token is the bot's password. Do not put it in code others will see:
keep it in an environment variable. Leaked — `/token @name_bot` will give you a new one.

## Quick start

Libraries are available for Node.js and Python; in any other language, the bot works with direct
HTTP requests. The bot below responds `pong` to `/ping`, rolls a dice on `/roll 20` and
echoes what is sent to it in DM.

### Node.js

Node.js 22 or newer, no dependencies:

```
npm install efir-bot
```

`bot.mjs`:

```js
import { Bot } from "efir-bot";

const bot = new Bot({
  token: process.env.EFIR_TOKEN,
  url: "http://<сервер>:4318",
});

bot.command("ping", (msg) => msg.reply("pong"));

bot.command("roll", (msg, args) => {
  const max = Number(args[0]) || 100;
  return msg.reply(`Rolled ${1 + Math.floor(Math.random() * max)}`);
});

bot.on("message", async (msg) => {
  if (msg.dm && !msg.text.startsWith("/")) await msg.send(`You wrote: ${msg.text}`);
});

const me = await bot.start();
console.log(`Bot @${me.username} is online`);
```

```
EFIR_TOKEN=<token> node bot.mjs
```

Reference — [Node.js library](library.md).

### Python

Python 3.10 or newer:

```
pip install efir-bot
```

`bot.py`:

```python
import os
import random

from efir_bot import Bot

bot = Bot(os.environ["EFIR_TOKEN"], "http://<сервер>:4318")


@bot.command("ping")
async def ping(msg):
    await msg.reply("pong")


@bot.command("roll")
async def roll(msg, args):
    top = int(args[0]) if args and args[0].isdigit() else 100
    await msg.reply(f"Rolled {random.randint(1, top)}")


@bot.on("message")
async def talk(msg):
    if msg.dm and not msg.text.startswith("/"):
        await msg.send(f"You wrote: {msg.text}")


bot.run()
```

```
EFIR_TOKEN=<token> python bot.py
```

Reference — [Python library](python.md).

### Any other language

Everything a bot can do is just regular HTTP requests with the `Authorization: Bot <token>` header.
You can verify the token and send a message directly from the console:

```
curl -H "Authorization: Bot $EFIR_TOKEN" http://<сервер>:4318/api/v1/users/@me

curl -X POST http://<сервер>:4318/api/v1/channels/$CHANNEL/messages \
  -H "Authorization: Bot $EFIR_TOKEN" -H "Content-Type: application/json" \
  -d '{"text":"Hi"}'
```

New messages and other events come via WebSocket — [event gateway](gateway.md),
with an example of a bot without a library there. All requests are in [HTTP API](rest.md).

To make a bot appear on a server, give it an invite:

```js
await bot.servers.join("Kx7pQ2aB"); // Python: await bot.servers.join("Kx7pQ2aB")
```

After that, server members give the bot roles like a person. Everything it can do is decided by the permissions
of those roles and special channel permissions.

## How it works

- **HTTP API** — everything a bot does: write, reply, moderate. Addresses start with
  `/api/v1`, authorization is the `Authorization: Bot <token>` header.
- **Event gateway** — WebSocket, through which the bot learns what is happening: new messages,
  members, reactions, voice. The library keeps it and reconnects on interruptions.

A bot sees only the servers it is on, and direct messages where someone wrote to it. The bot cannot
write to a person first, like in Telegram.

## Limits

- 50 requests per second per bot;
- 5 messages per 5 seconds to one channel;
- slow mode on a channel applies to bots too, except those with the permission
  "Manage Messages" (Управлять сообщениями) or "Manage Channels" (Управлять каналами).

Exceeding the limit — response `429` with field `retry_after` (seconds) and header `Retry-After`.
The library waits and retries the request itself.

## Errors

Any error is an HTTP status and `{ "error": "text" }`. The text is understandable to humans; you can show it as is.

| Status | When |
| --- | --- |
| `400` | invalid data: empty text, name too long, etc. |
| `401` | token is wrong or revoked |
| `403` | not enough permissions, bot is not on the server, DM is closed by blocking |
| `404` | no such message, channel, server |
| `413` | file too large (up to 1 GB, pictures up to 20 MB) |
| `429` | limit, see above |
| `507` | server storage is full |

Examples are [on GitHub](https://github.com/RedArtem39/efir-releases/tree/main/docs/examples) and in the packages themselves (the `examples` folder): ping, dice, moderation, scheduled poll. What is allowed and what is not: [rules](https://github.com/RedArtem39/efir-releases/blob/main/docs/en/rules.md).
