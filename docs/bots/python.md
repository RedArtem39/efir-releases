# Библиотека для Python

Всё HTTP API и шлюз событий в одном классе. Python 3.10+, asyncio, одна зависимость —
`aiohttp`. То же самое, что [библиотека для Node.js](library.md), только в стиле Python:
имена через `_`, обработчики — декораторы.

```
pip install efir-bot
```

```python
from efir_bot import Bot, File, Permissions, has_permission, EfirError
```

Что библиотека делает сама:

- держит соединение со шлюзом и переподключается при обрывах;
- при `429` ждёт `retry_after` и повторяет запрос;
- превращает события шлюза в события с понятными именами (`message`, `member_join`, …);
- даёт сообщениям методы: `msg.reply()`, `msg.react()`, `msg.delete()`, …;
- разбирает команды `/имя аргументы`.

## Запуск

```python
import os
from efir_bot import Bot

bot = Bot(
    os.environ["EFIR_TOKEN"],       # обязательно
    "http://<сервер>:4318",         # адрес сервера, по умолчанию 127.0.0.1:4318
    prefix="/",                     # с чего начинаются команды; "" выключает команды
    retry_rate_limits=True,         # ждать и повторять при 429
)

bot.run()  # подключиться и работать до Ctrl+C
```

Внутри своего `asyncio`:

```python
me = await bot.start()  # подключиться; вернёт профиль бота
...
await bot.stop()        # отключиться насовсем
```

`start()` падает с `EfirError` (`status == 401`), если токен неверный. Для разовых
запросов без событий шлюз не нужен:

```python
async with Bot(token, url) as bot:
    print(await bot.servers.list())
```

После `ready` доступны:

| Поле | Что это |
| --- | --- |
| `bot.user` | профиль бота (`dict`) |
| `bot.cache["servers"]` | серверы бота с каналами, ролями и участниками; обновляется при входе, выходе и изменении каналов |

## Команды

```python
@bot.command("ping")
async def ping(msg):
    await msg.reply("pong")

# "/say привет всем" → args = ["привет", "всем"], rest = "привет всем"
@bot.command("say")
async def say(msg, args, rest):
    await msg.send(rest)
```

- Обработчик может принимать только `msg`, `msg, args` или `msg, args, rest`.
- Команда срабатывает в любом чате, который бот читает: в каналах серверов и в личке.
- `/ping@Имя_bot` — только для этого бота; `/ping@other_bot` бот пропустит.
- Регистр в названии не важен.
- Ошибка внутри команды не роняет бота: она уходит в событие `error`, а если на него
  никто не подписан — в журнал (`logging`, логгер `efir_bot`).

## События

```python
@bot.on("message")
async def on_message(msg):
    if msg.mentions_me:
        await msg.reply("Слушаю")

@bot.on("member_join")
def joined(d):
    print(f"{d['user']['name']} зашёл на {d['server_id']}")
```

Обработчики бывают обычными функциями и корутинами. Свои сообщения бот в `message` не
получает. Подождать одно событие:

```python
msg = await bot.wait_for("message", lambda m: m.text == "да", timeout=30)
```

Имена событий — как у [библиотеки для Node.js](library.md#события), но через `_`:

| Node.js | Python |
| --- | --- |
| `ready`, `reconnect`, `disconnect`, `error`, `message`, `reaction`, `typing`, `presence`, `speaking`, `raw` | так же |
| `rateLimit` | `rate_limit` (`{ route, retry_after }`) |
| `messageUpdate`, `messageDelete`, `messageDeleteBulk` | `message_update`, `message_delete`, `message_delete_bulk` |
| `pinsUpdate` | `pins_update` |
| `serverCreate`, `serverUpdate`, `serverDelete` | `server_create`, `server_update`, `server_delete` |
| `memberJoin`, `memberLeave`, `memberUpdate` | `member_join`, `member_leave`, `member_update` |
| `channelCreate`, `channelUpdate`, `channelDelete`, `channelsUpdate` | `channel_create`, `channel_update`, `channel_delete`, `channels_update` |
| `roleCreate`, `roleUpdate`, `roleDelete`, `rolesUpdate` | `role_create`, `role_update`, `role_delete`, `roles_update` |
| `voiceState`, `userUpdate`, `eventReminder` | `voice_state`, `user_update`, `event_reminder` |

Аргумент — `Message` для `message` и `message_update`, у остальных — `dict` с полями из
[шлюза событий](gateway.md).

## Сообщение

`msg` в `message` и в командах — объект `Message`. Поля сервера доступны как атрибуты:
`msg.id`, `msg.text`, `msg.channel_id`, `msg.created`, `msg.attachments`, `msg.embeds`,
`msg.reactions`, `msg.event`, `msg.poll`, `msg.edited`, `msg.pinned`
(все поля — в [объектах](objects.md#сообщение)); `msg.to_dict()` — всё как `dict`.

| Поле | Что это |
| --- | --- |
| `msg.server_id` | сервер или `None` в личке |
| `msg.dm` | пришло в личном чате |
| `msg.author` | `id`, `name`, `username`, `bot`, `verified` |
| `msg.mentions_me` | упоминает бота или отвечает ему |
| `msg.replied_to` | сообщение, на которое это ответ (`dict`), или `None` |
| `msg.forwarded_from` | откуда переслано (`dict`), или `None` |

| Метод | Что делает |
| --- | --- |
| `await msg.reply(текст, files=[...])` | ответить в том же чате, с цитатой |
| `await msg.send(текст, files=[...])` | написать в тот же чат, без цитаты |
| `await msg.react("👍")` / `unreact("👍")` | поставить или убрать реакцию |
| `await msg.edit(текст)` | изменить (только своё сообщение) |
| `await msg.delete()` | удалить (своё; чужое — с правом «Управлять сообщениями») |
| `await msg.pin()` / `unpin()` | закрепить или открепить |
| `await msg.forward(каналы, комментарий)` | переслать в до 10 чатов |

Файлы — до 10: путь (`str` или `Path`), `bytes` или `File`:

```python
await msg.reply("Держи", files=[
    "report.pdf",
    File(png_bytes, "chart.png"),
    File("spoiler.jpg", spoiler=True),  # картинка или видео под спойлером
])
```

## Методы

Всё — корутины. Ошибка сервера — `EfirError` с `status`, текстом в `message` и
`retry_after` для `429`. Необязательные параметры передаются по имени.

| Раздел | Методы |
| --- | --- |
| `bot.users` | `me()`, `get(id)`, `update_me(name=, bio=)`, `set_avatar(файл)`, `remove_avatar()` |
| `bot.servers` | `list()`, `get(id)`, `join(код)`, `leave(id)`, `update(id, name=, description=, public=)`, `audit_log(id, before=, limit=)` |
| `bot.channels` | `get(id)`, `create(server_id, name, kind="text", parent_id=, topic=)`, `update(id, name=, topic=, slowmode=, …)`, `delete(id)`, `reorder(server_id, [...])`, `set_permissions(id, target, type=, allow=, deny=)`, `remove_permissions(id, target)`, `typing(id)`, `pins(id)` |
| `bot.messages` | `list(channel_id, before=, limit=)`, `get(channel_id, id)`, `send(channel_id, текст, reply_to=, files=)`, `edit(id, текст)`, `delete(id)`, `react(id, emoji)`, `unreact(id, emoji)`, `pin(channel_id, id)`, `unpin(channel_id, id)`, `forward(id, каналы, комментарий)` |
| `bot.files` | `upload(channel_id, файл)` → `{id, name, kind, size}`, `download(id)` → `bytes` |
| `bot.roles` | `list(server_id)`, `create(server_id, name, color=, hoist=, permissions=)`, `update(server_id, role_id, …)`, `reorder(server_id, [...])`, `delete(server_id, role_id)` |
| `bot.members` | `add_role(server_id, user_id, role_id)`, `remove_role(...)`, `kick(server_id, user_id, причина)`, `voice(server_id, user_id, mute=, deaf=, channel_id=)` |
| `bot.bans` | `list(server_id)`, `add(server_id, user_id, reason=, delete_message_seconds=)`, `remove(server_id, user_id)` |
| `bot.invites` | `list(server_id)`, `create(server_id, max_age=, max_uses=)`, `get(код)`, `delete(код)` |
| `bot.polls` | `create(channel_id, вопрос, [варианты], multiple=False)`, `vote(id, [индексы])`, `close(id)` |
| `bot.events` | `create(channel_id, название, начало, description=, voice_channel_id=)` — начало: `datetime` или мс; `rsvp(id, "going" \| "not_going" \| None)` |
| `bot.cosmetics` | `list()`, `get(id)` |

Какие права нужны каждому методу — в [справочнике для Node.js](library.md#методы): методы
те же, меняется только запись.

Прочее:

```python
async with bot.typing(channel_id):   # «печатает…», пока идёт работа
    answer = await slow_work()

await bot.request("GET", "/servers")  # любой запрос к /api/v1
bot.server_of(channel_id)             # сервер канала по кэшу, или None
```

## Права

```python
from efir_bot import Permissions, has_permission

server = await bot.servers.get(server_id)
if has_permission(server["permissions"], Permissions.KICK_MEMBERS):
    ...

channel = await bot.channels.get(channel_id)
if not has_permission(channel["permissions"], Permissions.SEND_MESSAGES):
    return
```

`Permissions` — `IntFlag`: права складываются через `|`. Все биты — в
[объектах и правах](objects.md#права).

## Ошибки

```python
try:
    await bot.members.kick(server_id, user_id)
except EfirError as e:
    if e.status == 403:
        await msg.reply(f"Не могу: {e.message}")
    else:
        raise
```

## Примеры

В пакете, папка `examples`: `ping.py` (пинг, кубик, ответы в личке), `moderation.py`
(запрещённые слова, `/kick`, приветствие), `daily_poll.py` (опрос по расписанию и событие
победителю).
