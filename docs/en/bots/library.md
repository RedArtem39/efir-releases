# Node.js library

All HTTP API and event gateway in a single class. Node.js 22+, no dependencies, with types
for TypeScript and editor hints. For Python — [its own library](python.md) with the same
capabilities.

```
npm install efir-bot
```

```js
import { Bot, Permissions, hasPermission, EfirError } from "efir-bot";
```

What the library does itself:

- maintains connection to the gateway and reconnects on disconnections;
- on `429` waits for `retry_after` and retries the request;
- converts gateway events to events with clear names (`message`, `memberJoin`, …);
- provides message methods: `msg.reply()`, `msg.react()`, `msg.delete()`, …;
- parses commands `/name arguments`.

## Starting

```js
const bot = new Bot({
  token: process.env.EFIR_TOKEN, // required
  url: "http://<сервер>:4318", // server address, defaults to 127.0.0.1:4318
  prefix: "/", // what commands start with; "" disables commands
  retryRateLimits: true, // wait and retry on 429
});

const me = await bot.start(); // connect; returns bot profile
bot.stop(); // disconnect permanently
```

`start()` throws `EfirError` (`status: 401`) if token is invalid.

After `ready` available:

| Field | Meaning |
| --- | --- |
| `bot.user` | bot profile |
| `bot.cache.servers` | bot servers with channels, roles and members; updated on join, leave and channel changes |

## Commands

```js
bot.command("ping", (msg) => msg.reply("pong"));

// "/say hello everyone" → args = ["hello", "everyone"], rest = "hello everyone"
bot.command("say", (msg, args, rest) => msg.send(rest));
```

- Command triggers in any chat the bot can read: in server channels and in DMs.
- `/ping@Bot_name` — for this bot only; `/ping@other_bot` bot will skip.
- Case in name does not matter.
- Error inside command does not crash the bot: it goes to the `error` event, and if no one is subscribed to it —
  to the console.

## Events

```js
bot.on("message", async (msg) => {
  if (msg.mentionsMe) await msg.reply("Listening");
});
bot.on("memberJoin", ({ server_id, user }) => {
  console.log(`${user.name} joined ${server_id}`);
});
```

Bot does not receive its own messages in `message`.

| Event | Argument | When |
| --- | --- | --- |
| `ready` | bot profile | connected for the first time |
| `reconnect` | bot profile | reconnected after disconnection |
| `disconnect` | close code | connection lost; library will reconnect itself |
| `error` | `Error` | error in handler or token revoked (`EfirError`, `status: 401`) |
| `rateLimit` | `{ route, retryAfter }` | hit rate limit, library is waiting |
| `message` | `Message` | new message |
| `messageUpdate` | `Message` | message edited, pinned, or link preview arrived |
| `messageDelete` | `{ id, channel_id, server_id }` | message deleted |
| `messageDeleteBulk` | `{ ids, channel_id }` | DM history cleared |
| `reaction` | `{ message_id, channel_id, reactions }` | reactions on message changed |
| `pinsUpdate` | `{ channel_id }` | channel pins changed |
| `typing` | `{ channel_id, user_id }` | someone is typing |
| `serverCreate` | `{ server }` | bot joined new server |
| `serverUpdate` | `{ server }` | name, description, publicity, visibility toggle |
| `serverDelete` | `{ server_id }` | server deleted, bot removed or banned |
| `memberJoin` | `{ server_id, user }` | new member |
| `memberLeave` | `{ server_id, user_id }` | member left, kicked or banned |
| `memberUpdate` | `{ server_id, user_id, roles }` | member roles changed |
| `channelCreate` / `channelUpdate` | `{ server_id, channel }` | channel created or updated |
| `channelDelete` | `{ server_id, id, orphans }` | channel deleted; `orphans` — channels without category |
| `channelsUpdate` | `{ server_id, channels }` | channel order or permissions changed |
| `roleCreate` / `roleUpdate` | `{ server_id, role }` | role created or updated |
| `roleDelete` | `{ server_id, role_id }` | role deleted |
| `rolesUpdate` | `{ server_id, roles }` | role order changed |
| `voiceState` | voice state | joined, left, muted, started streaming |
| `speaking` | `{ server_id, user_id, channel_id, speaking }` | started or stopped speaking |
| `presence` | `{ user_id, online, status, activity }` | status and "Playing..." ("Playing..." («Играет в …»)) |
| `userUpdate` | `{ user }` | profile updated |
| `eventReminder` | `{ event, server_name }` | event the bot is going to starts in 10 minutes |
| `raw` | `(type, data)` | any gateway event as is |

Details on each event — in [event gateway](gateway.md).

## Message

`msg` in `message` and commands — [`Message`](objects.md#message) object with methods:

| Method | What it does |
| --- | --- |
| `msg.reply(text \| parameters)` | reply in same chat with quote |
| `msg.send(text \| parameters)` | send to same chat without quote |
| `msg.react("👍")` / `msg.unreact("👍")` | add or remove reaction |
| `msg.edit(text)` | edit (own message only) |
| `msg.delete()` | delete (own; other user's — with "Manage Messages" («Управлять сообщениями») permission) |
| `msg.pin()` / `msg.unpin()` | pin or unpin |
| `msg.forward(channels, comment?)` | forward to up to 10 chats |

And fields:

| Field | Meaning |
| --- | --- |
| `msg.text`, `msg.id`, `msg.channel_id`, `msg.created` | text, id, channel, time in ms |
| `msg.server_id` | server or `null` in DM |
| `msg.dm` | received in DM |
| `msg.author` | `{ id, name, username, bot, verified }` |
| `msg.mentionsMe` | mentions bot or replies to it |
| `msg.repliedTo` | message this is a reply to, or `null` |
| `msg.forwardedFrom` | where it was forwarded from, or `null` |
| `msg.attachments`, `msg.embeds`, `msg.reactions` | files, link previews, reactions |
| `msg.event`, `msg.poll` | event or poll in message, or `null` |
| `msg.edited`, `msg.pinned` | edit and pin time or `null` |

Send parameters:

```js
await msg.reply({
  text: "Here you go",
  files: ["./report.pdf", { data: buffer, name: "chart.png" }],
});
```

`files` — up to 10 files: disk path, `Buffer`, `Blob` or `{ data, name }`.
Image or video with `{ data, name, spoiler: true }` is sent as spoiler: in chat it is blurred until opened.

## Methods

Everything returns a promise. Server error — `EfirError` with `status`, text in `message` and
`retryAfter` for `429`.

### Profile — `bot.users`

| Method | Returns |
| --- | --- |
| `me()` | bot profile |
| `get(id)` | user profile (only with shared server) and shared servers in `spaces` |
| `updateMe({ name?, bio? })` | updated profile |
| `setAvatar(file)` | avatar: png, jpg, gif, webp up to 8 MB |
| `removeAvatar()` | remove avatar |

### Servers — `bot.servers`

| Method | Permission | Returns |
| --- | --- | --- |
| `list()` | — | all bot servers |
| `get(id)` | — | server: channels, roles, members, voice participants |
| `join(code or link)` | — | server the bot joined |
| `leave(id)` | — | — |
| `update(id, { name?, description?, public? })` | Manage Server | server |
| `auditLog(id, { before?, limit? })` | Audit Log | log entries, newest first |

### Channels — `bot.channels`

| Method | Permission | Returns |
| --- | --- | --- |
| `get(id)` | — | channel with bot permissions in it |
| `create(serverId, { name, kind, parent_id?, topic? })` | Manage Channels | channel; `kind`: `text`, `voice`, `category` |
| `update(id, { name?, topic?, slowmode?, parent_id?, synced?, bitrate?, user_limit? })` | Manage Channels | channel |
| `delete(id)` | Manage Channels | — |
| `reorder(serverId, [{ id, position, parent_id }])` | Manage Channels | all channels |
| `setPermissions(id, target, { type, allow, deny })` | Manage Roles | channel; `target` — role or member id |
| `removePermissions(id, target)` | Manage Roles | channel |
| `typing(id)` | Send Messages | "typing…" for 10 seconds |
| `pins(id)` | Read History | pinned messages |

### Messages — `bot.messages`

| Method | Returns |
| --- | --- |
| `list(channelId, { before?, limit? })` | up to 100 messages, newest at end; `before` — time in ms |
| `get(channelId, id)` | one message |
| `send(channelId, text \| { text?, replyTo?, files? })` | sent message |
| `edit(id, text)` | edited message |
| `delete(id)` | — |
| `react(id, emoji)` / `unreact(id, emoji)` | message reactions |
| `pin(channelId, id)` / `unpin(channelId, id)` | — (requires "Manage Messages" («Управлять сообщениями») permission) |
| `forward(id, [channels], comment?)` | `{ ids }` — ids of copies |

### Files — `bot.files`

| Method | Returns |
| --- | --- |
| `upload(channelId, file)` | `{ id, name, kind, size }` — id for `attachments` |
| `download(id)` | file contents, `Buffer` |

Usually easier to pass files to `send(..., { files })` — library uploads them itself.

### Roles and members — `bot.roles`, `bot.members`, `bot.bans`

| Method | Permission |
| --- | --- |
| `roles.list(serverId)` | — |
| `roles.create(serverId, { name, color?, hoist?, permissions? })` | Manage Roles |
| `roles.update(serverId, roleId, changes)` | Manage Roles |
| `roles.reorder(serverId, [{ id, position }])` | Manage Roles |
| `roles.delete(serverId, roleId)` | Manage Roles |
| `members.addRole(serverId, userId, roleId)` / `removeRole(...)` | Manage Roles |
| `members.kick(serverId, userId, reason?)` | Kick Members |
| `members.voice(serverId, userId, { mute?, deaf?, channel_id? })` | mute, deafen, move |
| `bans.list(serverId)` | Ban Members |
| `bans.add(serverId, userId, { reason?, delete_message_seconds? })` | Ban Members |
| `bans.remove(serverId, userId)` | Ban Members |

Bot, like a human, cannot modify roles and members not below its highest role and cannot grant a permission it doesn't have itself.

### Invites — `bot.invites`

| Method | Permission |
| --- | --- |
| `list(serverId)` | Manage Server |
| `create(serverId, { max_age?, max_uses? })` | Create Invite; `max_age` in seconds, 0 — never |
| `get(code)` | — |
| `delete(code)` | Manage Server (or own invite) |

### Polls and events — `bot.polls`, `bot.events`

```js
await bot.polls.create(channelId, { question: "What are we playing?", options: ["CS2", "Dota 2"], multiple: false });

await bot.events.create(channelId, {
  title: "Game",
  starts: new Date("2026-09-26T21:00:00+03:00"),
  description: "Gathering in voice",
  voiceChannelId: "…",
});
```

| Method | Permission |
| --- | --- |
| `polls.create(channelId, { question, options, multiple? })` | Create Poll |
| `polls.vote(id, [indices])` | — (empty list cancels vote) |
| `polls.close(id)` | poll author or "Manage Messages" («Управлять сообщениями») |
| `events.create(channelId, { title, starts, description?, voiceChannelId? })` | Create Event |
| `events.rsvp(id, "going" \| "not_going" \| null)` | — |

Text channels of servers only.

### Other

| Method | What it does |
| --- | --- |
| `bot.whileTyping(channelId, async () => …)` | shows "typing…" while work is in progress |
| `bot.request(method, path, body?)` | any request to `/api/v1`, for example `bot.request("GET", "/servers")` |
| `bot.serverOf(channelId)` | channel's server from cache, or `null` |
| `bot.cosmetics.list()` / `get(id)` | cosmetics catalog (if available on server) |

## Permissions

```js
import { Permissions, hasPermission } from "efir-bot";

const server = await bot.servers.get(serverId);
if (hasPermission(server.permissions, Permissions.KICK_MEMBERS)) { /* … */ }

const channel = await bot.channels.get(channelId);
if (!hasPermission(channel.permissions, Permissions.SEND_MESSAGES)) return;
```

`server.permissions` — bot permissions on server, `channel.permissions` — in specific channel including channel-specific permissions. All bits — in [objects and permissions](objects.md#permissions).

## Errors

```js
try {
  await bot.members.kick(serverId, userId);
} catch (e) {
  if (e instanceof EfirError && e.status === 403) await msg.reply(`Cannot: ${e.message}`);
  else throw e;
}
```

## TypeScript

Types are nearby (`index.d.ts`) and load automatically: at `bot.on("…")` event names and argument fields are autocompleted, at methods — parameters and responses.
