import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  REGEX_FLAG,
  findUnauthorizedDomainVocabulary,
  scanDomainVocabulary,
  scanProductionDomainVocabulary,
} from "./DomainVocabularyScanner";

// ─── helpers ────────────────────────────────────────────────────────────────

/** Creates a temporary directory tree for scanner fixture tests. */
function makeTmpRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "vocab-scanner-"));
}

function writeFile(root: string, rel: string, content: string): string {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, "utf8");
  return abs;
}

// ─── core scanning logic ─────────────────────────────────────────────────────

describe("domain vocabulary scanner — core logic", () => {
  // Test 1 · 2: allowed inside Domain Pack, forbidden in generic component
  it("allows vocabulary inside Domain Packs and reports generic production code", () => {
    const findings = scanDomainVocabulary([
      {
        file: "src/core/business-domains/automotive/vocabulary.ts",
        source: "export const term = 'veículo';",
      },
      {
        file: "src/components/GenericReport.tsx",
        source: "const label = 'veículo';",
      },
    ]);

    expect(findings).toHaveLength(2);
    expect(findings[0].allowed).toBe(true);
    expect(findUnauthorizedDomainVocabulary(findings)).toEqual([
      expect.objectContaining({ file: "src/components/GenericReport.tsx", term: "veículo" }),
    ]);
  });

  // Test 3: accented term
  it("detects terms with Portuguese accents (veículo, concessionária, agronegócio)", () => {
    const findings = scanDomainVocabulary([
      { file: "src/generic/Foo.ts", source: "const x = 'concessionária';" },
      { file: "src/generic/Bar.ts", source: "const y = 'agronegócio';" },
    ]);
    expect(findings.some(f => f.term === "concessionária")).toBe(true);
    expect(findings.some(f => f.term === "agronegócio")).toBe(true);
  });

  // Test 4: case-insensitive detection
  it("detects terms case-insensitively (VEÍCULO matches veículo)", () => {
    const findings = scanDomainVocabulary([
      { file: "src/generic/Foo.ts", source: "const x = 'VEÍCULO';" },
      { file: "src/generic/Bar.ts", source: "const y = 'Concessionária';" },
    ]);
    expect(findings.some(f => f.term === "veículo")).toBe(true);
    expect(findings.some(f => f.term === "concessionária")).toBe(true);
  });

  // Test 5: no false positive on substring
  it("does not produce false positives from substrings inside longer words", () => {
    const findings = scanDomainVocabulary([
      // "veículos" contains "veículo" as prefix — must NOT match (whole-word boundary)
      { file: "src/generic/A.ts", source: "const x = 'veículos';" },
      // "automotiveReport" — "automotive" is a camelCase prefix, must NOT match
      { file: "src/generic/B.ts", source: "const automotiveReport = 1;" },
      // "retailPrice" — "retail" is a camelCase prefix, must NOT match
      { file: "src/generic/C.ts", source: "const retailPrice = 5;" },
      // "industrialPark" — "industrial" is a camelCase prefix, must NOT match
      { file: "src/generic/D.ts", source: "const industrialPark = true;" },
    ]);

    const falsePositives = findings.filter(f =>
      (f.term === "veículo" && f.file === "src/generic/A.ts") ||
      (f.term === "automotive" && f.file === "src/generic/B.ts") ||
      (f.term === "retail" && f.file === "src/generic/C.ts") ||
      (f.term === "industrial" && f.file === "src/generic/D.ts")
    );
    expect(falsePositives).toHaveLength(0);
  });

  // Test 6: camelCase — the term IS detected when it is a standalone word
  it("detects standalone domain term even in code context", () => {
    const findings = scanDomainVocabulary([
      // "automotive" standalone as identifier value
      { file: "src/generic/Foo.ts", source: "const report = automotive;" },
      // "industrial" standalone in comment
      { file: "src/generic/Bar.ts", source: "// industrial sector" },
    ]);
    expect(findings.some(f => f.term === "automotive")).toBe(true);
    expect(findings.some(f => f.term === "industrial")).toBe(true);
  });

  // Test 7: snake_case — underscore is a boundary, so term IS detected
  it("detects domain terms adjacent to underscores (snake_case boundary)", () => {
    const findings = scanDomainVocabulary([
      { file: "src/generic/Foo.ts", source: "const x = retail_price;" },
    ]);
    // underscore is not \p{L} or \p{N}, so "retail" has a valid boundary
    expect(findings.some(f => f.term === "retail")).toBe(true);
  });

  // Test 10: normalized relative paths
  // On Linux, path.sep === '/', so normalizeRelative replaces '/' with '/'.
  // The meaningful contract is: the returned file path always uses '/' as separator
  // (not the OS path.sep, which could be '\\' on Windows). We validate with a
  // path.join()-built path (OS-native) to ensure the normalizer covers that case.
  it("normalizes OS-native path separators in file paths to forward slashes", () => {
    const nativePath = ["src", "components", "Foo.tsx"].join(path.sep);
    const findings = scanDomainVocabulary([
      {
        file: nativePath,
        source: "const x = 'veículo';",
      },
    ]);
    expect(findings[0].file).toBe("src/components/Foo.tsx");
    expect(findings[0].file).not.toContain("\\");
  });

  // Test 11: deterministic ordering
  it("produces deterministic results for the same input", () => {
    const input = [
      { file: "src/generic/B.ts", source: "const x = 'veículo';" },
      { file: "src/generic/A.ts", source: "const y = 'veículo';" },
    ];
    const run1 = scanDomainVocabulary(input);
    const run2 = scanDomainVocabulary(input);
    expect(run1).toEqual(run2);
  });

  // Test 13: new violation is detected
  it("detects a new unauthorized finding in a generic file", () => {
    const findings = scanDomainVocabulary([
      {
        file: "src/components/NewGenericWidget.tsx",
        source: "const label = 'automotivo';",
      },
    ]);
    const unauthorized = findUnauthorizedDomainVocabulary(findings);
    expect(unauthorized).toHaveLength(1);
    expect(unauthorized[0].term).toBe("automotivo");
    expect(unauthorized[0].allowed).toBe(false);
  });

  // Test 14: no dummy/fictitious findings
  it("never returns dummy or fictitious findings", () => {
    const findings = scanDomainVocabulary([
      { file: "src/core/quality/dummy.ts", source: "// empty" },
    ]);
    expect(findings.every(f => f.term !== "dummy")).toBe(true);
    expect(findings).toHaveLength(0);
  });
});

// ─── file system fixture tests ────────────────────────────────────────────────

describe("domain vocabulary scanner — file system fixtures", () => {
  let tmpRoot: string;

  beforeAll(() => {
    tmpRoot = makeTmpRoot();
  });

  afterAll(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  // Test 8: ignored file extensions (.js is not scanned by production walker)
  it("production walker ignores non-.ts/.tsx files", () => {
    writeFile(tmpRoot, "src/generic/Foo.js", "const x = 'veículo';");
    // Only .js in tmpRoot/src → production scan finds nothing
    const findings = scanProductionDomainVocabulary(path.join(tmpRoot, "src"));
    expect(findings.filter(f => f.file.endsWith(".js"))).toHaveLength(0);
  });

  // Test 9: ignored directories (node_modules, dist)
  it("production walker ignores node_modules and dist directories", () => {
    writeFile(tmpRoot, "src/node_modules/lib/index.ts", "const x = 'veículo';");
    writeFile(tmpRoot, "src/dist/bundle.ts", "const x = 'veículo';");
    const findings = scanProductionDomainVocabulary(path.join(tmpRoot, "src"));
    expect(findings.filter(f => f.file.includes("node_modules"))).toHaveLength(0);
    expect(findings.filter(f => f.file.includes("/dist/"))).toHaveLength(0);
  });

  // Test 15: non-existent root returns empty array
  it("returns empty array for a non-existent root directory", () => {
    const result = scanProductionDomainVocabulary(path.join(tmpRoot, "does_not_exist"));
    expect(result).toEqual([]);
  });

  // Test 16: unreadable file is skipped safely (no throw)
  it("skips unreadable files without throwing", () => {
    const abs = writeFile(tmpRoot, "src/protected/Secret.ts", "const x = 'veículo';");
    fs.chmodSync(abs, 0o000);
    expect(() =>
      scanProductionDomainVocabulary(path.join(tmpRoot, "src"))
    ).not.toThrow();
    fs.chmodSync(abs, 0o644); // restore for cleanup
  });
});

// ─── production scan ──────────────────────────────────────────────────────────

describe("domain vocabulary scanner — production scan", () => {
  // Test 12 · 14: tracked debt remains visible, no dummy findings
  it("keeps the existing residual vocabulary visible as tracked debt", () => {
    const findings = scanProductionDomainVocabulary();

    // Real vocabulary exists in the codebase — real findings must be returned.
    expect(findings.length).toBeGreaterThan(0);

    // All findings must be allowed: either in Domain Pack dirs or in the
    // DOMAIN_VOCABULARY_LEGACY_PATHS tracked-debt allowlist.
    expect(findUnauthorizedDomainVocabulary(findings)).toEqual([]);

    // No dummy/fictitious findings.
    expect(findings.every(f => f.file !== "src/core/quality/dummy.ts")).toBe(true);
    expect(findings.every(f => f.term !== "dummy")).toBe(true);
  });

  // Test 17: execution within reasonable time budget
  it("completes the production scan within 5 seconds", { timeout: 8000 }, () => {
    const start = performance.now();
    scanProductionDomainVocabulary();
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  // Test 18: repeated execution produces identical results (determinism)
  // Runs the full production scan twice; each takes ~1-2s, so timeout is generous.
  it("produces identical results on repeated execution", { timeout: 12000 }, () => {
    const run1 = scanProductionDomainVocabulary();
    const run2 = scanProductionDomainVocabulary();
    expect(run1).toEqual(run2);
  });
});
