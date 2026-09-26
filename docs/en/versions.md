# Versions

Efir has three things with separate versions: the application, Bot API, and bot libraries.
They change independently.

## Application: `X.Y.Z`

A version like `0.5.5` — the application version for Windows (shell: window, updates, overlay,
game detection). The chat interface comes from the server and is updated without a new application
version.

| Part | When it grows | How it arrives |
| --- | --- | --- |
| `Z` — patch | fixes and small features in the shell | by update within the application: downloads and installs on restart, without installer |
| `Y` — minor | new Electron version, noticeable changes, changes after which you cannot roll back to the previous version without installer | by update through installer, also without questions and windows |
| `X` — major | `0` — while Efir is in active development; `1.0` will be released when the application and protocol stabilize | — |

- You can roll back from settings (Updates («Обновления»)) to versions with the same Electron; to others —
  with the installer from [releases](../../../../releases).
- Updates are signed: the application installs only what is signed with the developer key.
- While `X` is `0`, the protocol between the application and server can change in any version.
  Server and application are updated together, so this does not affect users.

## Bot API: `v1`

Version in the address: `/api/v1/…`. Inside `v1`:

- fields in responses, events, requests and optional parameters are only **added**;
- existing fields do not change type and meaning and do not disappear;
- new restrictions (limits, lengths) can only appear if the server cannot be protected without them;
  they will appear in the [changelog](bots/changelog.md) on the same day.

Incompatible changes will be released as `v2` at new addresses (`/api/v2/…`), and `v1` will keep
working alongside for a while. When `v2` appears and how long `v1` lives after that is not
decided yet; it will be announced in advance in the changelog and in the release.

What `v1` does not promise: the order of fields in JSON, error messages (rely on the status), and that
the response has no fields beyond those described.

## `efir-bot` libraries: semantic versioning

Libraries for Node.js (npm) and Python (PyPI) are numbered according to [SemVer](https://semver.org/):

| Part | When it grows |
| --- | --- |
| major | bot code will need to change: method, event, parameter is removed or renamed |
| minor | new methods, events, parameters; old code works as before |
| patch | fixes without changes in how the library is used |

Library versions are not linked to the application version: `efir-bot 1.x` works with Bot API `v1`.

## Releases

Each release has the same description:

- **Added** — new features;
- **Changed** — what works differently;
- **Fixed** — bugs;
- **Security** — everything related to protection;
- **Known issues** — what is still wrong and how to work around it;
- **SHA-256** — installer checksum.

Empty sections are not written.

