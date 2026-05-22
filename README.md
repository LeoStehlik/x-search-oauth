# x-search-oauth

Search X/Twitter from the command line through OpenClaw's native OAuth-backed xAI `x_search` tool.

`x-search-oauth` started as a small OpenClaw skill. v0.1 now also ships a JavaScript CLI that calls OpenClaw's Gateway tool invocation surface, so X auth stays inside OpenClaw instead of being reimplemented as a separate API-key or scraping path.

---

## What It Does

- Runs `x_search` through OpenClaw's bundled `xai` plugin
- Uses OpenClaw's OAuth/auth-profile setup for Grok / X Premium / SuperGrok where available
- Provides a CLI for X search with handle/date/media filters
- Prints readable output by default and JSON with `--json`
- Avoids stale `XAI_API_KEY`-only wrappers and direct xAI Responses API calls
- Keeps X posts treated as untrusted external content

---

## Installation

### OpenClaw / ClawHub

```bash
openclaw skills install x-search-oauth
```

Make sure the bundled xAI plugin is enabled and signed in:

```bash
openclaw plugins enable xai
openclaw onboard --auth-choice xai-oauth
```

### CLI from GitHub

```bash
git clone https://github.com/LeoStehlik/x-search-oauth.git
cd x-search-oauth
npm test
npm link
```

That installs two commands:

```bash
x-search-oauth --help
xso --help
```

---

## CLI Usage

Search X:

```bash
xso --query "OpenClaw xAI OAuth" --from-date 2026-05-20
```

Restrict to handles:

```bash
xso --query "OpenClaw 2026.5.19" --handle openclaw --from-date 2026-05-20
```

Print JSON:

```bash
xso --query "AI coding agents" --from-date 2026-05-20 --json
```

Run OpenClaw OAuth onboarding:

```bash
x-search-oauth auth
```

Inspect local OpenClaw readiness:

```bash
x-search-oauth doctor
```

The CLI calls OpenClaw like this:

```bash
openclaw gateway call tools.invoke --json --params '{"name":"x_search","args":{"query":"..."}}'
```

Supported v0.1 options:

```text
-q, --query <text>          X search query
    --handle <handle>       Restrict to handle; repeat or comma-separate
    --exclude-handle <h>    Exclude handle; repeat or comma-separate
    --from-date YYYY-MM-DD  Start date
    --to-date YYYY-MM-DD    End date
    --image                 Enable image understanding
    --video                 Enable video understanding
    --json                  Print normalized JSON payload
    --raw                   Same as --json for v0.1
    --timeout <seconds>     Gateway call timeout, default 45
    --gateway-url <url>     Override OpenClaw gateway URL
    --gateway-token <tok>   Override OpenClaw gateway token
    --openclaw-bin <path>   OpenClaw executable override
```

---

## Skill Usage

Ask naturally inside OpenClaw:

```text
Use x-search-oauth to search recent AI agent posts on X.
```

```text
Search X for OpenClaw xAI OAuth announcements from the last 24 hours.
```

```text
Find recent X posts about Claude Code, Codex, Cursor, and agent workflows.
```

The skill tells the agent to prefer multiple narrow searches, use date/handle filters when useful, cite returned X status URLs, and discard no-citation summaries.

---

## Why This Exists

OpenClaw 2026.5.19 includes a bundled `xai` plugin that exposes `x_search` as a native dynamic tool. That means agents can search X through the same authenticated OpenClaw/xAI path used for Grok, SuperGrok, or X Premium access.

This repo is the instruction layer and CLI wrapper around that native capability. It is deliberately thin: no duplicate API client, no separate credential store, no unofficial scraping path.

---

## What's Inside

```text
x-search-oauth/
|-- bin/x-search-oauth.js  CLI entrypoint
|-- src/cli.js             argument parsing, OpenClaw invocation, formatting
|-- test/cli.test.js       Node test suite with mocked OpenClaw calls
|-- SKILL.md               OpenClaw skill instructions
`-- README.md
```

---

## Verification

```bash
npm test
```

The test suite verifies argument parsing, the exact `tools.invoke` request shape, output formatting, and the setup hint when `x_search` is unavailable.

---

## License

MIT - see [LICENSE](LICENSE)
