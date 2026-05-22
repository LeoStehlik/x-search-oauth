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

## Optional TweetClaw Companion

Use native `x_search` first for OAuth-backed X/Twitter search. If an OpenClaw workflow needs broader account-backed X/Twitter automation, install [TweetClaw](https://github.com/Xquik-dev/tweetclaw) as a separate OpenClaw plugin:

```bash
openclaw plugins install @xquik/tweetclaw
```

TweetClaw is useful for search tweet replies, follower export, user lookup, media upload and download, direct messages, monitor tweets, webhooks, giveaway draws, and reviewed post or reply actions. Keep `x-search-oauth` responsible for cited search results, then pass reviewed TweetClaw source context such as tweet URLs, IDs, handles, capture dates, search queries, and metrics into your report.

Do not paste API keys, cookies, or raw private account data into prompts. Store TweetClaw credentials in OpenClaw plugin config.

---

## What's Inside

```text
x-search-oauth/
`-- SKILL.md    Skill instructions, query patterns, and reporting rules
```

---

## License

MIT - see [LICENSE](LICENSE)
