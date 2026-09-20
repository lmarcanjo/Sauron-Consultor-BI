#!/usr/bin/env node
/**
 * domain-vocabulary-baseline.mjs
 *
 * Generates the versionable baseline for the Domain Vocabulary Scanner.
 *
 * Usage:
 *   node scripts/domain-vocabulary-baseline.mjs [--dry-run] [--help]
 *
 * Options:
 *   --dry-run   Print what would be written without modifying the baseline file.
 *   --help      Print this help and exit.
 *
 * The baseline is written to:
 *   src/core/quality/baselines/domainVocabularyBaseline.json
 *
 * Rules:
 *   - This script MUST be run explicitly by a developer.
 *   - The CI pipeline MUST NOT run this script (it runs the :check variant).
 *   - Updating the baseline requires a deliberate code review decision.
 *   - New findings are NEVER classified as debt automatically.
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
const SRC_DIR = path.join(ROOT, "src");
const BASELINE_PATH = path.join(
  ROOT,
  "src/core/quality/baselines/domainVocabularyBaseline.json"
);

const SCANNER_VERSION = "3.1.1-R2";
const SCHEMA_VERSION = "1";

const ARGS = process.argv.slice(2);
const DRY_RUN = ARGS.includes("--dry-run");
const HELP = ARGS.includes("--help");

// ─── Help ─────────────────────────────────────────────────────────────────────

if (HELP) {
  console.log(`
domain-vocabulary-baseline.mjs — Generate the versionable domain vocabulary baseline.

USAGE
  node scripts/domain-vocabulary-baseline.mjs [--dry-run] [--help]

OPTIONS
  --dry-run   Print computed baseline without writing to disk.
  --help      Print this message and exit.

OUTPUT FILE
  src/core/quality/baselines/domainVocabularyBaseline.json

RULES
  - Must be run EXPLICITLY by a developer. NEVER by CI.
  - Requires deliberate review before committing.
  - Does NOT classify new findings as debt automatically.
`);
  process.exit(0);
}

// ─── Guard against accidental CI execution ────────────────────────────────────

if (process.env.CI === "true") {
  console.error(
    "\n[BASELINE] ERROR: This script must not run in CI environments.\n" +
    "  CI must use:  npm run quality:domain-vocabulary:check\n" +
    "  Baseline updates require explicit developer action.\n"
  );
  process.exit(2);
}

// ─── Import scanner (via transpile-on-the-fly using tsx) ─────────────────────
// We call the scanner via a small inline Node script to avoid needing to
// compile TypeScript in this plain .mjs script. This ensures the REAL scanner
// is always used and the baseline is never hand-crafted.

console.log("[BASELINE] Loading scanner via tsx...");

const RUNNER_SCRIPT = `
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import {
  scanProductionDomainVocabulary,
  listProductionFiles,
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

const result = {
  regexFlag: REGEX_FLAG,
  nodeVersion: process.version,
  platform: process.platform,
  filesScanned: prodFiles.length,
  linesScanned: totalLines,
  durationMs: Math.round(t1 - t0),
  findings,
  legacyPaths: [...DOMAIN_VOCABULARY_LEGACY_PATHS],
};
process.stdout.write(JSON.stringify(result));
`;

const tmpScript = path.join(ROOT, "_domain-vocab-runner.mts");
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
  console.error("[BASELINE] ERROR: Scanner execution failed.");
  console.error(err.stderr?.toString() || err.message);
  process.exit(1);
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
  legacyPaths,
} = scanResult;

// ─── Sanity guards ────────────────────────────────────────────────────────────

if (!Array.isArray(findings)) {
  console.error("[BASELINE] ERROR: Scanner returned non-array findings.");
  process.exit(1);
}

if (findings.length === 0) {
  console.error(
    "[BASELINE] ERROR: Scanner returned zero findings — this is unexpected.\n" +
    "  A real codebase of this size should contain tracked-debt findings.\n" +
    "  Zero findings may indicate a stub, a wrong root, or a broken matcher.\n" +
    "  Aborting to prevent a falsely clean baseline."
  );
  process.exit(1);
}

// Guard against dummy/fictitious findings
const dummyFindings = findings.filter(
  (f) => f.file === "src/core/quality/dummy.ts" || f.term === "dummy"
);
if (dummyFindings.length > 0) {
  console.error("[BASELINE] ERROR: Scanner returned dummy findings — implementation is corrupted.");
  process.exit(1);
}

// Guard against global src/ authorization
const unauthorizedCount = findings.filter((f) => !f.allowed).length;
if (unauthorizedCount > 0) {
  console.error(
    `[BASELINE] ERROR: ${unauthorizedCount} unauthorized finding(s) detected.\n` +
    "  Resolve violations before generating a new baseline.\n" +
    "  Use the check command to see details: npm run quality:domain-vocabulary:check"
  );
  process.exit(1);
}

// ─── Stable identity ──────────────────────────────────────────────────────────

/**
 * Stable identity for each finding.
 *
 * Based on file + term + category only. Line number is intentionally excluded:
 * refactoring that moves a term to a different line must NOT generate a new
 * finding identity, preventing artificial debt accumulation during refactors.
 *
 * The identity is a truncated SHA-256 of the canonical string, encoded as hex.
 * Collision probability across ~400 findings is negligible (birthday bound).
 */
function stableId(file, term, category) {
  const canonical = `${file}::${term}::${category}`;
  return createHash("sha256").update(canonical, "utf8").digest("hex").slice(0, 16);
}

// ─── Classification ───────────────────────────────────────────────────────────

const ALLOWED_PREFIXES = [
  "src/core/business-domains/",
  "src/core/enterprise-consolidation/",
  "src/core/plugins/",
  "src/core/migrations/",
];
const ALLOWED_INDIVIDUAL_FILES = new Set([
  "src/core/quality/DomainVocabularyScanner.ts",
  "src/core/quality/domainVocabularyAllowlist.ts",
]);
const LEGACY_SET = new Set(legacyPaths);

function classify(file) {
  if (
    ALLOWED_PREFIXES.some((p) => file.startsWith(p)) ||
    ALLOWED_INDIVIDUAL_FILES.has(file)
  ) {
    return "ALLOWED";
  }
  if (LEGACY_SET.has(file)) {
    return "TRACKED_DEBT";
  }
  return "UNAUTHORIZED";
}

// Migration targets for tracked debt (populated from the allowlist comments).
// Each file in DOMAIN_VOCABULARY_LEGACY_PATHS should have a known target.
// Files without explicit targets are listed as "PENDING_INVESTIGATION".
const MIGRATION_TARGETS = {
  "src/components/ClientManagementModal.tsx": "DomainPack category labels (sector enum/labels)",
  "src/components/EngagementModal.tsx": "DomainPack engagement type names",
  "src/core/evidence/EvidenceEngine.ts": "DomainVocabularyCategory enum reference",
  "src/core/semantic/SourceDrivenSemanticEngine.ts": "ConstructionPack.getLabel()",
  "src/modules/consultant-workspace/EngagementService.ts": "ServicesPack vocabulary",
  "src/modules/consultant-workspace/OrganizationService.ts": "AgribusinessPack organization types",
};

// ─── Build baseline ───────────────────────────────────────────────────────────

// Deduplicate by stable identity (same file+term+category appearing on multiple lines
// collapses to one finding in the baseline — line changes don't recreate debt).
const seen = new Map();
for (const f of findings) {
  const id = stableId(f.file, f.term, f.category);
  if (!seen.has(id)) {
    const classification = classify(f.file);
    const entry = {
      file: f.file,
      term: f.term,
      category: f.category,
      classification,
      ruleId: `DOMAIN_VOCAB_${f.category.toUpperCase()}`,
      stableIdentity: id,
    };
    if (classification === "TRACKED_DEBT") {
      entry.reason = "Pre-Domain-Pack vocabulary. Registered as RC-3 technical debt.";
      entry.migrationTarget = MIGRATION_TARGETS[f.file] || "PENDING_INVESTIGATION";
    } else if (classification === "ALLOWED") {
      entry.reason = "File is in an authorized Domain Pack prefix or is a scanner infrastructure file.";
    }
    seen.set(id, entry);
  }
}

const baselineFindings = [...seen.values()].sort((a, b) =>
  a.file.localeCompare(b.file) || a.term.localeCompare(b.term)
);

const allowedCount = baselineFindings.filter((f) => f.classification === "ALLOWED").length;
const debtCount = baselineFindings.filter((f) => f.classification === "TRACKED_DEBT").length;
const unauthorizedBaselineCount = baselineFindings.filter((f) => f.classification === "UNAUTHORIZED").length;

const baseline = {
  schemaVersion: SCHEMA_VERSION,
  generatedAt: new Date().toISOString(),
  scannerVersion: SCANNER_VERSION,
  root: "src",
  nodeVersion,
  platform,
  regexFlag,
  filesScanned,
  linesScanned,
  totalFindings: baselineFindings.length,
  allowedFindings: allowedCount,
  trackedDebtFindings: debtCount,
  unauthorizedFindings: unauthorizedBaselineCount,
  performanceMs: durationMs,
  budgetTargetMs: 3000,
  budgetAlertMs: 4000,
  budgetFailureMs: 5000,
  findings: baselineFindings,
};

// ─── Output ───────────────────────────────────────────────────────────────────

const output = JSON.stringify(baseline, null, 2) + "\n";

if (DRY_RUN) {
  console.log("[BASELINE] DRY RUN — no file written.");
  console.log("[BASELINE] Would write to:", BASELINE_PATH);
  console.log(`[BASELINE] Summary:`);
  console.log(`  Files scanned   : ${filesScanned}`);
  console.log(`  Lines scanned   : ${linesScanned}`);
  console.log(`  Duration        : ${durationMs}ms`);
  console.log(`  Total findings  : ${baselineFindings.length} (deduplicated)`);
  console.log(`  Allowed         : ${allowedCount}`);
  console.log(`  Tracked debt    : ${debtCount}`);
  console.log(`  Unauthorized    : ${unauthorizedBaselineCount}`);
  console.log(`  Regex flag      : ${regexFlag}`);
  console.log(`  Node version    : ${nodeVersion}`);
  process.exit(0);
}

// Check if baseline has changed
let changed = true;
if (fs.existsSync(BASELINE_PATH)) {
  const existing = fs.readFileSync(BASELINE_PATH, "utf8");
  // Compare ignoring generatedAt and performanceMs (they change every run)
  const existingParsed = JSON.parse(existing);
  const existingFindings = JSON.stringify(existingParsed.findings);
  const newFindings = JSON.stringify(baseline.findings);
  if (existingFindings === newFindings) {
    changed = false;
  }
}

fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
fs.writeFileSync(BASELINE_PATH, output, "utf8");

console.log("[BASELINE] Baseline written to:", path.relative(ROOT, BASELINE_PATH));
console.log(`[BASELINE] Summary:`);
console.log(`  Files scanned   : ${filesScanned}`);
console.log(`  Lines scanned   : ${linesScanned}`);
console.log(`  Duration        : ${durationMs}ms`);
console.log(`  Total findings  : ${baselineFindings.length} (deduplicated)`);
console.log(`  Allowed         : ${allowedCount}`);
console.log(`  Tracked debt    : ${debtCount}`);
console.log(`  Unauthorized    : ${unauthorizedBaselineCount}`);
console.log(`  Regex flag      : ${regexFlag}`);
console.log(`  Node version    : ${nodeVersion}`);
console.log(`  Changed         : ${changed ? "YES — commit this file" : "no change"}`);
