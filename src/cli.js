import { spawnSync } from "node:child_process";

const DEFAULT_TIMEOUT_MS = 45000;

export async function main(argv, io = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const spawn = io.spawnSync ?? spawnSync;
  const env = io.env ?? process.env;

  const parsed = parseArgs(argv);
  if (parsed.command === "help") return stdout.write(helpText());
  if (parsed.command === "auth") {
    const result = runOpenClaw(spawn, env, ["onboard", "--auth-choice", "xai-oauth"], { inherit: true });
    if (result.status !== 0) throw new Error("OpenClaw OAuth onboarding failed");
    return;
  }
  if (parsed.command === "doctor") return runDoctor(spawn, env, stdout);
  if (parsed.command === "search") {
    const result = runSearch(spawn, env, parsed);
    if (!result.ok) {
      stderr.write(formatSearchError(result));
      process.exitCode = 1;
      return;
    }
    stdout.write(formatSearchResult(result.payload, parsed));
    return;
  }
  throw new Error(`unknown command: ${parsed.command}`);
}

export function parseArgs(argv) {
  const args = [...argv];
  if (args[0] === "--help" || args[0] === "-h") return { command: "help" };
  const command = args[0] && !args[0].startsWith("-") ? args.shift() : "search";
  if (["--help", "-h", "help"].includes(command)) return { command: "help" };
  if (["auth", "doctor"].includes(command)) return parseOptions(command, args);
  if (command !== "search") return parseOptions(command, args);
  const parsed = parseOptions("search", args);
  if (!parsed.query) throw new Error("search requires --query <text>");
  return parsed;
}

function parseOptions(command, args) {
  const parsed = { command, query: "", allowedXHandles: [], excludedXHandles: [], fromDate: "", toDate: "", json: false, raw: false, enableImageUnderstanding: false, enableVideoUnderstanding: false, timeoutMs: DEFAULT_TIMEOUT_MS, gatewayUrl: "", gatewayToken: "", openclawBin: "" };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    const next = () => { i += 1; if (i >= args.length) throw new Error(`${arg} requires a value`); return args[i]; };
    if (arg === "--query" || arg === "-q") parsed.query = next();
    else if (arg === "--from-date") parsed.fromDate = next();
    else if (arg === "--to-date") parsed.toDate = next();
    else if (arg === "--handle" || arg === "--allowed-handle") parsed.allowedXHandles.push(...splitCsv(next()));
    else if (arg === "--exclude-handle") parsed.excludedXHandles.push(...splitCsv(next()));
    else if (arg === "--image") parsed.enableImageUnderstanding = true;
    else if (arg === "--video") parsed.enableVideoUnderstanding = true;
    else if (arg === "--json") parsed.json = true;
    else if (arg === "--raw") parsed.raw = true;
    else if (arg === "--timeout") parsed.timeoutMs = parseTimeout(next());
    else if (arg === "--gateway-url") parsed.gatewayUrl = next();
    else if (arg === "--gateway-token") parsed.gatewayToken = next();
    else if (arg === "--openclaw-bin") parsed.openclawBin = next();
    else if (arg === "--help" || arg === "-h") return { command: "help" };
    else if (!arg.startsWith("-") && command === "search" && !parsed.query) parsed.query = arg;
    else throw new Error(`unknown option: ${arg}`);
  }
  return parsed;
}

function splitCsv(value) { return value.split(",").map((entry) => entry.trim().replace(/^@/, "")).filter(Boolean); }
function parseTimeout(value) { const seconds = Number(value); if (!Number.isFinite(seconds) || seconds <= 0) throw new Error("--timeout must be a positive number of seconds"); return Math.round(seconds * 1000); }

function runDoctor(spawn, env, stdout) {
  for (const [label, args] of [["version", ["--version"]], ["gateway", ["gateway", "status"]], ["xai plugin", ["plugins", "inspect", "xai"]]]) {
    const result = runOpenClaw(spawn, env, args, { timeoutMs: 10000 });
    stdout.write(`## ${label}\n${(result.stdout || result.stderr || "(no output)").trim()}\n\n`);
  }
}

export function runSearch(spawn, env, options) {
  const result = runOpenClaw(spawn, env, buildGatewayArgs(options), { timeoutMs: options.timeoutMs, openclawBin: options.openclawBin });
  if (result.status !== 0) return { ok: false, kind: "command", stderr: result.stderr, stdout: result.stdout, status: result.status };
  let rpc;
  try { rpc = JSON.parse(result.stdout); } catch { return { ok: false, kind: "json", stdout: result.stdout }; }
  if (rpc.ok !== true) return { ok: false, kind: "rpc", rpc };
  const output = rpc.output;
  const payload = output?.details ?? parseToolText(output) ?? output;
  return { ok: true, rpc, payload };
}

function buildGatewayArgs(options) {
  const toolArgs = { query: options.query, ...(options.allowedXHandles.length ? { allowed_x_handles: options.allowedXHandles } : {}), ...(options.excludedXHandles.length ? { excluded_x_handles: options.excludedXHandles } : {}), ...(options.fromDate ? { from_date: options.fromDate } : {}), ...(options.toDate ? { to_date: options.toDate } : {}), ...(options.enableImageUnderstanding ? { enable_image_understanding: true } : {}), ...(options.enableVideoUnderstanding ? { enable_video_understanding: true } : {}) };
  return ["gateway", "call", "tools.invoke", "--json", "--timeout", String(options.timeoutMs), "--params", JSON.stringify({ name: "x_search", args: toolArgs }), ...(options.gatewayUrl ? ["--url", options.gatewayUrl] : []), ...(options.gatewayToken ? ["--token", options.gatewayToken] : [])];
}

function runOpenClaw(spawn, env, args, options = {}) {
  const bin = options.openclawBin || env.X_SEARCH_OAUTH_OPENCLAW_BIN || "openclaw";
  const result = spawn(bin, args, { encoding: "utf8", env, stdio: options.inherit ? "inherit" : "pipe", timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS });
  return { status: result.status ?? (result.error ? 1 : 0), stdout: result.stdout ?? "", stderr: result.stderr ?? "", error: result.error };
}

function parseToolText(output) {
  const text = output?.content?.find?.((entry) => entry?.type === "text")?.text;
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { text }; }
}

export function formatSearchResult(payload, options) {
  if (options.raw || options.json) return `${JSON.stringify(payload, null, 2)}\n`;
  const content = payload?.content ?? payload?.text ?? "";
  const citations = Array.isArray(payload?.citations) ? payload.citations : [];
  const meta = [];
  if (payload?.query) meta.push(`query: ${payload.query}`);
  if (payload?.model) meta.push(`model: ${payload.model}`);
  if (typeof payload?.tookMs === "number") meta.push(`took: ${payload.tookMs}ms`);
  const lines = [];
  if (meta.length) lines.push(`# ${meta.join(" | ")}`);
  if (content) lines.push(String(content).trim());
  if (citations.length) { lines.push("", "Citations:"); citations.forEach((citation, index) => lines.push(`${index + 1}. ${citation}`)); }
  return `${lines.join("\n").trim()}\n`;
}

export function formatSearchError(result) {
  if (result.kind === "rpc") {
    const message = result.rpc?.error?.message ?? "OpenClaw gateway rejected x_search";
    const hint = message.includes("Tool not available") ? "\nHint: run `x-search-oauth doctor`, then `x-search-oauth auth` if the xAI plugin is not enabled or signed in.\n" : "\n";
    return `x_search failed: ${message}${hint}`;
  }
  if (result.kind === "json") return `OpenClaw returned non-JSON output:\n${result.stdout}\n`;
  return `OpenClaw command failed${result.status ? ` (${result.status})` : ""}:\n${result.stderr || result.stdout}\n`;
}

export function helpText() {
  return `x-search-oauth - OpenClaw OAuth-backed X/Twitter search\n\nUsage:\n  x-search-oauth search --query "AI agents" [options]\n  xso --query "OpenClaw xAI" --from-date 2026-05-20\n  x-search-oauth auth\n  x-search-oauth doctor\n\nSearch options:\n  -q, --query <text>          X search query\n      --handle <handle>       Restrict to handle; repeat or comma-separate\n      --exclude-handle <h>    Exclude handle; repeat or comma-separate\n      --from-date YYYY-MM-DD  Start date\n      --to-date YYYY-MM-DD    End date\n      --image                 Enable image understanding\n      --video                 Enable video understanding\n      --json                  Print normalized JSON payload\n      --raw                   Same as --json for v0.1\n      --timeout <seconds>     Gateway call timeout, default 45\n      --gateway-url <url>     Override OpenClaw gateway URL\n      --gateway-token <tok>   Override OpenClaw gateway token\n      --openclaw-bin <path>   OpenClaw executable override\n\nAuth stays inside OpenClaw. The CLI calls:\n  openclaw gateway call tools.invoke --params '{"name":"x_search",...}'\n`;
}
