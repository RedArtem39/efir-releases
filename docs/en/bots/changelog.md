# API changelog

API version is `v1`, addresses `/api/v1/…`. Within a version fields and events are added only:
existing ones don't change meaning and don't disappear. If something needs to be removed or changed,
it will appear here in advance and in a new version of addresses.

## 2026-09-26

- Message: the `call` field — a call in a direct chat (bots take no part in calls but see such messages in the history).

- `efir-bot` library for Python (`pip install efir-bot`); library for Node.js — in npm
  (`npm install efir-bot`).
- Attachments: `spoiler=1` on upload sends image or video with spoiler; such
  attachments have `spoiler: true` field.

## 2026-09-25

- Polls and events: `POST /channels/{id}/polls`, `PUT /polls/{id}/votes`,
  `POST /polls/{id}/close`, `POST /channels/{id}/events`, `PUT /events/{id}/rsvp`;
  permissions "Create polls" (`1 << 30`) and "Create events" (`1 << 29`); gateway event
  `EVENT_REMINDER`.
- Forwarding: `POST /messages/{mid}/forward`, `forward` field in message.
- Voice messages and round videos: `variant`, `duration`, `waveform` in attachments.
- `efir-bot` library for Node.js.

## 2026-09-24 — first version

HTTP API `/api/v1`, event gateway, bot creation via `@bot_bot`.
