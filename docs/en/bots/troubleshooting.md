# Troubleshooting

## Bot fails to connect

**`401`, «Неверный токен бота».** Token contains a typo or was reset via
`/token @name_bot` command to `@bot_bot`: after reset, the old one stops working immediately. Get a
new one. Libraries in this case stop with `EfirError`, `status` 401, and do not
reconnect.

**Connection is not established (timeout, "connection refused").** Efir server is accessible
only inside the Radmin VPN network. The machine where the bot runs must be in this network. Check:

```
curl http://<сервер>:4318/api/v1/gateway
```

Response `{"error":"…"}` with status 401 — server is accessible, the issue is with the token. Timeout — no
network to the server.

**`403`, «Боты работают только через /api/v1».** The bot accessed the application address instead of
Bot API. All bot addresses start with `/api/v1/`.

## Bot is silent

**Bot does not see messages in the channel.** Need View channels («Просматривать каналы») and Read history («Читать историю»)
permissions in this channel. Check channel-specific permissions: a ban for `@everyone` or for the bot's role
overrides server permissions. Bot's final permissions in the channel — field `permissions` in
`GET /channels/{id}`.

**Commands do not trigger.** A command is a message that starts with a prefix (default
`/`). `/ping@other_bot` is addressed to another bot, and yours will skip it. The bot does not receive
its own messages at all.

**Bot does not respond in direct message.** The bot cannot message a person first: a direct chat appears
when the person messages the bot. If the person closed the chat or blocked the bot, the response returns
`403`.

**Bot responds with delay or incompletely.** Likely a rate limit: 5 messages per 5 seconds in
one channel and 50 requests per second per bot. Libraries wait and retry automatically (event
`rateLimit` / `rate_limit`). In your own code over HTTP, wait `retry_after` seconds after `429`.

## Insufficient permissions

**`403`, «Недостаточно прав», although the role with permission is assigned.** Check:

1. Permission is blocked by channel-specific permissions.
2. Action on a role or member not below the bot's highest role: raise the bot's role higher.
3. Bot tries to grant a permission it does not have itself.

**Cannot remove or ban the owner** — by design.

## Files

**`413` on upload.** Files up to 1 GB, images up to 20 MB, avatar up to 8 MB.

**File uploaded, but message says «Вложение не найдено».** Attachment id works only
in the channel where the file was uploaded, only for this bot, and only once.

**Attachment has `expired: true`.** No one opened the file for 30 days, and the server deleted it.
Attachment without a message is deleted after 24 hours.

## Libraries

**Node.js: «Нужен Node.js 22 или новее».** Library needs built-in `WebSocket` from
Node.js 22+.

**Python: `RuntimeError: no running event loop` or nothing happens.** `bot.start()` is
a coroutine: call it via `await` inside `asyncio` or use `bot.run()`.

**Exception in handler "disappeared".** Libraries do not crash the bot due to handler
error: it goes to the `error` event, and if no one is subscribed to it — to the console
(Node.js) or to the `efir_bot` logger (Python). Subscribe to `error` to see them.
