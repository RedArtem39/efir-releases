# Python library

All HTTP API and event gateway in a single class. Python 3.10+, asyncio, one dependency —
`aiohttp`. Same as [Node.js library](library.md), just Python style: names with `_`, handlers — decorators.

```
pip install efir-bot
```

```python
from efir_bot import Bot, File, Permissions, has_permission, EfirError
```

What the library does itself:

- maintains connection to the gateway and reconnects on disconnections;
- on `429` waits for `retry_after` and retries the request;
- converts gateway events to events with clear names (`message`, `member_join`, …);
- provides message methods: `msg.reply()`, `msg.react()`, `msg.delete()`, …;
- parses commands `/name arguments`.

## Starting

```python
import os
from efir_bot import Bot

bot = Bot(
    os.environ["EFIR_TOKEN"],       # required
    "http://<server>:4318",         # server address, defaults to 127.0.0.1:4318
    prefix="/",                     # what commands start with; "" disables commands
    retry_rate_limits=True,         # wait and retry on 429
)

bot.run()  # connect and work until Ctrl+C
```

Inside your `asyncio`:

```python
me = await bot.start()  # connect; returns bot profile
...
await bot.stop()        # disconnect permanently
```

`start()` throws `EfirError` (`status == 401`) if token is invalid. For one-off requests without gateway events:

```python
async with Bot(token, url) as bot:
    print(await bot.servers.list())
```

After `ready` available:

| Field | Meaning |
| --- | --- |
| `bot.user` | bot profile (`dict`) |
| `bot.cache["servers"]` | bot servers with channels, roles and members; updated on join, leave and channel changes |

## Commands

```python
@bot.command("ping")
async def ping(msg):
    await msg.reply("pong")

# "/say hello everyone" → args = ["hello", "everyone"], rest = "hello everyone"
@bot.command("say")
async def say(msg, args, rest):
    await msg.send(rest)
```

- Handler can take only `msg`, `msg, args` or `msg, args, rest`.
- Command triggers in any chat the bot can read: in server channels and in DMs.
- `/ping@Bot_name` — for this bot only; `/ping@other_bot` bot will skip.
- Case in name does not matter.
- Error inside command does not crash bot: it goes to `error` event, and if not subscribed to it —
  to log (`logging`, logger `efir_bot`).

## Events

```python
@bot.on("message")
async def on_message(msg):
    if msg.mentions_me:
        await msg.reply("Listening")

@bot.on("member_join")
def joined(d):
    print(f"{d['user']['name']} joined {d['server_id']}")
```

Handlers can be regular functions or coroutines. Bot does not receive its own messages in `message`. Wait for one event:

```python
msg = await bot.wait_for("message", lambda m: m.text == "yes", timeout=30)
```

Event names — like [Node.js library](library.md#events), but with `_`:

| Node.js | Python |
| --- | --- |
| `ready`, `reconnect`, `disconnect`, `error`, `message`, `reaction`, `typing`, `presence`, `speaking`, `raw` | same |
| `rateLimit` | `rate_limit` (`{ route, retry_after }`) |
| `messageUpdate`, `messageDelete`, `messageDeleteBulk` | `message_update`, `message_delete`, `message_delete_bulk` |
| `pinsUpdate` | `pins_update` |
| `serverCreate`, `serverUpdate`, `serverDelete` | `server_create`, `server_update`, `server_delete` |
| `memberJoin`, `memberLeave`, `memberUpdate` | `member_join`, `member_leave`, `member_update` |
| `channelCreate`, `channelUpdate`, `channelDelete`, `channelsUpdate` | `channel_create`, `channel_update`, `channel_delete`, `channels_update` |
| `roleCreate`, `roleUpdate`, `roleDelete`, `rolesUpdate` | `role_create`, `role_update`, `role_delete`, `roles_update` |
| `voiceState`, `userUpdate`, `eventReminder` | `voice_state`, `user_update`, `event_reminder` |

Argument — `Message` for `message` and `message_update`, for others — `dict` with fields from
[event gateway](gateway.md).

## Message

`msg` in `message` and commands — `Message` object. Server fields available as attributes:
`msg.id`, `msg.text`, `msg.channel_id`, `msg.created`, `msg.attachments`, `msg.embeds`,
`msg.reactions`, `msg.event`, `msg.poll`, `msg.edited`, `msg.pinned`
(all fields — in [objects](objects.md#message)); `msg.to_dict()` — everything as `dict`.

| Field | Meaning |
| --- | --- |
| `msg.server_id` | server or `None` in DM |
| `msg.dm` | received in DM |
| `msg.author` | `id`, `name`, `username`, `bot`, `verified` |
| `msg.mentions_me` | mentions bot or replies to it |
| `msg.replied_to` | message this is a reply to (`dict`), or `None` |
| `msg.forwarded_from` | where it was forwarded from (`dict`), or `None` |

| Method | What it does |
| --- | --- |
| `await msg.reply(text, files=[...])` | reply in same chat with quote |
| `await msg.send(text, files=[...])` | send to same chat without quote |
| `await msg.react("👍")` / `unreact("👍")` | add or remove reaction |
| `await msg.edit(text)` | edit (own message only) |
| `await msg.delete()` | delete (own; other user's — with "Manage Messages" («Управлять сообщениями») permission) |
| `await msg.pin()` / `unpin()` | pin or unpin |
| `await msg.forward(channels, comment)` | forward to up to 10 chats |

Files — up to 10: path (`str` or `Path`), `bytes` or `File`:

```python
await msg.reply("Here you go", files=[
    "report.pdf",
    File(png_bytes, "chart.png"),
    File("spoiler.jpg", spoiler=True),  # image or video under spoiler
])
```

## Methods

Everything — coroutines. Server error — `EfirError` with `status`, text in `message` and
`retry_after` for `429`. Optional parameters passed by name.

| Section | Methods |
| --- | --- |
| `bot.users` | `me()`, `get(id)`, `update_me(name=, bio=)`, `set_avatar(file)`, `remove_avatar()` |
| `bot.servers` | `list()`, `get(id)`, `join(code)`, `leave(id)`, `update(id, name=, description=, public=)`, `audit_log(id, before=, limit=)` |
| `bot.channels` | `get(id)`, `create(server_id, name, kind="text", parent_id=, topic=)`, `update(id, name=, topic=, slowmode=, …)`, `delete(id)`, `reorder(server_id, [...])`, `set_permissions(id, target, type=, allow=, deny=)`, `remove_permissions(id, target)`, `typing(id)`, `pins(id)` |
| `bot.messages` | `list(channel_id, before=, limit=)`, `get(channel_id, id)`, `send(channel_id, text, reply_to=, files=)`, `edit(id, text)`, `delete(id)`, `react(id, emoji)`, `unreact(id, emoji)`, `pin(channel_id, id)`, `unpin(channel_id, id)`, `forward(id, channels, comment)` |
| `bot.files` | `upload(channel_id, file)` → `{id, name, kind, size}`, `download(id)` → `bytes` |
| `bot.roles` | `list(server_id)`, `create(server_id, name, color=, hoist=, permissions=)`, `update(server_id, role_id, …)`, `reorder(server_id, [...])`, `delete(server_id, role_id)` |
| `bot.members` | `add_role(server_id, user_id, role_id)`, `remove_role(...)`, `kick(server_id, user_id, reason)`, `voice(server_id, user_id, mute=, deaf=, channel_id=)` |
| `bot.bans` | `list(server_id)`, `add(server_id, user_id, reason=, delete_message_seconds=)`, `remove(server_id, user_id)` |
| `bot.invites` | `list(server_id)`, `create(server_id, max_age=, max_uses=)`, `get(code)`, `delete(code)` |
| `bot.polls` | `create(channel_id, question, [options], multiple=False)`, `vote(id, [indices])`, `close(id)` |
| `bot.events` | `create(channel_id, title, start, description=, voice_channel_id=)` — start: `datetime` or ms; `rsvp(id, "going" \| "not_going" \| None)` |
| `bot.cosmetics` | `list()`, `get(id)` |

What permissions each method needs — in [Node.js reference](library.md#methods): methods are the same, only the notation changes.

Other:

```python
async with bot.typing(channel_id):   # "typing…" while work is in progress
    answer = await slow_work()

await bot.request("GET", "/servers")  # any request to /api/v1
bot.server_of(channel_id)             # channel's server from cache, or None
```

## Permissions

```python
from efir_bot import Permissions, has_permission

server = await bot.servers.get(server_id)
if has_permission(server["permissions"], Permissions.KICK_MEMBERS):
    ...

channel = await bot.channels.get(channel_id)
if not has_permission(channel["permissions"], Permissions.SEND_MESSAGES):
    return
```

`Permissions` — `IntFlag`: permissions add with `|`. All bits — in
[objects and permissions](objects.md#permissions).

## Errors

```python
try:
    await bot.members.kick(server_id, user_id)
except EfirError as e:
    if e.status == 403:
        await msg.reply(f"Cannot: {e.message}")
    else:
        raise
```

## Examples

In the package, `examples` folder: `ping.py` (ping, dice, DM replies), `moderation.py`
(banned words, `/kick`, greeting), `daily_poll.py` (poll on schedule and event to winner).
