import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const patterns = [
  /sb_secret_[A-Za-z0-9_-]{12,}/,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/,
  /gh[pousr]_[A-Za-z0-9]{20,}/,
];
const known = [process.env.SUPABASE_ANON_KEY].filter(Boolean);
const hits = [];

function inspect(text, location) {
  if (patterns.some(pattern => pattern.test(text)) ||
      known.some(value => text.includes(value))) hits.push(location);
}

const files = execFileSync("git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" }).split("\0").filter(Boolean);

for (const file of new Set(files)) {
  const content = readFileSync(file);
  if (!content.includes(0)) inspect(content.toString("utf8"), file);
}

const objects = execFileSync("git", ["rev-list", "--objects", "--all"],
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
  .split("\n").filter(Boolean);

for (const entry of objects) {
  const hash = entry.split(" ")[0];
  const type = execFileSync("git", ["cat-file", "-t", hash],
    { encoding: "utf8" }).trim();
  if (type !== "blob") continue;
  const content = execFileSync("git", ["cat-file", "blob", hash],
    { maxBuffer: 64 * 1024 * 1024 });
  if (!content.includes(0)) {
    inspect(content.toString("utf8"), `history blob ${hash}`);
  }
}

const ignored = execFileSync("git", ["check-ignore", ".env.local"],
  { encoding: "utf8" }).trim();

const trackedEnv = files.filter(file =>
  /(^|\/)\.env/.test(file) && !file.endsWith(".env.example"));
if (trackedEnv.length) hits.push(...trackedEnv);

const result = [
  `Scanned ${new Set(files).size} project files and reachable Git history blobs.`,
  `Ignored local config: ${ignored}`,
  hits.length ? `REVIEW REQUIRED:\n${[...new Set(hits)].join("\n")}`
    : "PASS: no matches for scanned secret patterns or configured API key.",
  "Pattern-based scan; not a guarantee that every possible secret is detected.",
].join("\n");

writeFileSync("docs/evidence/secret-scan.txt", result);
console.log(result);
if (hits.length) process.exitCode = 1;