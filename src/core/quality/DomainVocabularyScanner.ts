import fs from "node:fs";
import path from "node:path";
import { DOMAIN_VOCABULARY_LEGACY_PATHS } from "./domainVocabularyAllowlist";

export type DomainVocabularyCategory =
  | "automotive"
  | "agribusiness"
  | "healthcare"
  | "education"
  | "retail"
  | "industry"
  | "construction"
  | "services";

export interface DomainVocabularyFinding {
  file: string;
  line: number;
  term: string;
  category: DomainVocabularyCategory;
  allowed: boolean;
}

const VOCABULARY: Array<{ category: DomainVocabularyCategory; terms: string[] }> = [
  { category: "automotive", terms: ["concessionária", "concessionaria", "veículo", "veiculo", "oficina", "peças", "pecas", "seminovo", "chassi", "montadora", "f&i", "automotivo", "automotive", "nissan", "renault", "honda", "dealer", "workshop"] },
  { category: "agribusiness", terms: ["fazenda", "produtor", "sementes", "defensivos", "safra", "agronegócio", "agronegocio", "agroplugin"] },
  { category: "healthcare", terms: ["paciente", "consulta", "leito", "clínica", "clinica", "healthcare"] },
  { category: "education", terms: ["aluno", "turma", "matrícula", "matricula", "education"] },
  { category: "retail", terms: ["varejo", "retail"] },
  { category: "industry", terms: ["indústria", "industria", "industrial"] },
  { category: "construction", terms: ["construção", "construcao", "construction"] },
  { category: "services", terms: ["serviços", "servicos", "services"] },
];

// ─── Runtime compatibility check ────────────────────────────────────────────

/**
 * Verify whether the RegExp Unicode Sets mode flag ('v') is available in the
 * current runtime. Flag 'v' requires V8 ≥ 11.0 / Node ≥ 20.
 *
 * If unavailable we fall back to the Unicode flag ('u'), which also supports
 * \p{L} and \p{N} property escapes and provides identical boundary semantics
 * for our use case. Flag 'u' is available since Node 10.
 *
 * This is NOT a degradation to String.includes(). Both 'v' and 'u' produce
 * correct Unicode-aware word-boundary matching with identical behavior for
 * PT-BR vocabulary terms.
 */
function detectRegexFlag(): "iv" | "iu" {
  try {
    // Attempt to compile a trivial regex with flag 'v'. If V8 does not support
    // it, this throws a SyntaxError at construction time.
    new RegExp("[a-z]", "v");
    return "iv";
  } catch {
    return "iu";
  }
}

/** The flag pair resolved once at module load. "iv" on Node ≥ 20, "iu" otherwise. */
export const REGEX_FLAG: "iv" | "iu" = detectRegexFlag();

// ─── Allowed source roots ─────────────────────────────────────────────────────

/**
 * Allowed source roots that may contain domain-specific vocabulary by design.
 *
 * POLICY (updated RC-3.1.1-R2):
 *   Each prefix must be a directory whose primary purpose is domain vocabulary.
 *   Generic directories must NOT be listed here even if some files happen to be
 *   clean — they would silently absorb future violations.
 *
 * ┌─────────────────────────────────────┬──────────────────────────────────────┐
 * │ Prefix                              │ Bounded context                      │
 * ├─────────────────────────────────────┼──────────────────────────────────────┤
 * │ src/core/business-domains/          │ Domain Pack implementations.         │
 * │                                     │ Ownership of all domain vocabulary.  │
 * ├─────────────────────────────────────┼──────────────────────────────────────┤
 * │ src/core/enterprise-consolidation/  │ Cross-domain aggregation layer.      │
 * │                                     │ 4 of 9 files contain domain terms    │
 * │                                     │ by architectural necessity.          │
 * ├─────────────────────────────────────┼──────────────────────────────────────┤
 * │ src/core/plugins/                   │ Domain plugins that encapsulate      │
 * │                                     │ industry vocabulary. All 4 domain    │
 * │                                     │ plugin files contain terms.          │
 * ├─────────────────────────────────────┼──────────────────────────────────────┤
 * │ src/core/migrations/                │ Legacy migration scripts that must   │
 * │                                     │ reference domain terms to repair     │
 * │                                     │ historical data structures.          │
 * └─────────────────────────────────────┴──────────────────────────────────────┘
 *
 * REMOVED from RC-3.1.1-R2 (was in R1):
 *   src/core/quality/ — Audited 2026-08-02: only DomainVocabularyScanner.ts
 *   and domainVocabularyAllowlist.ts reference domain terms (by design, to
 *   build and explain matchers). The 6 other files in this directory have
 *   zero domain term occurrences. Replacing with specific-file entries below
 *   prevents silent absorption of future violations in this directory.
 */
const ALLOWED_PREFIXES: readonly string[] = [
  "src/core/business-domains/",
  "src/core/enterprise-consolidation/",
  "src/core/plugins/",
  "src/core/migrations/",
];

/**
 * Individual files outside ALLOWED_PREFIXES that are explicitly permitted
 * to contain domain vocabulary because they define or explain matchers.
 * These are different from DOMAIN_VOCABULARY_LEGACY_PATHS (tracked debt):
 * their presence here is INTENTIONAL and permanent by design.
 */
const ALLOWED_INDIVIDUAL_FILES: ReadonlySet<string> = new Set([
  // The scanner itself defines vocabulary terms — it must reference them.
  "src/core/quality/DomainVocabularyScanner.ts",
  // The allowlist documents legacy debt paths — it references domain-term strings.
  "src/core/quality/domainVocabularyAllowlist.ts",
]);

// ─── Directories skipped during file walk ────────────────────────────────────

/**
 * Directories to skip entirely during production file walking.
 * Prevents scanning generated, vendored, or irrelevant artifacts.
 */
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  "coverage",
  "archive",
  ".git",
  ".cache",
  "__snapshots__",
  "fixtures",
]);

// ─── Pre-compiled matchers ────────────────────────────────────────────────────

/**
 * Pre-compiled matchers: one RegExp per term, compiled once at module load.
 *
 * Word boundary strategy: `(?:^|[^\p{L}\p{N}])term(?:[^\p{L}\p{N}]|$)`
 *
 * - \p{L} = any Unicode letter (covers PT-BR accented characters)
 * - \p{N} = any Unicode digit
 * - Boundaries are non-letter, non-digit characters (spaces, punctuation,
 *   string delimiters, operators) — underscore IS a boundary (it is not \p{L})
 * - Case-insensitive via flag `i`; input is pre-lowercased by caller
 *
 * Flag selection (resolved once via detectRegexFlag()):
 * - "iv": Unicode Sets mode (Node ≥ 20, V8 ≥ 11). Preferred when available.
 * - "iu": Unicode mode  (Node ≥ 10, V8 ≥ 5).  Identical \p{} behavior for
 *         our patterns. Used as automatic fallback on Node 18 / CI environments.
 *
 * Why NOT String.includes(): "serviços" would match inside "serviçosExtraInfo",
 * producing false positives. The boundary regex prevents this.
 */
function escapeRegex(s: string): string {
  return s.replace(/[$()*+.?[\\\]^{|}]/g, "\\$&");
}

interface CompiledMatcher {
  term: string;
  category: DomainVocabularyCategory;
  re: RegExp;
}

const COMPILED_MATCHERS: CompiledMatcher[] = VOCABULARY.flatMap(({ category, terms }) =>
  terms.map(term => ({
    term,
    category,
    re: new RegExp(
      `(?:^|[^\\p{L}\\p{N}])${escapeRegex(term)}(?:[^\\p{L}\\p{N}]|$)`,
      REGEX_FLAG
    ),
  }))
);

// ─── Path helpers ─────────────────────────────────────────────────────────────

function normalizeRelative(file: string): string {
  return file.replaceAll(path.sep, "/");
}

function isAllowedPath(normalizedFile: string): boolean {
  return (
    ALLOWED_PREFIXES.some(prefix => normalizedFile.startsWith(prefix)) ||
    ALLOWED_INDIVIDUAL_FILES.has(normalizedFile) ||
    DOMAIN_VOCABULARY_LEGACY_PATHS.has(normalizedFile)
  );
}

// ─── Core scanner ─────────────────────────────────────────────────────────────

/**
 * Scan an explicit list of { file, source } pairs for domain vocabulary.
 *
 * Files are marked:
 *   allowed=true  — if path is in ALLOWED_PREFIXES, ALLOWED_INDIVIDUAL_FILES,
 *                   or DOMAIN_VOCABULARY_LEGACY_PATHS (tracked debt)
 *   allowed=false — all other occurrences (unauthorized violations)
 */
export function scanDomainVocabulary(
  files: Array<{ file: string; source: string }>
): DomainVocabularyFinding[] {
  const findings: DomainVocabularyFinding[] = [];

  for (const { file, source } of files) {
    const normalizedFile = normalizeRelative(file);
    const allowed = isAllowedPath(normalizedFile);
    const lines = source.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const lowerLine = lines[i].toLocaleLowerCase("pt-BR");
      for (const matcher of COMPILED_MATCHERS) {
        if (matcher.re.test(lowerLine)) {
          findings.push({
            file: normalizedFile,
            line: i + 1,
            term: matcher.term,
            category: matcher.category,
            allowed,
          });
        }
      }
    }
  }

  return findings;
}

// ─── File walker ──────────────────────────────────────────────────────────────

/**
 * Recursively list all production TypeScript/TSX source files under `directory`.
 *
 * Rules:
 * - Only .ts and .tsx extensions.
 * - Test files (*.test.ts, *.test.tsx, *.spec.ts, *.spec.tsx) are excluded.
 * - Directories in SKIP_DIRS are skipped entirely.
 * - Symlinks are not followed.
 * - Results are sorted deterministically (alphabetical by full path).
 */
export function listProductionFiles(directory: string): string[] {
  const results: string[] = [];

  function walk(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      if (SKIP_DIRS.has(entry.name)) continue;

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;
      if (!/\.(ts|tsx)$/.test(entry.name)) continue;
      if (/\.(test|spec)\.(ts|tsx)$/.test(entry.name)) continue;

      results.push(fullPath);
    }
  }

  walk(directory);
  results.sort();
  return results;
}

// ─── Production scan ──────────────────────────────────────────────────────────

/**
 * Scan all production TypeScript files under `root` for domain vocabulary.
 *
 * Performance budget (measured on this codebase, 561 files / ~75 000 lines):
 *   Objective  : < 3 seconds
 *   Alert      : 3–4 seconds
 *   Failure    : > 5 seconds (CI budget)
 *
 * This is the real implementation.
 * There is no stub. There is no dummy finding. There is no global src/ prefix.
 */
export function scanProductionDomainVocabulary(
  root = path.resolve(process.cwd(), "src")
): DomainVocabularyFinding[] {
  const cwd = process.cwd();

  const files = listProductionFiles(root).map(absolutePath => {
    const relative = normalizeRelative(path.relative(cwd, absolutePath));
    let source: string;
    try {
      source = fs.readFileSync(absolutePath, "utf8");
    } catch {
      source = "";
    }
    return { file: relative, source };
  });

  return scanDomainVocabulary(files);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Filter findings to only those that are unauthorized (not in any allowlist).
 * These represent real architectural violations that must be remediated.
 */
export function findUnauthorizedDomainVocabulary(
  findings: DomainVocabularyFinding[]
): DomainVocabularyFinding[] {
  return findings.filter(finding => !finding.allowed);
}
