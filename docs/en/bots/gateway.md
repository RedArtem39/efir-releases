# Event gateway

WebSocket, through which the bot learns about everything that happens on its servers and in DMs.
The [library](library.md) keeps it itself; here is the protocol for your own implementation.

## Connection

Address: `ws://<server>/api/gateway` (`wss://` for HTTPS).

1. The server sends `{ "op": "hello", "d": { "heartbeat_interval": 30000 } }`.
2. The bot answers within 10 seconds `{ "op": "identify", "d": { "token": "<token>" } }`.
3. The server sends the `READY` event: the bot's profile and its servers in full.
4. Every `heartbeat_interval` ms the bot sends `{ "op": "heartbeat" }`, the server responds with
   `{ "op": "heartbeat_ack" }`. Without heartbeat the connection closes.

All events come like this:

```json
{ "op": "dispatch", "t": "MESSAGE_CREATE", "d": { "server_id": "…", "message": { … } } }
```

`d` always contains `server_id`; for direct messages it is `null`, and there is `dm: true`.

### Closing

| Code | Meaning | What to do |
| --- | --- | --- |
| `4001` | token is wrong or revoked via `/token` | stop, get a new token |
| `4002` | sent non-JSON | fix code |
| `4003` | account or device is blocked | stop |
| other | network, server restart | reconnect with increasing pause: 1, 2, 4… up to 30 seconds |

After reconnection, `READY` will come again: events during the interruption are not resent, so
if needed, re-read them via HTTP API.

### What you can send

| `op` | `d` | Why |
| --- | --- | --- |
| `identify` | `{ token }` | log in |
| `heartbeat` | — | keep connection |
| `typing` | `{ channel_id }` | "typing…", like `POST /channels/{id}/typing` |

## Events

### Messages

| Type | `d` |
| --- | --- |
| `MESSAGE_CREATE` | `message` — [message](objects.md#message) in full |
| `MESSAGE_UPDATE` | `message` — after edit, pin, poll vote, event reply, link preview appearing |
| `MESSAGE_DELETE` | `id`, `channel_id` |
| `MESSAGE_DELETE_BULK` | `channel_id`, `ids` — direct message history cleared |
| `MESSAGE_REACTION_UPDATE` | `message_id`, `channel_id`, `reactions` |
| `CHANNEL_PINS_UPDATE` | `channel_id` |
| `TYPING_START` | `channel_id`, `user_id` |

```json
{
  "t": "MESSAGE_CREATE",
  "d": {
    "server_id": "93d161f9-…",
    "message": {
      "id": "cc41214d-…",
      "channel_id": "308bc030-…",
      "user_id": "000000001",
      "username": "Red_Artem39",
      "name": "Артём",
      "bot": false,
      "text": "/ping",
      "created": 1790322464077,
      "edited": null,
      "pinned": null,
      "reply": null,
      "forward": null,
      "attachments": [],
      "embeds": [],
      "reactions": [],
      "event": null,
      "poll": null
    }
  }
}
```

```json
{
  "t": "MESSAGE_REACTION_UPDATE",
  "d": { "server_id": "93d161f9-…", "channel_id": "308bc030-…", "message_id": "cc41214d-…",
         "reactions": [{ "emoji": "👍", "count": 1, "mine": 1 }] }
}
```

`mine` in reactions — whether the bot added it.

### Servers and members

| Type | `d` |
| --- | --- |
| `SERVER_CREATE` | `server` — new server in full |
| `SERVER_UPDATE` | `server` — `id`, `name`, `description`, `public`, `verified` |
| `SERVER_DELETE` | server deleted, bot was kicked or banned |
| `SERVER_MEMBER_ADD` | `user` — [member](objects.md#member); if it's the bot itself — it joined the server |
| `SERVER_MEMBER_REMOVE` | `user_id` |
| `SERVER_MEMBER_UPDATE` | `user_id`, `roles` — all roles of the member |
| `USER_UPDATE` | `user` — profile changed |
| `PRESENCE_UPDATE` | `user_id`, `online`, `status` (`online`, `idle`, `dnd`, `offline`), `activity` (`{ name, since }` — "Playing…", or `null`) |

```json
{
  "t": "SERVER_MEMBER_ADD",
  "d": {
    "server_id": "93d161f9-…",
    "user": { "id": "000000003", "name": "Кент", "username": "Kent_one", "bot": false, "verified": false,
              "online": true, "status": "online", "activity": null, "roles": [], "avatar_media": null }
  }
}
```

### Channels and roles

| Type | `d` |
| --- | --- |
| `CHANNEL_CREATE` | `channel` |
| `CHANNEL_UPDATE` | `channel` |
| `CHANNEL_DELETE` | `id`, `orphans` — channels left without category |
| `CHANNELS_UPDATE` | `channels` — all channels the bot can see (after order or permission change) |
| `ROLE_CREATE` / `ROLE_UPDATE` | `role` |
| `ROLE_DELETE` | `role_id` |
| `ROLES_UPDATE` | `roles` — after order change |

The `channel` in events has a `permissions` field — the permissions of whoever received the event, i.e. the bot.

### Voice

| Type | `d` |
| --- | --- |
| `VOICE_STATE_UPDATE` | `user_id`, `channel_id` (`null` — left), `self_mute`, `self_deaf`, `mute`, `deaf`, `streaming`, `stream_audio`, `stream_quality` (`{ height, fps }`), `stream_viewers` |
| `VOICE_SPEAKING` | `user_id`, `channel_id`, `speaking` |

`mute` and `deaf` — disabled by moderator, `self_*` — by the person themselves.

### Events

| Type | `d` |
| --- | --- |
| `EVENT_REMINDER` | `event` — [event](objects.md#event), `server_name`; comes to those attending 10 minutes before start |

## Example without library

Node.js 22+, no dependencies — [`echo-bot.mjs`](https://github.com/RedArtem39/efir-releases/blob/main/docs/examples/echo-bot.mjs):
connection, heartbeat, `!ping` → `pong`, echo in DM, reconnection.
