# Objects and permissions

Common to all objects:

- id — strings. Time — milliseconds since 1970.
- Type `string?` — string or `null`.
- Server may add new fields: don't rely on them being absent. Existing fields
  don't change meaning within version `v1`.
- Within the API the server is sometimes called `space` (`space_id`), in documentation — server.

## User

```json
{
  "id": "000000002",
  "username": "Helper_bot",
  "name": "Helper",
  "bio": "",
  "color": "sage",
  "bot": true,
  "verified": false,
  "avatar_media": { "url": "/avatars/….png", "kind": "image", "crop": null },
  "cosmetics": {},
  "created": 1790322464037
}
```

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | numeric id padded with zeros to 9 digits |
| `username` | string | unique, case-insensitive; case is preserved when displayed |
| `name` | string | display name, up to 32 characters |
| `bio` | string | About, up to 190 characters |
| `color` | string | avatar color without image |
| `bot` | boolean | is a bot |
| `verified` | boolean | verified by platform owner |
| `avatar_media` | object? | `{ url, kind: "image" \| "video", crop }`, `url` — from server root; `null` without avatar |
| `cosmetics` | object | profile customization (frame, effect, etc.) if selected |
| `created` | number | registration time |
| `owner` | boolean | present only for platform owner, `true` |

## Member

User on server (in `members` of [server](#server)): user fields and also

| Field | Type | Description |
| --- | --- | --- |
| `roles` | array of strings | ids of member's roles, without `@everyone` |
| `online` | boolean | online |
| `status` | string | `online`, `idle`, `dnd` or `offline` |
| `activity` | object? | "Playing …": `{ name, since }`; `null` if nothing |

## Server

```json
{
  "id": "93d161f9-…",
  "name": "The Crew",
  "description": "",
  "owner_id": "000000001",
  "public": false,
  "verified": false,
  "created": 1790322464041,
  "permissions": 3247681,
  "top": 1,
  "owned": false,
  "roles": [],
  "channels": [],
  "members": [],
  "voice_states": []
}
```

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | |
| `name` | string | up to 40 characters |
| `description` | string | up to 300 characters |
| `owner_id` | string | owner |
| `public` | boolean | visible in server search, can join without invite |
| `verified` | boolean | verified by platform owner |
| `created` | number | |
| `permissions` | number | bot's permissions on server: sum of its roles |
| `top` | number | position of bot's highest role |
| `owned` | boolean | bot is owner |
| `roles` | array | [roles](#role), from highest |
| `channels` | array | [channels](#channel) in display order |
| `members` | array | [members](#member) |
| `voice_states` | array | [voice states](#voice-state): who is in voice channels now |

## Channel

```json
{
  "id": "308bc030-…",
  "space_id": "93d161f9-…",
  "name": "general",
  "kind": "text",
  "topic": "",
  "parent_id": "74a9c3e5-…",
  "position": 0,
  "slowmode": 0,
  "synced": true,
  "bitrate": 64,
  "user_limit": 0,
  "overwrites": [{ "type": "role", "id": "93d161f9-…", "allow": 0, "deny": 2048 }],
  "permissions": 3247681
}
```

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | |
| `space_id` | string? | channel's server; in direct message — `null` |
| `name` | string | up to 32 characters |
| `kind` | string | `text`, `voice`, `category`; direct message — `dm` |
| `topic` | string | topic of text channel, up to 1024 characters |
| `parent_id` | string? | category or `null` |
| `position` | number | order within category |
| `slowmode` | number | seconds between messages from one member, 0 — off |
| `synced` | boolean | special permissions inherited from category |
| `bitrate` | number | voice: kbps, 8–96 |
| `user_limit` | number | voice: 0 — up to 25 members |
| `overwrites` | array | special permissions: `{ type: "role" \| "member", id, allow, deny }` |
| `permissions` | number | bot's resulting permissions in this channel |

## Role

```json
{
  "id": "7a0fd5d2-…",
  "space_id": "93d161f9-…",
  "name": "Moderator",
  "color": "#e91e63",
  "hoist": true,
  "permissions": 8198,
  "position": 2,
  "everyone": false,
  "created": 1790322464055
}
```

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | for `@everyone` equals server id |
| `space_id` | string | |
| `name` | string | up to 32 characters |
| `color` | string? | `#rrggbb` or `null` |
| `hoist` | boolean | display separately in member list |
| `permissions` | number | [permission bits](#permissions) |
| `position` | number | higher value, higher position; for `@everyone` — 0 |
| `everyone` | boolean | is `@everyone` |
| `created` | number | |

## Message

```json
{
  "id": "cc41214d-…",
  "channel_id": "308bc030-…",
  "user_id": "000000001",
  "username": "Red_Artem39",
  "name": "Artem",
  "bot": false,
  "verified": false,
  "text": "hi",
  "created": 1790322464077,
  "edited": null,
  "pinned": null,
  "reply_to": null,
  "reply": null,
  "forward": null,
  "attachments": [],
  "embeds": [],
  "reactions": [{ "emoji": "👍", "count": 2, "mine": 0 }],
  "event": null,
  "poll": null
}
```

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | |
| `channel_id` | string | |
| `user_id`, `username`, `name` | strings | author |
| `bot`, `verified` | booleans | author is bot; author has verification |
| `text` | string | up to 4000 characters, [formatting](rest.md#formatting); empty string — attachments only |
| `created` | number | |
| `edited` | number? | last edit time |
| `pinned` | number? | time of pinning |
| `reply_to` | string? | id of message this replies to |
| `reply` | object? | that message: `{ id, channel_id, created, user_id, name, username, text, files }`, first 200 characters of text; `{ id, deleted: true }` if deleted |
| `forward` | object? | forwarded from: `{ message_id, created, user, server?, channel? }`; for forwarded event or poll it's inside `event` or `poll` |
| `attachments` | array | [attachments](#attachment) |
| `embeds` | array | link previews: `{ url, type: "link" \| "image", site, title, description, color, image, large }` |
| `reactions` | array | `{ emoji, count, mine }`; `mine` — 1 if bot added this reaction |
| `event` | object? | [event](#event) in this message |
| `poll` | object? | [poll](#poll) in this message |

In gateway events messages come with `server_id` (or `null` in direct messages) and `dm`.
In libraries `reply` and `forward` are called `repliedTo` / `replied_to` and `forwardedFrom` /
`forwarded_from` to not confuse with `reply()` and `forward()` methods.

## Attachment

```json
{
  "id": "b6129711-…",
  "name": "report.pdf",
  "mime": "application/pdf",
  "kind": "file",
  "size": 48213,
  "width": null,
  "height": null,
  "url": "/attachments/b6129711-…/report.pdf",
  "expired": false
}
```

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | |
| `name` | string | up to 120 characters |
| `mime` | string | type by content |
| `kind` | string | `image`, `video`, `audio` or `file` |
| `size` | number | bytes |
| `width`, `height` | number? | image or video size if provided on upload |
| `url` | string? | from server root; `null` if file deleted |
| `expired` | boolean | file deleted: no one opened it for 30 days |
| `spoiler` | `true` | image or video with spoiler; absent if not spoiler |
| `variant` | string | voice message (`voice`) or round video (`round`) from app; absent for regular files |
| `duration` | number | duration in seconds; absent for regular files |
| `waveform` | string | 64 bytes of volume in base64; present only for `voice` |

## Voice state

```json
{
  "user_id": "000000001",
  "channel_id": "5b0c…",
  "self_mute": false,
  "self_deaf": false,
  "mute": false,
  "deaf": false,
  "speaking": false,
  "streaming": false,
  "stream_audio": false,
  "stream_quality": null,
  "stream_viewers": 0
}
```

| Field | Type | Description |
| --- | --- | --- |
| `user_id`, `channel_id` | strings | who and in which voice channel |
| `self_mute`, `self_deaf` | booleans | muted microphone or sound themselves |
| `mute`, `deaf` | booleans | muted by moderator |
| `speaking` | boolean | speaking right now |
| `streaming` | boolean | sharing screen |
| `stream_audio` | boolean | stream with audio |
| `stream_quality` | string? | stream quality |
| `stream_viewers` | number | stream viewers count |

## Event

```json
{
  "id": "51938fb5-…",
  "message_id": "50d5d92f-…",
  "channel_id": "308bc030-…",
  "server_id": "93d161f9-…",
  "creator_id": "000000001",
  "title": "Game Night",
  "description": "Meeting in voice",
  "starts": 1790326064000,
  "voice_channel": { "id": "…", "name": "General" },
  "going": 3,
  "attendees": [],
  "mine": "going"
}
```

| Field | Type | Description |
| --- | --- | --- |
| `id`, `message_id`, `channel_id`, `server_id`, `creator_id` | strings | |
| `title` | string | up to 100 characters |
| `description` | string | up to 1000 characters |
| `starts` | number | start time |
| `voice_channel` | object? | `{ id, name }` — where to gather |
| `going` | number | number going |
| `attendees` | array | first 8 going, [users](#user) |
| `mine` | string? | bot's response: `going`, `not_going` or `null` |

## Poll

```json
{
  "id": "11811ca9-…",
  "message_id": "8e47adb8-…",
  "question": "What to play?",
  "multiple": false,
  "closed": false,
  "voters": 4,
  "options": [{ "text": "CS2", "votes": 3 }, { "text": "Dota 2", "votes": 1 }],
  "mine": [0],
  "can_close": true
}
```

| Field | Type | Description |
| --- | --- | --- |
| `id`, `message_id` | strings | |
| `question` | string | up to 300 characters |
| `multiple` | boolean | can select multiple options |
| `closed` | boolean | poll closed |
| `voters` | number | number of people who voted |
| `options` | array | `{ text, votes }`, 2–10 options; array index — vote number |
| `mine` | array of numbers | indices that bot voted for |
| `can_close` | boolean | bot can close poll |

## Audit log

```json
{
  "id": "7c8005e9-…",
  "space_id": "93d161f9-…",
  "actor_id": "000000002",
  "actor": { "id": "000000002", "username": "Helper_bot" },
  "action": "SERVER_UPDATE",
  "target_type": "server",
  "target_id": "93d161f9-…",
  "changes": { "description": { "old": "", "new": "test" } },
  "reason": null,
  "created": 1790322464063
}
```

| Field | Type | Description |
| --- | --- | --- |
| `id`, `space_id` | strings | |
| `actor_id`, `actor` | string, [user](#user) | who did it |
| `action` | string | what was done, for example `SERVER_UPDATE`, `MEMBER_KICK`, `MEMBER_BAN_ADD`, `INVITE_CREATE` |
| `target_type`, `target_id` | strings | what on: `server`, `channel`, `role`, `member`, `invite`, … |
| `target` | [user](#user) | present if target is member |
| `changes` | object? | `{ field: { old, new } }` |
| `reason` | string? | reason, up to 512 characters |
| `created` | number | |

## Permissions

Bit mask. Bits are same as in Discord, except for events and polls: in Discord they are above
32nd bit, here permissions fit in 31 bit.

| Bit | Value | Permission |
| --- | --- | --- |
| `1 << 0` | 1 | Create invites (создавать приглашения) |
| `1 << 1` | 2 | Kick members (выгонять участников) |
| `1 << 2` | 4 | Ban members (банить участников) |
| `1 << 3` | 8 | Administrator (администратор) — all permissions |
| `1 << 4` | 16 | Manage channels (управлять каналами) |
| `1 << 5` | 32 | Manage server (управлять сервером) |
| `1 << 6` | 64 | Add reactions (добавлять реакции) |
| `1 << 7` | 128 | View audit log (просматривать журнал аудита) |
| `1 << 9` | 512 | Video (видео) (screen share) |
| `1 << 10` | 1024 | View channels (просматривать каналы) |
| `1 << 11` | 2048 | Send messages (отправлять сообщения) |
| `1 << 13` | 8192 | Manage messages (управлять сообщениями) |
| `1 << 15` | 32768 | Attach files (прикреплять файлы) |
| `1 << 16` | 65536 | Read message history (читать историю сообщений) |
| `1 << 20` | 1048576 | Connect to voice (подключаться к голосовым) |
| `1 << 21` | 2097152 | Speak (говорить) |
| `1 << 22` | 4194304 | Mute members (отключать микрофон участникам) |
| `1 << 23` | 8388608 | Deafen members (отключать звук участникам) |
| `1 << 24` | 16777216 | Move members (перемещать участников) |
| `1 << 28` | 268435456 | Manage roles (управлять ролями) |
| `1 << 29` | 536870912 | Create events (создавать события) |
| `1 << 30` | 1073741824 | Create polls (создавать опросы) |

Resulting permissions calculated same as in Discord:

1. `@everyone` permissions;
2. plus permissions of all member's roles;
3. channel special permissions: first for `@everyone`, then for member's roles (denies, then
   allows), then for the member itself;
4. channel with `synced: true` inherits special permissions from its category;
5. server owner and role with "Administrator" permission can do everything.

Permissions in channel without "View channels" grant nothing: bot doesn't see such channel.
