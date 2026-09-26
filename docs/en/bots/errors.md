# Errors

An error is an HTTP status and `{ "error": "text" }`. The text is understandable to humans: you can show it as is. It is better to rely on the status in code, and the text is for humans and logs. `429` also has
`retry_after` (seconds) and header `Retry-After`.

## Statuses

| Status | When | What to do |
| --- | --- | --- |
| `400` | invalid data: empty text, name too long, unknown id in body | fix the request; the error text will say what exactly |
| `401` | token is wrong or revoked via `/token` | get a new token from `@bot_bot` |
| `403` | not enough permissions, bot is not on the server, DM is closed | give the bot a role with the needed permission or check permissions beforehand |
| `404` | no such message, channel, server, role, file | id is outdated or the bot does not see this object |
| `405` | method is not supported at this address | check the method in the [reference](rest.md) |
| `413` | file or request body is too large | files — up to 1 GB, pictures — up to 20 MB, avatar — up to 8 MB, JSON — up to 24 000 bytes |
| `415` | format is not supported or body is not JSON | send `Content-Type: application/json`, for avatar — a picture or video |
| `416` | invalid `Range` header when downloading | fix the range |
| `429` | limit | wait `retry_after` seconds and retry |
| `507` | server storage is full | write to the server owner |

## Texts by topic

### Access

| Status | Text | Cause |
| --- | --- | --- |
| 401 | Неверный токен бота | token has error or revoked |
| 403 | Боты работают только через /api/v1 | request not to `/api/v1/…` |
| 403 | Недоступно для ботов | this address is for humans only |
| 403 | Вы не участник этого сервера | bot is not on the server |
| 403 | Недостаточно прав | missing needed permission on server or in channel |
| 403 | Нет доступа к этому каналу | bot does not see the channel |
| 403 | Нет доступа | bot does not see the channel where the file is |
| 403 | Вы заблокированы на этом сервере | bot is banned |

### Request

| Status | Text | Cause |
| --- | --- | --- |
| 405 | Метод не поддерживается | wrong HTTP method |
| 415 | Ожидается JSON | no `Content-Type: application/json` |
| 413 | Слишком большой запрос | JSON larger than 24 000 bytes |
| 400 | Некорректный JSON | body is not JSON |
| 400 | Некорректный запрос | body is JSON but not an object |
| 400 | Название: от 1 до N символов, Имя: …, Сообщение: … | empty or too long field; N is the maximum |

### Messages

| Status | Text | Cause |
| --- | --- | --- |
| 429 | Слишком много запросов | more than 50 requests per second from bot |
| 403 | Нельзя писать в этом канале | no permission "Send Messages" (Отправлять сообщения) or not a text channel |
| 429 | Слишком часто. Подождите немного | more than 5 messages per 5 seconds to channel or 20 forwards per 10 seconds |
| 429 | Медленный режим: подождите N с | slow mode is enabled on the channel |
| 403 | Нельзя прикреплять файлы в этом канале | no permission "Attach Files" (Прикреплять файлы) |
| 400 | Вложение не найдено | file id not uploaded by this bot to this channel or already in another message |
| 400 | Сообщение для ответа не найдено | `reply_to` is from another channel or deleted |
| 404 | Сообщение не найдено | no such message or bot does not see it |
| 403 | Изменить можно только своё сообщение | editing someone else's |
| 403 | Можно удалить только своё сообщение | deleting someone else's without "Manage Messages" (Управлять сообщениями) |
| 403 | Нельзя ставить реакции в этом канале | no permission "Add Reactions" (Добавлять реакции) |
| 400 | Неизвестная реакция | not a single emoji in the address |
| 400 | Закрепить можно не больше 50 сообщений | already 50 pins in the channel |
| 400 | В этом канале нет сообщений | pin in empty channel |
| 403 | Вы заблокировали этого пользователя | bot blocked the person itself |
| 403 | Сообщение не доставлено: пользователь ограничил, кто может ему писать | person closed their DM |

### Forwarding

| Status | Text | Cause |
| --- | --- | --- |
| 400 | Выберите от 1 до 10 чатов | `channel_ids` is empty or longer than 10 |
| 400 | Сюда нельзя переслать | chat is not a text channel and not a DM |
| 403 | В этот канал нельзя прикреплять файлы | message has attachments, but chat has no permission "Attach Files" (Прикреплять файлы) |

### Files

| Status | Text | Cause |
| --- | --- | --- |
| 400 | Пустой файл | upload body is empty |
| 413 | Файл больше 1 ГБ, Картинка больше 20 МБ, Файл больше 8 МБ | size exceeded; 8 MB for avatar |
| 400 | Голосовые и видеосообщения записываются в WebM | file `variant` is not WebM |
| 404 | Файл не найден | no file, it is deleted or not yet in message |
| 416 | Диапазон вне файла | `Range` is past end of file |
| 507 | Хранилище сервера заполнено | space allocated for files ran out |
| 507 | На диске сервера заканчивается место | less than 5 GB left on disk |

### Profile

| Status | Text | Cause |
| --- | --- | --- |
| 400 | Обо мне: не больше 190 символов | long `bio` |
| 400 | Sorry, this username is invalid. | username is not 5–32 characters, Latin letters, digits and `_`, starting with a letter |
| 400 | A bot's username must end in _bot. | bot username does not end in `_bot` |
| 409 | Это имя пользователя уже занято | username is taken |
| 415 | Этот формат не поддерживается | avatar is not png, jpg, gif, webp, avif, mp4, mov |
| 400 | Некорректная обрезка | invalid `X-Avatar-Crop` |
| 404 | Пользователь не найден | no such user or no shared servers |

### Servers and invites

| Status | Text | Cause |
| --- | --- | --- |
| 404 | Сервер не найден | no server or bot is not on it |
| 400 | Этот сервер нельзя сделать публичным | platform system server |
| 404 | Приглашение недействительно или истекло | code is wrong, expired or used up |
| 404 | Приглашение не найдено | deleting non-existent invite |

### Channels

| Status | Text | Cause |
| --- | --- | --- |
| 404 | Канал не найден | no channel on this server |
| 400 | Не больше 500 каналов | already 500 channels on server |
| 400 | Категория не найдена | `parent_id` is not a category of this server |
| 400 | Ожидается список каналов | `channels` is not an array |
| 400 | Неизвестный канал | in the list a channel of another server |
| 400 | Неверная категория | `parent_id` in list is not a category |
| 403 | Нельзя менять права, которых нет у вас | in `allow` or `deny` permissions the bot does not have |

### Roles and members

| Status | Text | Cause |
| --- | --- | --- |
| 400 | Не больше 250 ролей | already 250 roles on server |
| 404 | Роль не найдена | no role on this server |
| 400 | Роль @everyone нельзя удалить | deleting `@everyone` |
| 400 | Ожидается список ролей | `roles` is not an array |
| 400 | Неизвестная роль | in the list a role of another server |
| 400 | Неверная позиция | position outside roles below bot |
| 403 | Эта роль выше вашей | role is not below the bot's highest role |
| 403 | Нельзя выдать права, которых нет у вас | in `permissions` permissions the bot does not have |
| 404 | Участник не найден | person is not on server |
| 403 | Нельзя выгнать владельца | target is server owner |
| 400 | Чтобы уйти, используйте «Покинуть сервер» | bot is kicking itself |
| 400 | Нельзя заблокировать себя | banning the bot itself |
| 403 | Нельзя заблокировать владельца | banning owner |

### Voice

| Status | Text | Cause |
| --- | --- | --- |
| 403 | Роль участника не ниже вашей | moderating a member with role not below bot |
| 400 | Участник не в голосовом канале этого сервера | moving someone not in voice |
| 404 | Голосовой канал не найден | `channel_id` is not a voice channel of this server |
| 403 | У участника нет доступа к этому каналу | moving to where member has no access |
| 403 | Боты пока не подключаются к голосовым каналам | trying to join voice |

### Polls and events

| Status | Text | Cause |
| --- | --- | --- |
| 400 | Опрос можно создать только в текстовом канале сервера, Событие … | channel is not a text channel of a server |
| 400 | Нужно от 2 до 10 вариантов ответа | wrong number of options |
| 400 | Варианты ответа не должны повторяться | options are the same |
| 404 | Опрос не найден | no poll or bot does not see it |
| 400 | Опрос завершён | voting in closed poll |
| 400 | Неизвестный вариант ответа | option index outside options |
| 400 | В этом опросе можно выбрать только один вариант | multiple indices without `multiple` |
| 403 | Завершить опрос может его автор или модератор | not author and no "Manage Messages" (Управлять сообщениями) |
| 400 | Укажите время начала в будущем | `starts` in past or more than 366 days away |
| 400 | Голосовой канал не найден | `voice_channel_id` is not a voice channel of this server |
| 404 | Событие не найдено | no event or bot does not see it |
| 400 | Ответ: going, not_going или null | wrong `answer` |

### Other

| Status | Text | Cause |
| --- | --- | --- |
| 404 | Каталог косметики недоступен | server has no cosmetics catalog |
| 404 | Предмет не найден | no such item in the catalog |
