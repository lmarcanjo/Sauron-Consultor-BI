#!/usr/bin/env node
/**
 * domain-vocabulary-check.mjs
 *
 * CI gate: compare the current scan against the versionable baseline.
 * This script NEVER modifies the baseline — it only reads and validates.
 *
 * Usage:
 *   node scripts/domain-vocabulary-check.mjs [--report-path=<file>]
 *
 * Exit codes:
 *   0  All checks passed (no new violations, baseline is consistent)
 *   1  New unauthorized finding detected → CI must block merge
 *   2  Baseline inconsistency (file missing, corrupted, zero-scan) → CI must block merge
 *   3  Performance budget exceeded → CI warning (non-blocking by default, adjust as needed)
 *
 * Artifacts:
 *   Writes domain-vocabulary-report.json to the workspace root (or --report-path).
 *   This file is NOT versioned — it is a CI artefact that changes every run.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ─── Configuration ────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BASELINE_PATH = path.join(
  ROOT,
  "src/core/quality/baselines/domainVocabularyBaseline.json"
);

const ARGS = process.argv.slice(2);
const REPORT_ARG = ARGS.find((a) => a.startsWith("--report-path="));
const REPORT_PATH = REPORT_ARG
  ? path.resolve(REPORT_ARG.split("=")[1])
  : path.join(ROOT, "domain-vocabulary-report.json");

// ─── Load baseline ────────────────────────────────────────────────────────────

if (!fs.existsSync(BASELINE_PATH)) {
  const msg =
    "[CHECK] ERROR: Baseline file not found.\n" +
    `  Expected: ${BASELINE_PATH}\n` +
    "  Run: npm run quality:domain-vocabulary:baseline\n" +
    "  Then commit the baseline file.";
  console.error(msg);
  writeReport({ error: "BASELINE_NOT_FOUND", message: msg });
  process.exit(2);
}

let baseline;
try {
  baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
} catch (err) {
  const msg = `[CHECK] ERROR: Baseline file is corrupted or invalid JSON.\n  ${err.message}`;
  console.error(msg);
  writeReport({ error: "BASELINE_CORRUPTED", message: msg });
  process.exit(2);
}

if (!baseline.findings || !Array.isArray(baseline.findings)) {
  const msg = "[CHECK] ERROR: Baseline has no findings array — file may be corrupted.";
  console.error(msg);
  writeReport({ error: "BASELINE_CORRUPTED", message: msg });
  process.exit(2);
}

// ─── Run the real scanner ─────────────────────────────────────────────────────

console.log("[CHECK] Running domain vocabulary scanner...");

const RUNNER_SCRIPT = `
import path from "node:path";
import fs from "node:fs";
import {
  scanProductionDomainVocabulary,
  listProductionFiles,
  findUnauthorizedDomainVocabulary,
  REGEX_FLAG,
} from "${ROOT}/src/core/quality/DomainVocabularyScanner.ts";
import { DOMAIN_VOCABULARY_LEGACY_PATHS } from "${ROOT}/src/core/quality/domainVocabularyAllowlist.ts";

const t0 = performance.now();
const findings = scanProductionDomainVocabulary();
const t1 = performance.now();

const prodFiles = listProductionFiles(path.join("${ROOT}", "src"));
let totalLines = 0;
for (const f of prodFiles) {
  try {
    const src = fs.readFileSync(f, "utf8");
    totalLines += src.split(/\\r?\\n/).length;
  } catch {}
}

process.stdout.write(JSON.stringify({
  regexFlag: REGEX_FLAG,
  nodeVersion: process.version,
  platform: process.platform,
  filesScanned: prodFiles.length,
  linesScanned: totalLines,
  durationMs: Math.round(t1 - t0),
  findings,
  unauthorizedFindings: findUnauthorizedDomainVocabulary(findings),
  legacyPaths: [...DOMAIN_VOCABULARY_LEGACY_PATHS],
}));
`;

const tmpScript = path.join(ROOT, "_domain-vocab-check-runner.mts");
fs.writeFileSync(tmpScript, RUNNER_SCRIPT, "utf8");

let scanResult;
try {
  const raw = execFileSync(
    "npx",
    ["tsx", tmpScript],
    { cwd: ROOT, maxBuffer: 50 * 1024 * 1024 }
  );
  scanResult = JSON.parse(raw.toString("utf8"));
} catch (err) {
  const msg = "[CHECK] ERROR: Scanner execution failed.\n" + (err.stderr?.toString() || err.message);
  console.error(msg);
  writeReport({ error: "SCANNER_FAILED", message: msg });
  process.exit(2);
} finally {
  fs.rmSync(tmpScript, { force: true });
}

const {
  regexFlag,
  nodeVersion,
  platform,
  filesScanned,
  linesScanned,
  durationMs,
  findings,
  unauthorizedFindings,
  legacyPaths,
} = scanResult;

// ─── Integrity guards ─────────────────────────────────────────────────────────

// Guard: zero findings is suspicious for a real codebase
if (findings.length === 0) {
  const msg =
    "[CHECK] ERROR: Scanner returned zero findings.\n" +
    "  A codebase of this size should have tracked-debt findings.\n" +
    "  This may indicate a stub, wrong root, or broken matcher.";
  console.error(msg);
  writeReport({ error: "ZERO_FINDINGS", message: msg, durationMs, filesScanned });
  process.exit(2);
}

// Guard: dummy finding detected
const dummyFindings = findings.filter(
  (f) => f.file === "src/core/quality/dummy.ts" || f.term === "dummy"
);
if (dummyFindings.length > 0) {
  const msg = "[CHECK] ERROR: Scanner returned dummy/fictitious findings — implementation is corrupted.";
  console.error(msg);
  writeReport({ error: "DUMMY_FINDINGS", dummyFindings, message: msg });
  process.exit(2);
}

// ─── Stable identity (must match baseline script exactly) ────────────────────

function stableId(file, term, category) {
  const canonical = `${file}::${term}::${category}`;
  return createHash("sha256").update(canonical, "utf8").digest("hex").slice(0, 16);
}

// Deduplicate current scan by stable identity
const currentById = new Map();
for (const f of findings) {
  const id = stableId(f.file, f.term, f.category);
  if (!currentById.has(id)) currentById.set(id, f);
}

const baselineById = new Map();
for (const f of baseline.findings) {
  baselineById.set(f.stableIdentity, f);
}

// ─── Diff analysis ────────────────────────────────────────────────────────────

const newFindings = [];
const removedFindings = [];
const newUnauthorized = [];
const newDebt = [];

// New findings (in current, not in baseline)
for (const [id, f] of currentById) {
  if (!baselineById.has(id)) {
    const classification = f.allowed ? "ALLOWED_OR_DEBT" : "UNAUTHORIZED";
    newFindings.push({ ...f, stableIdentity: id, classification });
    if (!f.allowed) {
      newUnauthorized.push({ ...f, stableIdentity: id });
    } else {
      // allowed=true but not in baseline — new tracked debt (if in LEGACY_PATHS) or new domain pack file
      const isLegacy = new Set(legacyPaths).has(f.file);
      if (isLegacy) newDebt.push({ ...f, stableIdentity: id });
    }
  }
}

// Removed findings (in baseline, not in current)
for (const [id, f] of baselineById) {
  if (!currentById.has(id)) {
    removedFindings.push(f);
  }
}

// ─── Report findings ──────────────────────────────────────────────────────────

let exitCode = 0;

console.log("\n[CHECK] ═══════════════════════════════════════════════════════");
console.log(`[CHECK] Domain Vocabulary Governance — Scan Results`);
console.log("[CHECK] ═══════════════════════════════════════════════════════");
console.log(`  Node version     : ${nodeVersion}`);
console.log(`  Regex flag       : ${regexFlag}`);
console.log(`  Files scanned    : ${filesScanned}`);
console.log(`  Lines scanned    : ${linesScanned}`);
console.log(`  Duration         : ${durationMs}ms (budget: <3000ms target, <5000ms limit)`);
console.log(`  Total findings   : ${findings.length} raw, ${currentById.size} deduplicated`);
console.log(`  Baseline size    : ${baseline.findings.length} findings`);
console.log(`  New findings     : ${newFindings.length}`);
console.log(`  Removed findings : ${removedFindings.length}`);

// Performance check
const perfBudget = baseline.budgetFailureMs ?? 5000;
const perfAlert = baseline.budgetAlertMs ?? 4000;
if (durationMs > perfBudget) {
  console.log(`\n[CHECK] ⚠️  PERFORMANCE BUDGET EXCEEDED: ${durationMs}ms > ${perfBudget}ms limit`);
  exitCode = 3;
} else if (durationMs > perfAlert) {
  console.log(`\n[CHECK] ⚠️  Performance alert: ${durationMs}ms > ${perfAlert}ms alert threshold`);
}

// Removed findings (improvements)
if (removedFindings.length > 0) {
  console.log(`\n[CHECK] ✅ ${removedFindings.length} finding(s) REMOVED (debt paid or code migrated):`);
  for (const f of removedFindings) {
    console.log(`   ✅ REMOVED: ${f.file} | term: ${f.term} | id: ${f.stableIdentity}`);
  }
}

// New debt (allowed but not in baseline)
if (newDebt.length > 0) {
  console.log(`\n[CHECK] ⚠️  ${newDebt.length} new TRACKED DEBT finding(s) (allowed but unregistered in baseline):`);
  for (const f of newDebt) {
    console.log(`   ⚠️  NEW DEBT: ${f.file}:${f.line} | term: ${f.term}`);
  }
  console.log(`\n  To accept this debt, run: npm run quality:domain-vocabulary:baseline`);
  console.log(`  Then review and commit the updated baseline.`);
  exitCode = Math.max(exitCode, 1);
}

// Unauthorized violations — BLOCKING
if (newUnauthorized.length > 0) {
  exitCode = 1;
  console.log(`\n[CHECK] ❌ ${newUnauthorized.length} NEW UNAUTHORIZED VIOLATION(S) — BUILD BLOCKED:`);
  for (const f of newUnauthorized) {
    console.log(`   ❌ VIOLATION: ${f.file}:${f.line} | term: ${f.term} | category: ${f.category}`);
  }
  console.log(`\n  These files must NOT use domain vocabulary outside of Domain Pack directories.`);
  console.log(`  Options:`);
  console.log(`    1. Move the vocabulary to the appropriate Domain Pack.`);
  console.log(`    2. If this is truly legacy debt, add the file to domainVocabularyAllowlist.ts,`);
  console.log(`       then update the baseline: npm run quality:domain-vocabulary:baseline`);
}

if (newUnauthorized.length === 0 && newDebt.length === 0) {
  console.log(`\n[CHECK] ✅ No new violations or unregistered debt. Baseline is current.`);
}

// ─── Write CI report ──────────────────────────────────────────────────────────

const report = {
  generatedAt: new Date().toISOString(),
  nodeVersion,
  platform: os.platform(),
  regexFlag,
  baselineFile: path.relative(ROOT, BASELINE_PATH),
  baselineGeneratedAt: baseline.generatedAt,
  filesScanned,
  linesScanned,
  durationMs,
  budgetTargetMs: baseline.budgetTargetMs ?? 3000,
  budgetAlertMs: baseline.budgetAlertMs ?? 4000,
  budgetFailureMs: baseline.budgetFailureMs ?? 5000,
  performanceStatus: durationMs > perfBudget ? "OVER_BUDGET" : durationMs > perfAlert ? "ALERT" : "OK",
  totalRawFindings: findings.length,
  totalDeduplicatedFindings: currentById.size,
  baselineFindings: baseline.findings.length,
  newFindings: newFindings.length,
  newUnauthorizedFindings: newUnauthorized.length,
  newDebtFindings: newDebt.length,
  removedFindings: removedFindings.length,
  status: exitCode === 0 ? "PASSED" : exitCode === 3 ? "PERFORMANCE_OVER_BUDGET" : "FAILED",
  violations: newUnauthorized,
  newDebtDetails: newDebt,
  removedDebtDetails: removedFindings,
};

writeReport(report);
console.log(`\n[CHECK] Report written to: ${path.relative(ROOT, REPORT_PATH)}`);
console.log("[CHECK] ═══════════════════════════════════════════════════════\n");

process.exit(exitCode);

// ─── Helper ───────────────────────────────────────────────────────────────────

function writeReport(data) {
  try {
    fs.writeFileSync(REPORT_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
  } catch {
    // Best-effort; don't crash the check script if report write fails
  }
}
