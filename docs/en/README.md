# Developer documentation

Efir is open for bots: a bot has its own account, HTTP API, and events over WebSocket, like
Telegram and Discord. The application itself and the server are closed, but everything a bot needs is described here.

- **[Rules](rules.md)** — what is allowed and what is not.
- **[Versions](versions.md)** — what version numbers mean, how stable Bot API `v1` is, how the libraries are versioned.
- **[Bots: quick start](bots/README.md)** — create a bot via `@bot_bot` and start it: Node.js, Python, or curl.
- **[Node.js library](bots/library.md)** — `npm install efir-bot`.
- **[Python library](bots/python.md)** — `pip install efir-bot`.
- **[HTTP API](bots/rest.md)** — every request, for any language, with curl examples.
- **[OpenAPI](bots/openapi.json)** — the same in machine-readable form: for Swagger UI, Postman, client generators.
- **[Event gateway](bots/gateway.md)** — WebSocket and all events.
- **[Objects and permissions](bots/objects.md)** — every field with type, permission bits.
- **[Errors](bots/errors.md)** — all statuses and error texts with reasons.
- **[Troubleshooting](bots/troubleshooting.md)** — bot fails to connect, is silent, insufficient permissions.
- **[Changelog](bots/changelog.md)** — what changed in the API.

Russian version: [../README.md](../README.md).

## Where to get what

| What | Where |
| --- | --- |
| Node.js 22+ library | `npm install efir-bot` |
| Python 3.10+ library | `pip install efir-bot` |
| Other languages | direct HTTP requests: [HTTP API](bots/rest.md) and [event gateway](bots/gateway.md) |
| Examples | [examples](../examples): [Node.js](../examples/nodejs), [Python](../examples/python), [without library](../examples/echo-bot.mjs) |
| Bot token | direct message to `@bot_bot` in the application, command `/newbot` |
| Server address | from the server owner: the same one the application connects to; default port `4318` |

## Platform and a particular server

Efir is a program that can be installed on any server. Everything in this documentation —
the API, limits, permissions, events — is the same on every Efir server. Only the address,
the port (`4318` by default) and how the server is reached depend on a particular
installation.

The main Efir server is currently reachable only inside the Radmin VPN network: the bot,
like the application, must run on a machine connected to it. This is a property of that
installation, not of the API.
