# HTTP API

Для ботов на любом языке: обычные HTTP-запросы, которые можно проверить прямо из консоли
через curl. На Node.js и Python проще взять библиотеку — [для Node.js](library.md),
[для Python](python.md).

## Основы

- Адрес: `http://<сервер>/api/v1/…`, например `http://<сервер>:4318/api/v1/users/@me`.
- Авторизация: заголовок `Authorization: Bot <токен>`.
- Тела запросов и ответы — JSON (`Content-Type: application/json`), кроме загрузки файлов.
- Время — миллисекунды с 1970 года (как `Date.now()`).
- Ошибка — HTTP-статус и `{ "error": "текст" }`. Статусы — в [начале](README.md#ошибки).
- Лимиты: 50 запросов в секунду, 5 сообщений за 5 секунд в канал; превышение — `429` с
  `retry_after` в секундах.
- Боты работают только через `/api/v1`: остальные адреса приложения для них закрыты.

```
curl -H "Authorization: Bot $EFIR_TOKEN" http://<сервер>:4318/api/v1/users/@me
```

Формы ответов — в [объектах](objects.md).

## Профиль

| Запрос | Тело | Ответ |
| --- | --- | --- |
| `GET /users/@me` | — | [пользователь](objects.md#пользователь) |
| `PATCH /users/@me` | `{ name?, bio? }` | пользователь |
| `PUT /users/@me/avatar` | картинка: png, jpg, gif, webp до 8 МБ | пользователь |
| `DELETE /users/@me/avatar` | — | пользователь |
| `GET /users/{id}` | — | пользователь и `spaces` — общие серверы; `404`, если общих серверов нет |

## Серверы

| Запрос | Право | Тело | Ответ |
| --- | --- | --- | --- |
| `GET /servers` | — | — | серверы бота, каждый — [сервер](objects.md#сервер) целиком |
| `GET /servers/{id}` | — | — | сервер |
| `PATCH /servers/{id}` | управлять сервером | `{ name?, description?, public? }` | сервер |
| `POST /join` | — | `{ code }` — код или ссылка приглашения | `{ id }` сервера |
| `POST /servers/{id}/leave` | — | `{}` | `{ ok: true }` |
| `GET /servers/{id}/audit-log?before=&limit=` | журнал аудита | — | [записи журнала](objects.md#журнал-аудита), до 100 |
| `GET /invites/{code}` | — | — | `{ code, server: { id, name, members, verified } }` |

`public: true` показывает сервер в поиске серверов: вступить можно без приглашения.

## Каналы

| Запрос | Право | Тело | Ответ |
| --- | --- | --- | --- |
| `GET /channels/{id}` | — | — | [канал](objects.md#канал) с правами бота |
| `POST /servers/{id}/channels` | управлять каналами | `{ name, kind, parent_id?, topic? }` | канал |
| `PATCH /channels/{id}` | управлять каналами | `{ name?, topic?, slowmode?, parent_id?, synced?, bitrate?, user_limit? }` | канал |
| `DELETE /channels/{id}` | управлять каналами | — | `{ ok: true }` |
| `PATCH /servers/{id}/channels` | управлять каналами | `{ channels: [{ id, position, parent_id }] }` | все каналы |
| `PUT /channels/{id}/permissions/{target}` | управлять ролями | `{ type: "role" \| "member", allow, deny }` | канал |
| `DELETE /channels/{id}/permissions/{target}` | управлять ролями | — | канал |
| `POST /channels/{id}/typing` | отправлять сообщения | `{}` | `{ ok: true }` — «печатает…» 10 секунд |
| `GET /channels/{id}/pins` | читать историю | — | закреплённые сообщения, новые первыми |

- `kind`: `text`, `voice` или `category`. Названия текстовых каналов приводятся к нижнему
  регистру, пробелы заменяются на `-`.
- `slowmode` — секунды, 0–21600.
- `bitrate` — кбит/с для голосовых, 8–96; `user_limit` — 0 (без ограничения) до 25.
- `target` в особых правах — id роли (у `@everyone` он равен id сервера) или участника.
- `synced: true` возвращает каналу права категории.

## Сообщения

| Запрос | Тело | Ответ |
| --- | --- | --- |
| `GET /channels/{id}/messages?before=&limit=` | — | до 100 [сообщений](objects.md#сообщение), новые в конце |
| `GET /channels/{id}/messages/{mid}` | — | сообщение |
| `POST /channels/{id}/messages` | `{ text, attachments?, reply_to? }` | сообщение, `201` |
| `PATCH /messages/{mid}` | `{ text }` | сообщение (только своё) |
| `DELETE /messages/{mid}` | — | `{ ok: true }` (своё, чужое — «Управлять сообщениями») |
| `PUT /messages/{mid}/reactions/{emoji}` | — | реакции сообщения |
| `DELETE /messages/{mid}/reactions/{emoji}` | — | реакции сообщения |
| `PUT /channels/{id}/pins/{mid}` | — | `{ ok: true }` — нужно «Управлять сообщениями», до 50 закрепов |
| `DELETE /channels/{id}/pins/{mid}` | — | `{ ok: true }` |
| `POST /messages/{mid}/forward` | `{ channel_ids, comment? }` | `{ ids }` — id копий |

- `text` — до 4000 символов. Разметка как в Discord: `**жирный**`, `*курсив*`,
  `__подчёркнутый__`, `~~зачёркнутый~~`, `||спойлер||`, `` `код` ``, блоки ```` ``` ````, цитаты `> `.
  Упоминание — `@username`.
- Пустой `text` можно, если есть вложения.
- `reply_to` — id сообщения из того же канала: ответ с цитатой.
- `emoji` в адресе — в URL-кодировке: `%F0%9F%91%8D` для 👍.
- Пересылка — до 10 чатов, куда бот может писать. Вложения пересылаются вместе с
  сообщением; `comment` уходит отдельным сообщением перед копией.
- Для первых трёх ссылок в тексте сервер через пару секунд добавит превью (`embeds`) и
  пришлёт `MESSAGE_UPDATE`.

```
curl -X POST http://<сервер>:4318/api/v1/channels/$CHANNEL/messages \
  -H "Authorization: Bot $EFIR_TOKEN" -H "Content-Type: application/json" \
  -d '{"text":"**pong**","reply_to":"'$MESSAGE'"}'
```

## Файлы

Сначала загрузка, потом сообщение с `attachments`.

| Запрос | Тело | Ответ |
| --- | --- | --- |
| `PUT /channels/{id}/attachments?name=имя.png` | сам файл, любой `Content-Type` | `{ id, name, kind, size }`, `201` |
| `GET /attachments/{id}` | — | содержимое файла |

`&spoiler=1` отправляет картинку или видео спойлером: в чате они размыты, пока их не откроют. У остальных файлов параметр ничего не меняет.

```
curl -X PUT "http://<сервер>:4318/api/v1/channels/$CHANNEL/attachments?name=report.pdf" \
  -H "Authorization: Bot $EFIR_TOKEN" --data-binary @report.pdf
# → {"id":"…","name":"report.pdf","kind":"file","size":48213}

curl -X POST http://<сервер>:4318/api/v1/channels/$CHANNEL/messages \
  -H "Authorization: Bot $EFIR_TOKEN" -H "Content-Type: application/json" \
  -d '{"text":"Отчёт","attachments":["…"]}'
```

- Нужно право «Прикреплять файлы».
- До 1 ГБ; картинки до 20 МБ. До 10 файлов в сообщении: остальные сервер отбросит.
- `?w=&h=` — размер картинки или видео, если известен: так приложение сразу оставит под
  них место.
- Загруженный файл, который за сутки не попал в сообщение, удаляется.
- Файлы, которые никто не открывал 30 дней, удаляются; у сообщения остаётся вложение
  с `expired: true`.

## Роли и участники

| Запрос | Право | Тело |
| --- | --- | --- |
| `GET /servers/{id}/roles` | — | — |
| `POST /servers/{id}/roles` | управлять ролями | `{ name, color?, hoist?, permissions? }` — новая роль встаёт внизу |
| `PATCH /servers/{id}/roles` | управлять ролями | `{ roles: [{ id, position }] }` — порядок |
| `PATCH /servers/{id}/roles/{rid}` | управлять ролями | `{ name?, color?, hoist?, permissions? }`; у `@everyone` — только `permissions` |
| `DELETE /servers/{id}/roles/{rid}` | управлять ролями | — |
| `PUT /servers/{id}/members/{uid}/roles/{rid}` | управлять ролями | — ответ `{ roles }` |
| `DELETE /servers/{id}/members/{uid}/roles/{rid}` | управлять ролями | — ответ `{ roles }` |
| `DELETE /servers/{id}/members/{uid}` | выгонять | `{ reason? }` |
| `PATCH /servers/{id}/members/{uid}/voice` | отключать микрофон, звук, перемещать | `{ mute?, deaf?, channel_id? }` |
| `GET /servers/{id}/bans` | банить | — |
| `PUT /servers/{id}/bans/{uid}` | банить | `{ reason?, delete_message_seconds? }` |
| `DELETE /servers/{id}/bans/{uid}` | банить | — |

- `color` — `#rrggbb` или `null`; `hoist` — показывать роль отдельной группой в списке участников.
- Роли и участников не ниже своей высшей роли трогать нельзя, выдавать права, которых нет
  у самого бота, — тоже.
- Серверные мьют и заглушение (`mute`, `deaf`) сохраняются между заходами в голосовой.
  `channel_id` переносит в другой голосовой канал, `null` — отключает.
- `delete_message_seconds` — удалить сообщения забаненного за последние секунды, до 604800
  (7 дней).

## Приглашения

| Запрос | Право | Тело |
| --- | --- | --- |
| `GET /servers/{id}/invites` | управлять сервером | — |
| `POST /servers/{id}/invites` | создавать приглашения | `{ max_age?, max_uses? }` |
| `DELETE /invites/{code}` | управлять сервером (своё — без права) | — |

`max_age` — секунды жизни, 0 — бессрочно, по умолчанию 7 дней; `max_uses` — 0 без ограничения.

## Опросы и события

Только в текстовых каналах серверов.

| Запрос | Право | Тело | Ответ |
| --- | --- | --- | --- |
| `POST /channels/{id}/polls` | создавать опросы | `{ question, options, multiple? }` | `{ id, message_id }` |
| `PUT /polls/{id}/votes` | — | `{ options: [индексы] }`, пустой — отменить | [опрос](objects.md#опрос) |
| `POST /polls/{id}/close` | автор или «Управлять сообщениями» | `{}` | опрос |
| `POST /channels/{id}/events` | создавать события | `{ title, starts, description?, voice_channel_id? }` | `{ id, message_id }` |
| `PUT /events/{id}/rsvp` | — | `{ answer: "going" \| "not_going" \| null }` | [событие](objects.md#событие) |

- Вопрос — до 300 символов; вариантов 2–10, до 100 символов, без повторов.
- `starts` — время начала в мс, в будущем и не дальше чем через год.
- Сообщение с опросом или событием приходит как обычное, с полем `poll` или `event`.
- Идущим на событие за 10 минут приходит `EVENT_REMINDER`.

## Прочее

| Запрос | Ответ |
| --- | --- |
| `GET /gateway` | `{ url: "/api/gateway", heartbeat_interval }` |
| `GET /cosmetics` | каталог оформления; `404`, если на сервере его нет |
| `GET /cosmetics/{id}` | предмет каталога; у каждого `assets[]` есть `url` |

Голосовые каналы боты пока не подключают, но видят, кто где сидит (`voice_states` у
сервера и событие `VOICE_STATE_UPDATE`), и модерируют голос.
