import test from "node:test";
import assert from "node:assert/strict";
import { formatSearchError, formatSearchResult, parseArgs, runSearch } from "../src/cli.js";

test("parseArgs accepts compact search options", () => {
  const parsed = parseArgs(["--query", "OpenClaw xAI", "--handle", "openclaw,@grok", "--from-date", "2026-05-20", "--json"]);
  assert.equal(parsed.command, "search");
  assert.equal(parsed.query, "OpenClaw xAI");
  assert.deepEqual(parsed.allowedXHandles, ["openclaw", "grok"]);
  assert.equal(parsed.fromDate, "2026-05-20");
  assert.equal(parsed.json, true);
});

test("runSearch invokes OpenClaw tools.invoke with x_search args", () => {
  let captured;
  const spawn = (_bin, args) => {
    captured = args;
    return { status: 0, stdout: JSON.stringify({ ok: true, output: { details: { query: "OpenClaw xAI", model: "grok-test", tookMs: 12, content: "Observed result", citations: ["https://x.com/openclaw/status/1"] } } }), stderr: "" };
  };
  const result = runSearch(spawn, {}, parseArgs(["--query", "OpenClaw xAI", "--handle", "openclaw"]));
  assert.equal(result.ok, true);
  assert.deepEqual(captured.slice(0, 4), ["gateway", "call", "tools.invoke", "--json"]);
  const params = JSON.parse(captured[captured.indexOf("--params") + 1]);
  assert.equal(params.name, "x_search");
  assert.equal(params.args.query, "OpenClaw xAI");
  assert.deepEqual(params.args.allowed_x_handles, ["openclaw"]);
});

test("formatSearchResult prints content and citations", () => {
  const text = formatSearchResult({ query: "q", model: "m", tookMs: 10, content: "Body", citations: ["https://x.com/a/status/1"] }, { json: false, raw: false });
  assert.match(text, /# query: q \| model: m \| took: 10ms/);
  assert.match(text, /Body/);
  assert.match(text, /1\. https:\/\/x.com\/a\/status\/1/);
});

test("formatSearchError gives OpenClaw setup hint when x_search is unavailable", () => {
  const text = formatSearchError({ kind: "rpc", rpc: { error: { message: "Tool not available: x_search" } } });
  assert.match(text, /x-search-oauth doctor/);
  assert.match(text, /x-search-oauth auth/);
});
