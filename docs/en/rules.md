# Rules for developers

In short: you can automate only bots, through Bot API. Everything else — manually in
the application.

## Allowed

- Create bots: account via `@bot_bot`, work via `/api/v1` with
  `Authorization: Bot <token>` header and event gateway.
- Write bots in any language. `efir-bot` libraries for Node.js and Python can
  be used, modified, and distributed under MIT license.
- Add a bot to a server by invitation and assign it roles. What it can do is determined by the permissions
  of those roles and channels, like for people.
- Reply in direct messages to those who messaged the bot first.
- Store data needed for the bot to work (settings, counters, queues), and delete
  it upon request by the person.

## Not allowed

- **Automate a regular account** (selfbots): log in with a script, take session cookies,
  call application addresses outside `/api/v1`. Those addresses are only for the application itself, closed to bots,
  and their structure may change without warning.
- **Bypass rate limits**: use multiple bots or tokens for speed, retry without waiting for
  `retry_after`. Rate limits are in [quick start](bots/README.md#limits).
- **Spam**: bulk messages, mass mailing to servers, advertising without server owner consent.
- **Collect others' data**: download message history, member lists, or profiles
  for anything other than the bot's work on that server.
- **Impersonate a person** or official accounts (`@bot_bot` and similar).
- **Modify or reverse-engineer the application**, create third-party clients: the
  [license](../../LICENSE) prohibits this (points 2 and 3).
- **Publish the token.** Token is the bot's password. If leaked, immediately `/token @name_bot` in
  `@bot_bot`: the old one will stop working.

## If the rules are broken

On your own server, the owner decides: they can remove or ban a bot like any other
member.

Efir's owner removes a bot only for illegal or objectively abnormal activity: spam,
hacking, fraud, collection of others' data, harm to people. Bots are not removed simply without such a reason.
