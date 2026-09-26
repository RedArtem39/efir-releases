# HTTP API

Everything a bot can do are ordinary HTTP requests. You can test them directly from the console using
curl, and you can write a bot in any language. For Node.js and Python, it's easier to use a library:
[for Node.js](library.md), [for Python](python.md).

## Basics

| | |
| --- | --- |
| Address | `http://<server>:4318/api/v1/…` |
| Authorization | header `Authorization: Bot <token>` |
| Request body | JSON with `Content-Type: application/json`, up to 24,000 bytes; for file uploads — the file itself |
| Response | JSON; on error — HTTP status and `{ "error": "text" }` |
| Time | milliseconds since 1970, like `Date.now()` |
| id | strings |
| Version | `v1`; what changed — in [changelog](changelog.md) |

```
curl -H "Authorization: Bot $EFIR_TOKEN" http://<сервер>:4318/api/v1/users/@me
```

How to read the sections below:

- **Permission** — which [permission](#permissions) a bot needs on the server or in the channel.
  "—" — nothing needed except access to the server or channel.
- In parameter tables, "yes" in the "Required" column — mandatory parameter, others can be
  omitted.
- "Truncated to N" — longer requests will be silently truncated by the server; "1 to N" — longer or empty
  will return `400`.
- **Errors** — responses specific to this request beyond the general ones (`401` for invalid token, `429` for
  rate limit). All error texts with causes — in [error catalog](errors.md).

### Limits

| What | Limit | Per |
| --- | --- | --- |
| bot requests | 50 per second | entire bot |
| messages | 5 per 5 seconds | bot and channel |
| forwarding | 20 per 10 seconds | bot |
| channel slow mode | 1 message per `slowmode` seconds | bot and channel; does not apply with Manage Messages («Управлять сообщениями») or Manage Channels («Управлять каналами») permission |

Exceeding the limit returns `429` with field `retry_after` (seconds) and header `Retry-After`. Wait
that long and retry the request. Libraries do this automatically.

## Bot Profile

### `GET /users/@me`

Bot profile. Response — [user](#user).

### `PATCH /users/@me`

Edit profile. Response — user.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | | display name, 1 to 32 characters |
| `bio` | string | | "About me", up to 190 characters |
| `username` | string | | new username: 5–32 characters, Latin letters, digits and `_`, starts with a letter, ends with `_bot` |

Errors: `400` — length or format, `409` — username taken.

### `PUT /users/@me/avatar`

Body — the file itself: png, jpg, gif, webp, avif or video mp4, mov; up to 8 MB. Optional
header `X-Avatar-Crop: {"x":0,"y":0,"s":1}` (URL-encoded) — the square to display:
top-left corner and side as fractions of the image, 0 to 1. Response — user.

Errors: `400` — empty file or invalid crop, `413` — larger than 8 MB, `415` — format.

### `DELETE /users/@me/avatar`

Remove avatar. Response — user.

### `GET /users/{id}`

User profile if the bot shares a server with the user, and these servers in `spaces`.

Errors: `404` — no user or shared servers.

## Servers

### `GET /servers`

All bot servers, each one — [server](#server) in full: channels, roles, members,
who is in voice.

### `GET /servers/{id}`

One server. Errors: `404` — no such server, `403` — bot is not a member.

### `PATCH /servers/{id}`

Permission: manage server. Response — server.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | | 1 to 40 characters |
| `description` | string | | truncated to 300 characters |
| `public` | boolean | | visible in server search, can join without invite |

### `POST /join`

Join by invite. Response — `{ "id": "<server id>" }`.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `code` | string | yes | invite code or link containing it, up to 100 characters |

Errors: `404` — invite is invalid or expired, `403` — bot is banned from the server.

### `POST /servers/{id}/leave`

Leave server. Body — `{}`. Response — `{ "ok": true }`.

### `GET /servers/{id}/audit-log`

Permission: view audit log. Response — [audit log entries](#audit-log),
newest first.

| Query parameter | Type | Description |
| --- | --- | --- |
| `before` | number | only entries before this time |
| `limit` | number | 1–100, default 50 |

### `GET /invites/{code}`

About an invite without joining: `{ code, server: { id, name, members, verified } }`.
Errors: `404`.

## Channels

### `GET /channels/{id}`

[Channel](#channel) and the bot's resulting permissions in it (`permissions`).

### `POST /servers/{id}/channels`

Permission: manage channels. Response — channel. Server has up to 500 channels.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | yes | 1 to 32 characters; for text channels — lowercase, spaces → `-` |
| `kind` | string | yes | `text`, `voice` or `category` |
| `parent_id` | string | | category id |
| `topic` | string | | topic of text channel, truncated to 1024 characters |

Errors: `400` — name, unknown category, 500 channels already exist.

### `PATCH /channels/{id}`

Permission: manage channels. Response — channel. Send only what you're changing.

| Field | Type | Description |
| --- | --- | --- |
| `name` | string | 1 to 32 characters |
| `topic` | string | text channels only; truncated to 1024 |
| `slowmode` | number | seconds between messages from one member, 0–21600 (6 hours) |
| `parent_id` | string \| null | category; `null` — no category |
| `synced` | boolean | `true` — inherit category permissions |
| `bitrate` | number | kbps, 8–96; voice channels only |
| `user_limit` | number | 0–25, 0 — no limit (not more than 25); voice channels only |

Numbers outside the range are clamped to the nearest boundary.

### `DELETE /channels/{id}`

Permission: manage channels. Response — `{ "ok": true }`. Channels of a deleted category remain
without a category.

### `PATCH /servers/{id}/channels`

Order and categories of multiple channels at once. Permission: manage channels. Response — all
server channels.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `channels` | array | yes | `[{ id, position, parent_id }]` |

Errors: `400` — not a list, unknown channel, invalid category.

### `PUT /channels/{id}/permissions/{target}`

Special permissions for a role or member. Permission: manage roles; can only grant and deny permissions that the bot has. Response — channel.

`target` — role id (@everyone has the server id) or member id.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | string | yes | `role` or `member` |
| `allow` | number | | allowed permission bits |
| `deny` | number | | denied permission bits |

Errors: `404` — no channel, role or member; `403` — permissions the bot doesn't have.

### `DELETE /channels/{id}/permissions/{target}`

Remove special permissions. Permission: manage roles. Response — channel.

### `POST /channels/{id}/typing`

"Typing…" for 10 seconds. Permission: send messages. Body — `{}`.

### `GET /channels/{id}/pins`

Pinned messages, newest first. Permission: read history.

## Messages

### `GET /channels/{id}/messages`

[Messages](#message) of the channel, newest at the end. Permission: read history.

| Query parameter | Type | Description |
| --- | --- | --- |
| `before` | number | only messages before this time — for paging backwards |
| `limit` | number | 1–100, default 100 |

```
curl -H "Authorization: Bot $EFIR_TOKEN" \
  "http://<сервер>:4318/api/v1/channels/$CHANNEL/messages?limit=20"
```

### `GET /channels/{id}/messages/{mid}`

One message. Errors: `404`.

### `POST /channels/{id}/messages`

Send message. Permission: send messages (in DM — not needed). Response — message,
`201`.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `text` | string | yes, unless attachments | 1 to 4000 characters; [formatting](#formatting) |
| `attachments` | array of strings | | ids of [uploaded](#files) files, up to 10; extras are dropped |
| `reply_to` | string | | id of message from this channel: reply with quote |

```
curl -X POST http://<сервер>:4318/api/v1/channels/$CHANNEL/messages \
  -H "Authorization: Bot $EFIR_TOKEN" -H "Content-Type: application/json" \
  -d '{"text":"**pong**"}'
```

Errors:

- `403` — no permission to write or attach files; in DM — user blocked the bot
  or restricted who can message them;
- `400` — empty or too long text, someone else's attachment, message to reply to not found;
- `429` — message limit or slow mode.

Bot cannot message a user first: the DM chat appears when the user messages the bot.

### `PATCH /messages/{mid}`

Edit own message. Response — message.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `text` | string | yes | 1 to 4000 characters |

Errors: `403` — not the bot's message, `404`.

### `DELETE /messages/{mid}`

Delete message: own — always, someone else's — with Manage Messages («Управлять сообщениями») permission. Response —
`{ "ok": true }`.

### `PUT /messages/{mid}/reactions/{emoji}`

Add reaction. Permission: add reactions. Response — message reactions.
`emoji` — one emoji URL-encoded: 👍 → `%F0%9F%91%8D`.

Errors: `400` — not an emoji or multiple, `403`, `404`.

### `DELETE /messages/{mid}/reactions/{emoji}`

Remove own reaction. Response — message reactions.

### `PUT /channels/{id}/pins/{mid}` and `DELETE /channels/{id}/pins/{mid}`

Pin or unpin. Permission: manage messages. Channel has up to 50 pins.
Response — `{ "ok": true }`. Errors: `400` — already 50, `403`, `404`.

### `POST /messages/{mid}/forward`

Forward message with attachments. Response — `{ "ids": [...] }`, ids of copies in order of chats.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `channel_ids` | array of strings | yes | 1 to 10 chats the bot can write to |
| `comment` | string | | goes as separate message before copy; truncated to 4000 |

Errors: `400` — not 1–10 chats, forwarding to voice channel or category; `403` — no permission to write or attach files; `404`; `429` — forwarding limit.

### Formatting

Like in Discord: `**bold**`, `*italic*`, `__underline__`, `~~strikethrough~~`,
`||spoiler||`, `` `code` ``, code block between lines ```` ``` ````, quote — line with `> `.
Mention — `@username`. For the first three links in the text, the server will add a preview (`embeds`) after a couple of seconds and send `MESSAGE_UPDATE`.

## Files

First the file is uploaded, then its id goes into `attachments` of the message.

### `PUT /channels/{id}/attachments`

Body — the file itself, `Content-Type` any. Permission: attach files. Response —
`{ id, name, kind, size }`, `201`.

| Query parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | | file name; truncated to 120 characters, `/`, `\` and control characters replaced with `_` |
| `w`, `h` | numbers | | width and height of image or video: the app will reserve space |
| `spoiler` | `1` | | image or video under spoiler: blurred until opened |

- Up to 1 GB; images up to 20 MB.
- Type (`kind`) is determined by the server from content: `image` — png, jpg, gif, webp, avif;
  `video` — mp4, mov, webm; rest — `file`.
- A file that didn't make it into a message within a day is deleted.
- Files not opened by anyone for 30 days are deleted; the message keeps the attachment with
  `expired: true`.

Errors: `400` — empty file, `403`, `413` — over limit, `507` — server storage
full or disk space running out.

```
curl -X PUT "http://<сервер>:4318/api/v1/channels/$CHANNEL/attachments?name=report.pdf" \
  -H "Authorization: Bot $EFIR_TOKEN" --data-binary @report.pdf
# {"id":"…","name":"report.pdf","kind":"file","size":48213}

curl -X POST http://<сервер>:4318/api/v1/channels/$CHANNEL/messages \
  -H "Authorization: Bot $EFIR_TOKEN" -H "Content-Type: application/json" \
  -d '{"text":"Report","attachments":["<id from response above>"]}'
```

### `GET /attachments/{id}`

File content; supports `Range`. Permission: read history in the file's channel.
Errors: `404` — no file or deleted, `403`, `416` — invalid `Range`.

## Roles

Bot cannot touch roles not below its highest role and cannot grant permissions it doesn't have itself
— like a user.

### `GET /servers/{id}/roles`

Server roles, from highest to `@everyone`.

### `POST /servers/{id}/roles`

Permission: manage roles. New role is placed at the bottom, above `@everyone`. Server has up to 250
roles. Response — [role](#role).

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | yes | 1 to 32 characters |
| `color` | string \| null | | `#rrggbb`; anything else — no color |
| `hoist` | boolean | | show as separate group in member list |
| `permissions` | number | | [permission bits](#permissions) |

### `PATCH /servers/{id}/roles/{rid}`

Same fields, all optional. For `@everyone`, only `permissions` change. Response — role.
Errors: `403` — role not below bot's highest role or permissions the bot doesn't have; `404`.

### `PATCH /servers/{id}/roles`

Role order. Body — `{ "roles": [{ "id", "position" }] }`; higher `position` means higher rank.
Errors: `400` — not a list, unknown role, invalid position.

### `DELETE /servers/{id}/roles/{rid}`

Permission: manage roles. Cannot delete `@everyone`.

## Members

### `PUT` and `DELETE /servers/{id}/members/{uid}/roles/{rid}`

Grant or revoke role. Permission: manage roles. Response — `{ "roles": [...] }`, member's
roles. Errors: `403` — role or member not below bot, `404`.

### `DELETE /servers/{id}/members/{uid}`

Kick. Permission: kick members. Body — `{ "reason": "…" }` (optional,
truncated to 512, goes into audit log). Errors: `403` — owner or member not
below bot, `404`.

### `PATCH /servers/{id}/members/{uid}/voice`

Voice moderation. Response — member's voice state or `{ "ok": true }` if not currently in a voice channel
(mute and deafen will take effect when joining).

| Field | Type | Permission | Description |
| --- | --- | --- | --- |
| `mute` | boolean | mute members | server mute; persists between sessions |
| `deaf` | boolean | deafen members | server deafen; persists between sessions |
| `channel_id` | string \| null | move members | to another voice channel; `null` — disconnect |

Errors: `400` — moving member not in this server's voice channel;
`403` — no permission, member's role not below or no access to channel; `404`.

## Bans

Permission: ban members.

### `GET /servers/{id}/bans`

`[{ user_id, user, reason, actor_id, created }]`, newest first.

### `PUT /servers/{id}/bans/{uid}`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `reason` | string | | truncated to 512 |
| `delete_message_seconds` | number | | delete member messages from last N seconds, 0–604800 (7 days) |

Can ban someone not on the server. Errors: `400` — the bot itself, `403` — owner or
member not below bot, `404`.

### `DELETE /servers/{id}/bans/{uid}`

Unban.

## Invites

### `GET /servers/{id}/invites`

Active invites. Permission: manage server.

### `POST /servers/{id}/invites`

Permission: create invites. Response — `{ code, space_id, creator_id, created, expires,
max_uses, uses }`, `201`; `expires` — time in ms or `null`, `max_uses` — number or `null`.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `max_age` | number | | seconds to live, 0–2592000 (30 days); 0 — no expiration; default 604800 (7 days) |
| `max_uses` | number | | 0–1000; 0 — no limit |

### `DELETE /invites/{code}`

Delete: own — always, someone else's — with Manage Server («Управлять сервером») permission.

## Polls

Text channels of servers only. A message with a poll comes as regular, with field
`poll`.

### `POST /channels/{id}/polls`

Permission: create polls. Response — `{ id, message_id }`.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `question` | string | yes | 1 to 300 characters |
| `options` | array of strings | yes | 2–10 options, each truncated to 100, no repeats |
| `multiple` | boolean | | can select multiple options |

### `PUT /polls/{id}/votes`

Vote. Body — `{ "options": [0, 2] }`: option indices; empty list removes vote. Response — [poll](#poll).

Errors: `400` — poll closed, unknown option, multiple options where only one allowed; `404`.

### `POST /polls/{id}/close`

Close. Can be done by poll author or member with Manage Messages («Управлять сообщениями») permission. Body — `{}`.

## Events

Text channels of servers only. A message with an event comes with field `event`; those attending get `EVENT_REMINDER`
10 minutes before start.

### `POST /channels/{id}/events`

Permission: create events. Response — `{ id, message_id }`.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | string | yes | 1 to 100 characters |
| `starts` | number | yes | start time, ms; not earlier than a minute ago and not more than 366 days ahead |
| `description` | string | | truncated to 1000 |
| `voice_channel_id` | string | | voice channel of this server where participants gather |

### `PUT /events/{id}/rsvp`

Body — `{ "answer": "going" }`: `going`, `not_going` or `null` (remove answer). Response —
[event](#event).

## Miscellaneous

### `GET /gateway`

`{ "url": "/api/gateway", "heartbeat_interval": … }` — where to connect for
[events](gateway.md).

### `GET /cosmetics` and `GET /cosmetics/{id}`

Profile customization catalog and one item from it (each has `assets[]` with `url`).
`404` if the server has no catalog.

### Voice

Bots cannot connect to voice channels yet, but they see who is where (`voice_states` on
server and event `VOICE_STATE_UPDATE`), and can moderate voice.
