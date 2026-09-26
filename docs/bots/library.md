# Библиотека для Node.js

Всё HTTP API и шлюз событий в одном классе. Node.js 22+, без зависимостей, с типами
для TypeScript и подсказок в редакторе. Для Python — [своя библиотека](python.md) с теми же
возможностями.

```
npm install efir-bot
```

```js
import { Bot, Permissions, hasPermission, EfirError } from "efir-bot";
```

Что библиотека делает сама:

- держит соединение со шлюзом и переподключается при обрывах;
- при `429` ждёт `retry_after` и повторяет запрос;
- превращает события шлюза в события с понятными именами (`message`, `memberJoin`, …);
- даёт сообщениям методы: `msg.reply()`, `msg.react()`, `msg.delete()`, …;
- разбирает команды `/имя аргументы`.

## Запуск

```js
const bot = new Bot({
  token: process.env.EFIR_TOKEN, // обязательно
  url: "http://<сервер>:4318", // адрес сервера, по умолчанию 127.0.0.1:4318
  prefix: "/", // с чего начинаются команды; "" выключает команды
  retryRateLimits: true, // ждать и повторять при 429
});

const me = await bot.start(); // подключиться; вернёт профиль бота
bot.stop(); // отключиться насовсем
```

`start()` падает с `EfirError` (`status: 401`), если токен неверный.

После `ready` доступны:

| Поле | Что это |
| --- | --- |
| `bot.user` | профиль бота |
| `bot.cache.servers` | серверы бота с каналами, ролями и участниками; обновляется при входе, выходе и изменении каналов |

## Команды

```js
bot.command("ping", (msg) => msg.reply("pong"));

// "/say привет всем" → args = ["привет", "всем"], rest = "привет всем"
bot.command("say", (msg, args, rest) => msg.send(rest));
```

- Команда срабатывает в любом чате, который бот читает: в каналах серверов и в личке.
- `/ping@Имя_bot` — только для этого бота; `/ping@other_bot` бот пропустит.
- Регистр в названии не важен.
- Ошибка внутри команды не роняет бота: она уходит в событие `error`, а если на него
  никто не подписан — в консоль.

## События

```js
bot.on("message", async (msg) => {
  if (msg.mentionsMe) await msg.reply("Слушаю");
});
bot.on("memberJoin", ({ server_id, user }) => {
  console.log(`${user.name} зашёл на ${server_id}`);
});
```

Свои сообщения бот в `message` не получает.

| Событие | Аргумент | Когда |
| --- | --- | --- |
| `ready` | профиль бота | подключился впервые |
| `reconnect` | профиль бота | подключился снова после обрыва |
| `disconnect` | код закрытия | связь пропала; библиотека переподключится сама |
| `error` | `Error` | ошибка в обработчике или токен сброшен (`EfirError`, `status: 401`) |
| `rateLimit` | `{ route, retryAfter }` | упёрлись в лимит, библиотека ждёт |
| `message` | `Message` | новое сообщение |
| `messageUpdate` | `Message` | сообщение изменили, закрепили, пришло превью ссылки |
| `messageDelete` | `{ id, channel_id, server_id }` | сообщение удалили |
| `messageDeleteBulk` | `{ ids, channel_id }` | личную переписку очистили |
| `reaction` | `{ message_id, channel_id, reactions }` | реакции на сообщении изменились |
| `pinsUpdate` | `{ channel_id }` | закрепы канала изменились |
| `typing` | `{ channel_id, user_id }` | кто-то печатает |
| `serverCreate` | `{ server }` | бот оказался на новом сервере |
| `serverUpdate` | `{ server }` | название, описание, публичность, галочка |
| `serverDelete` | `{ server_id }` | сервер удалён, бота выгнали или забанили |
| `memberJoin` | `{ server_id, user }` | новый участник |
| `memberLeave` | `{ server_id, user_id }` | участник ушёл, выгнан или забанен |
| `memberUpdate` | `{ server_id, user_id, roles }` | роли участника изменились |
| `channelCreate` / `channelUpdate` | `{ server_id, channel }` | канал создан или изменён |
| `channelDelete` | `{ server_id, id, orphans }` | канал удалён; `orphans` — каналы, оставшиеся без категории |
| `channelsUpdate` | `{ server_id, channels }` | порядок или права каналов изменились |
| `roleCreate` / `roleUpdate` | `{ server_id, role }` | роль создана или изменена |
| `roleDelete` | `{ server_id, role_id }` | роль удалена |
| `rolesUpdate` | `{ server_id, roles }` | порядок ролей изменился |
| `voiceState` | голосовое состояние | зашёл, вышел, выключил микрофон, начал трансляцию |
| `speaking` | `{ server_id, user_id, channel_id, speaking }` | начал или перестал говорить |
| `presence` | `{ user_id, online, status, activity }` | статус и «Играет в …» |
| `userUpdate` | `{ user }` | профиль изменился |
| `eventReminder` | `{ event, server_name }` | событие, на которое бот идёт, начнётся через 10 минут |
| `raw` | `(type, data)` | любое событие шлюза как есть |

Подробности о каждом событии — в [шлюзе событий](gateway.md).

## Сообщение

`msg` в `message` и в командах — объект [`Message`](objects.md#сообщение) с методами:

| Метод | Что делает |
| --- | --- |
| `msg.reply(текст \| параметры)` | ответить в том же чате, с цитатой |
| `msg.send(текст \| параметры)` | написать в тот же чат, без цитаты |
| `msg.react("👍")` / `msg.unreact("👍")` | поставить или убрать реакцию |
| `msg.edit(текст)` | изменить (только своё сообщение) |
| `msg.delete()` | удалить (своё; чужое — с правом «Управлять сообщениями») |
| `msg.pin()` / `msg.unpin()` | закрепить или открепить |
| `msg.forward(каналы, комментарий?)` | переслать в до 10 чатов |

И поля:

| Поле | Что это |
| --- | --- |
| `msg.text`, `msg.id`, `msg.channel_id`, `msg.created` | текст, id, канал, время в мс |
| `msg.server_id` | сервер или `null` в личке |
| `msg.dm` | пришло в личном чате |
| `msg.author` | `{ id, name, username, bot, verified }` |
| `msg.mentionsMe` | упоминает бота или отвечает ему |
| `msg.repliedTo` | сообщение, на которое это ответ, или `null` |
| `msg.forwardedFrom` | откуда переслано, или `null` |
| `msg.attachments`, `msg.embeds`, `msg.reactions` | файлы, превью ссылок, реакции |
| `msg.event`, `msg.poll` | событие или опрос в сообщении, или `null` |
| `msg.edited`, `msg.pinned` | время правки и закрепления или `null` |

Параметры отправки:

```js
await msg.reply({
  text: "Держи",
  files: ["./report.pdf", { data: buffer, name: "chart.png" }],
});
```

`files` — до 10 файлов: путь на диске, `Buffer`, `Blob` или `{ data, name }`.
Картинка или видео с `{ data, name, spoiler: true }` уходит спойлером: в чате она размыта, пока её не откроют.

## Методы

Всё возвращает промис. Ошибка сервера — `EfirError` с `status`, текстом в `message` и
`retryAfter` для `429`.

### Профиль — `bot.users`

| Метод | Возвращает |
| --- | --- |
| `me()` | профиль бота |
| `get(id)` | профиль пользователя (только с общим сервером) и общие серверы в `spaces` |
| `updateMe({ name?, bio? })` | обновлённый профиль |
| `setAvatar(файл)` | аватар: png, jpg, gif, webp до 8 МБ |
| `removeAvatar()` | убрать аватар |

### Серверы — `bot.servers`

| Метод | Право | Возвращает |
| --- | --- | --- |
| `list()` | — | серверы бота целиком |
| `get(id)` | — | сервер: каналы, роли, участники, кто в голосовых |
| `join(код или ссылка)` | — | сервер, на который бот вступил |
| `leave(id)` | — | — |
| `update(id, { name?, description?, public? })` | управлять сервером | сервер |
| `auditLog(id, { before?, limit? })` | журнал аудита | записи журнала, новые первыми |

### Каналы — `bot.channels`

| Метод | Право | Возвращает |
| --- | --- | --- |
| `get(id)` | — | канал с правами бота в нём |
| `create(serverId, { name, kind, parent_id?, topic? })` | управлять каналами | канал; `kind`: `text`, `voice`, `category` |
| `update(id, { name?, topic?, slowmode?, parent_id?, synced?, bitrate?, user_limit? })` | управлять каналами | канал |
| `delete(id)` | управлять каналами | — |
| `reorder(serverId, [{ id, position, parent_id }])` | управлять каналами | все каналы |
| `setPermissions(id, target, { type, allow, deny })` | управлять ролями | канал; `target` — id роли или участника |
| `removePermissions(id, target)` | управлять ролями | канал |
| `typing(id)` | отправлять сообщения | «печатает…» на 10 секунд |
| `pins(id)` | читать историю | закреплённые сообщения |

### Сообщения — `bot.messages`

| Метод | Возвращает |
| --- | --- |
| `list(channelId, { before?, limit? })` | до 100 сообщений, новые в конце; `before` — время в мс |
| `get(channelId, id)` | одно сообщение |
| `send(channelId, текст \| { text?, replyTo?, files? })` | отправленное сообщение |
| `edit(id, текст)` | изменённое сообщение |
| `delete(id)` | — |
| `react(id, emoji)` / `unreact(id, emoji)` | реакции сообщения |
| `pin(channelId, id)` / `unpin(channelId, id)` | — (нужно право «Управлять сообщениями») |
| `forward(id, [каналы], комментарий?)` | `{ ids }` — id копий |

### Файлы — `bot.files`

| Метод | Возвращает |
| --- | --- |
| `upload(channelId, файл)` | `{ id, name, kind, size }` — id для `attachments` |
| `download(id)` | содержимое файла, `Buffer` |

Обычно проще передать файлы в `send(..., { files })` — библиотека загрузит их сама.

### Роли и участники — `bot.roles`, `bot.members`, `bot.bans`

| Метод | Право |
| --- | --- |
| `roles.list(serverId)` | — |
| `roles.create(serverId, { name, color?, hoist?, permissions? })` | управлять ролями |
| `roles.update(serverId, roleId, изменения)` | управлять ролями |
| `roles.reorder(serverId, [{ id, position }])` | управлять ролями |
| `roles.delete(serverId, roleId)` | управлять ролями |
| `members.addRole(serverId, userId, roleId)` / `removeRole(...)` | управлять ролями |
| `members.kick(serverId, userId, причина?)` | выгонять участников |
| `members.voice(serverId, userId, { mute?, deaf?, channel_id? })` | отключать микрофон, звук, перемещать |
| `bans.list(serverId)` | банить |
| `bans.add(serverId, userId, { reason?, delete_message_seconds? })` | банить |
| `bans.remove(serverId, userId)` | банить |

Бот, как и человек, не может трогать роли и участников не ниже своей высшей роли и не
может выдать право, которого нет у него самого.

### Приглашения — `bot.invites`

| Метод | Право |
| --- | --- |
| `list(serverId)` | управлять сервером |
| `create(serverId, { max_age?, max_uses? })` | создавать приглашения; `max_age` в секундах, 0 — бессрочно |
| `get(код)` | — |
| `delete(код)` | управлять сервером (или своё приглашение) |

### Опросы и события — `bot.polls`, `bot.events`

```js
await bot.polls.create(channelId, { question: "Во что играем?", options: ["CS2", "Dota 2"], multiple: false });

await bot.events.create(channelId, {
  title: "Катка",
  starts: new Date("2026-09-26T21:00:00+03:00"),
  description: "Собираемся в голосовом",
  voiceChannelId: "…",
});
```

| Метод | Право |
| --- | --- |
| `polls.create(channelId, { question, options, multiple? })` | создавать опросы |
| `polls.vote(id, [индексы])` | — (пустой список отменяет голос) |
| `polls.close(id)` | автор опроса или «Управлять сообщениями» |
| `events.create(channelId, { title, starts, description?, voiceChannelId? })` | создавать события |
| `events.rsvp(id, "going" \| "not_going" \| null)` | — |

Только в текстовых каналах серверов.

### Прочее

| Метод | Что делает |
| --- | --- |
| `bot.whileTyping(channelId, async () => …)` | показывает «печатает…», пока идёт работа |
| `bot.request(метод, путь, тело?)` | любой запрос к `/api/v1`, например `bot.request("GET", "/servers")` |
| `bot.serverOf(channelId)` | сервер канала по кэшу, или `null` |
| `bot.cosmetics.list()` / `get(id)` | каталог оформления (если на сервере он есть) |

## Права

```js
import { Permissions, hasPermission } from "efir-bot";

const server = await bot.servers.get(serverId);
if (hasPermission(server.permissions, Permissions.KICK_MEMBERS)) { /* … */ }

const channel = await bot.channels.get(channelId);
if (!hasPermission(channel.permissions, Permissions.SEND_MESSAGES)) return;
```

`server.permissions` — права бота на сервере, `channel.permissions` — в конкретном канале
с учётом особых прав. Все биты — в [объектах и правах](objects.md#права).

## Ошибки

```js
try {
  await bot.members.kick(serverId, userId);
} catch (e) {
  if (e instanceof EfirError && e.status === 403) await msg.reply(`Не могу: ${e.message}`);
  else throw e;
}
```

## TypeScript

Типы лежат рядом (`index.d.ts`) и подключаются сами: у `bot.on("…")` подсказываются имена
событий и поля аргументов, у методов — параметры и ответы.
