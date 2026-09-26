# Объекты и права

id — строки. Время — миллисекунды с 1970 года. Поля, которых нет в описании, могут
появиться в ответах: не полагайтесь на то, что их нет.

## Пользователь

```json
{
  "id": "000000002",
  "username": "Helper_bot",
  "name": "Помощник",
  "bio": "",
  "color": "sage",
  "bot": true,
  "verified": false,
  "avatar_media": { "url": "/avatars/….png", "kind": "image", "crop": null },
  "created": 1790322464037
}
```

- `username` — уникальный, регистр сохраняется; `name` — отображаемое имя.
- `verified` — галочка от владельца платформы (у ботов — внутри метки BOT).
- `avatar_media` — `null`, если аватара нет; `kind`: `image` или `video`; `url` — от корня сервера.
- `color` — цвет по умолчанию для аватара без картинки.

## Участник

Пользователь на сервере, плюс:

| Поле | Что это |
| --- | --- |
| `roles` | id ролей участника |
| `online`, `status` | в сети; `online`, `idle`, `dnd` или `offline` |
| `activity` | `{ name, since }` — «Играет в …», или `null` |

## Сервер

```json
{
  "id": "93d161f9-…",
  "name": "Кенты",
  "description": "",
  "owner_id": "000000001",
  "public": false,
  "verified": false,
  "created": 1790322464041,
  "permissions": 3247681,
  "top": 1,
  "owned": false,
  "roles": [ … ],
  "channels": [ … ],
  "members": [ … ],
  "voice_states": [ … ]
}
```

- `permissions` — права бота на сервере (сумма ролей), `top` — позиция его высшей роли.
- `public` — виден в поиске серверов, вступить можно без приглашения.
- `voice_states` — кто сейчас в голосовых каналах, как в `VOICE_STATE_UPDATE`.

## Канал

```json
{
  "id": "308bc030-…",
  "space_id": "93d161f9-…",
  "name": "общий",
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

- `space_id` — сервер канала (внутри API сервер называется `space`).
- `kind`: `text`, `voice`, `category`; у личного чата — `dm`.
- `parent_id` — категория или `null`; `synced` — права берутся у категории.
- `overwrites` — особые права для ролей и участников; `permissions` — итоговые права бота здесь.

## Роль

```json
{
  "id": "7a0fd5d2-…",
  "space_id": "93d161f9-…",
  "name": "Модератор",
  "color": "#e91e63",
  "hoist": true,
  "permissions": 8198,
  "position": 2,
  "everyone": false,
  "created": 1790322464055
}
```

`@everyone` — роль с `everyone: true`, её id равен id сервера, `position: 0`. Чем больше
`position`, тем выше роль.

## Сообщение

```json
{
  "id": "cc41214d-…",
  "channel_id": "308bc030-…",
  "user_id": "000000001",
  "username": "Red_Artem39",
  "name": "Артём",
  "bot": false,
  "verified": false,
  "text": "привет",
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

| Поле | Что это |
| --- | --- |
| `edited`, `pinned` | время правки и закрепления или `null` |
| `reply` | сообщение, на которое это ответ: `{ id, channel_id, created, user_id, name, username, text, files }`, первые 200 символов текста; `{ id, deleted: true }`, если его удалили |
| `forward` | откуда переслано: `{ message_id, created, user, server?, channel? }`; у пересланного события или опроса — `event` или `poll` внутри |
| `attachments` | [вложения](#вложение) |
| `embeds` | превью ссылок: `{ url, type: "link" \| "image", site, title, description, color, image, large }` |
| `reactions` | `{ emoji, count, mine }`, `mine` — поставил ли сам бот |
| `event`, `poll` | [событие](#событие) или [опрос](#опрос) в этом сообщении |

В библиотеке `reply` и `forward` называются `repliedTo` и `forwardedFrom`, чтобы не
путаться с методами `reply()` и `forward()`.

## Вложение

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

- `kind`: `image`, `video`, `audio` или `file`.
- `expired: true` и `url: null` — файл удалён: его никто не открывал 30 дней.
- `spoiler: true` — картинка или видео отправлены спойлером (поле есть только тогда).
- Голосовые сообщения и кружочки из приложения: `variant` — `voice` или `round`,
  `duration` в секундах; у голосовых ещё `waveform` — 64 байта громкости в base64.

## Событие

```json
{
  "id": "51938fb5-…",
  "message_id": "50d5d92f-…",
  "channel_id": "308bc030-…",
  "server_id": "93d161f9-…",
  "creator_id": "000000001",
  "title": "Катка",
  "description": "Собираемся в голосовом",
  "starts": 1790326064000,
  "voice_channel": { "id": "…", "name": "Общий" },
  "going": 3,
  "attendees": [ … ],
  "mine": "going"
}
```

`attendees` — первые 8 идущих; `mine` — ответ бота: `going`, `not_going` или `null`.

## Опрос

```json
{
  "id": "11811ca9-…",
  "message_id": "8e47adb8-…",
  "question": "Во что играем?",
  "multiple": false,
  "closed": false,
  "voters": 4,
  "options": [{ "text": "CS2", "votes": 3 }, { "text": "Dota 2", "votes": 1 }],
  "mine": [0],
  "can_close": true
}
```

`mine` — индексы вариантов, за которые голосовал бот; `can_close` — может ли бот завершить опрос.

## Журнал аудита

```json
{
  "id": "7c8005e9-…",
  "space_id": "93d161f9-…",
  "actor_id": "000000002",
  "actor": { "id": "000000002", "username": "Helper_bot", … },
  "action": "SERVER_UPDATE",
  "target_type": "server",
  "target_id": "93d161f9-…",
  "changes": { "description": { "old": "", "new": "тест" } },
  "reason": null,
  "created": 1790322464063
}
```

## Права

Битовая маска. Биты те же, что в Discord, кроме событий и опросов: в Discord они выше
32-го бита, а здесь права помещаются в 31 бит.

| Бит | Значение | Право |
| --- | --- | --- |
| `1 << 0` | 1 | создавать приглашения |
| `1 << 1` | 2 | выгонять участников |
| `1 << 2` | 4 | банить участников |
| `1 << 3` | 8 | администратор — все права |
| `1 << 4` | 16 | управлять каналами |
| `1 << 5` | 32 | управлять сервером |
| `1 << 6` | 64 | добавлять реакции |
| `1 << 7` | 128 | просматривать журнал аудита |
| `1 << 9` | 512 | видео (демонстрация экрана) |
| `1 << 10` | 1024 | просматривать каналы |
| `1 << 11` | 2048 | отправлять сообщения |
| `1 << 13` | 8192 | управлять сообщениями |
| `1 << 15` | 32768 | прикреплять файлы |
| `1 << 16` | 65536 | читать историю сообщений |
| `1 << 20` | 1048576 | подключаться к голосовым |
| `1 << 21` | 2097152 | говорить |
| `1 << 22` | 4194304 | отключать микрофон участникам |
| `1 << 23` | 8388608 | отключать звук участникам |
| `1 << 24` | 16777216 | перемещать участников |
| `1 << 28` | 268435456 | управлять ролями |
| `1 << 29` | 536870912 | создавать события |
| `1 << 30` | 1073741824 | создавать опросы |

Итоговые права считаются как в Discord:

1. права `@everyone`;
2. плюс права всех ролей участника;
3. особые права канала: сначала для `@everyone`, потом для ролей участника (запреты, потом
   разрешения), потом для самого участника;
4. канал с `synced: true` берёт особые права своей категории;
5. владелец сервера и роль с правом «Администратор» могут всё.

Права в канале без «Просматривать каналы» не дают ничего: бот такой канал не видит.
