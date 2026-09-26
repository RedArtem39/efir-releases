# Шлюз событий

WebSocket, по которому бот узнаёт обо всём, что происходит на его серверах и в личке.
[Библиотека](library.md) держит его сама; здесь — протокол для своей реализации.

## Подключение

Адрес: `ws://<сервер>/api/gateway` (`wss://` при HTTPS).

1. Сервер присылает `{ "op": "hello", "d": { "heartbeat_interval": 30000 } }`.
2. Бот в течение 10 секунд отвечает `{ "op": "identify", "d": { "token": "<токен>" } }`.
3. Сервер присылает событие `READY`: профиль бота и его серверы целиком.
4. Каждые `heartbeat_interval` мс бот шлёт `{ "op": "heartbeat" }`, сервер отвечает
   `{ "op": "heartbeat_ack" }`. Без heartbeat соединение закрывается.

Все события приходят так:

```json
{ "op": "dispatch", "t": "MESSAGE_CREATE", "d": { "server_id": "…", "message": { … } } }
```

В `d` всегда есть `server_id`; для личных сообщений это `null`, и есть `dm: true`.

### Закрытие

| Код | Что значит | Что делать |
| --- | --- | --- |
| `4001` | токен неверный или сброшен через `/token` | остановиться, взять новый токен |
| `4002` | прислали не JSON | исправить код |
| `4003` | аккаунт или устройство заблокированы | остановиться |
| другие | сеть, перезапуск сервера | переподключиться с растущей паузой: 1, 2, 4… до 30 секунд |

После переподключения снова придёт `READY`: события за время обрыва не досылаются, так что
при необходимости перечитайте нужное через HTTP API.

### Что можно послать

| `op` | `d` | Зачем |
| --- | --- | --- |
| `identify` | `{ token }` | войти |
| `heartbeat` | — | держать соединение |
| `typing` | `{ channel_id }` | «печатает…», как `POST /channels/{id}/typing` |

## События

### Сообщения

| Тип | `d` |
| --- | --- |
| `MESSAGE_CREATE` | `message` — [сообщение](objects.md#сообщение) целиком |
| `MESSAGE_UPDATE` | `message` — после правки, закрепления, голоса в опросе, ответа на событие, появления превью ссылок |
| `MESSAGE_DELETE` | `id`, `channel_id` |
| `MESSAGE_DELETE_BULK` | `channel_id`, `ids` — личную переписку очистили |
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

`mine` в реакциях — поставил ли её сам бот.

### Серверы и участники

| Тип | `d` |
| --- | --- |
| `SERVER_CREATE` | `server` — новый сервер целиком |
| `SERVER_UPDATE` | `server` — `id`, `name`, `description`, `public`, `verified` |
| `SERVER_DELETE` | сервер удалён, бота выгнали или забанили |
| `SERVER_MEMBER_ADD` | `user` — [участник](objects.md#участник); если это сам бот — он вступил на сервер |
| `SERVER_MEMBER_REMOVE` | `user_id` |
| `SERVER_MEMBER_UPDATE` | `user_id`, `roles` — все роли участника |
| `USER_UPDATE` | `user` — профиль изменился |
| `PRESENCE_UPDATE` | `user_id`, `online`, `status` (`online`, `idle`, `dnd`, `offline`), `activity` (`{ name, since }` — «Играет в …», или `null`) |

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

### Каналы и роли

| Тип | `d` |
| --- | --- |
| `CHANNEL_CREATE` | `channel` |
| `CHANNEL_UPDATE` | `channel` |
| `CHANNEL_DELETE` | `id`, `orphans` — каналы, оставшиеся без категории |
| `CHANNELS_UPDATE` | `channels` — все каналы, которые бот видит (после смены порядка или прав) |
| `ROLE_CREATE` / `ROLE_UPDATE` | `role` |
| `ROLE_DELETE` | `role_id` |
| `ROLES_UPDATE` | `roles` — после смены порядка |

У `channel` в событиях поле `permissions` — права того, кому пришло событие, то есть бота.

### Голос

| Тип | `d` |
| --- | --- |
| `VOICE_STATE_UPDATE` | `user_id`, `channel_id` (`null` — вышел), `self_mute`, `self_deaf`, `mute`, `deaf`, `streaming`, `stream_audio`, `stream_quality` (`{ height, fps }`), `stream_viewers` |
| `VOICE_SPEAKING` | `user_id`, `channel_id`, `speaking` |

`mute` и `deaf` — выключено модератором, `self_*` — самим человеком.

### События

| Тип | `d` |
| --- | --- |
| `EVENT_REMINDER` | `event` — [событие](objects.md#событие), `server_name`; приходит тем, кто идёт, за 10 минут до начала |

## Пример без библиотеки

Node.js 22+, без зависимостей — [`echo-bot.mjs`](https://github.com/RedArtem39/efir-releases/blob/main/docs/examples/echo-bot.mjs):
подключение, heartbeat, `!ping` → `pong`, эхо в личке, переподключение.
