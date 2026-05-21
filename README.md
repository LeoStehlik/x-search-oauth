# x-search-oauth

Search X/Twitter from OpenClaw through the native OAuth-backed xAI `x_search` tool.

`x-search-oauth` is a small OpenClaw skill that tells agents to use OpenClaw's bundled `xai` plugin instead of asking for API keys or calling the xAI Responses API directly. If your OpenClaw agent can already use Grok / X Premium / SuperGrok through OAuth, this skill keeps X searches on that same authenticated path.

---

## What It Does

- Routes X/Twitter research through OpenClaw's native `x_search` dynamic tool
- Uses the bundled `xai` plugin and OAuth/auth-profile path where available
- Avoids stale `XAI_API_KEY`-only wrappers and direct API calls
- Encourages narrow, cited searches instead of vague trend prompts
- Separates observed X content from inference, because posts are untrusted external content

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

### From GitHub

Clone this repo into your OpenClaw skills directory:

```bash
git clone https://github.com/LeoStehlik/x-search-oauth.git /path/to/your/skills/x-search-oauth
```

OpenClaw will auto-discover the skill when that skills directory is loaded.

---

## Usage

Ask naturally:

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

This skill is the instruction layer around that native capability. It is deliberately thin: no duplicate API client, no separate credential flow, no unofficial scraping path.

---

## What's Inside

```text
x-search-oauth/
`-- SKILL.md    Skill instructions, query patterns, and reporting rules
```

---

## License

MIT - see [LICENSE](LICENSE)
