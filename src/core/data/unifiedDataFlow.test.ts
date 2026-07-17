import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "src");

function readProductionFiles(relativeDir: string): Array<{ file: string; source: string }> {
  const directory = path.join(root, relativeDir);
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return entries.flatMap(entry => {
    const relative = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) return readProductionFiles(relative);
    if (!/\.(ts|tsx)$/.test(entry.name) || entry.name.endsWith(".test.ts") || entry.name.endsWith(".test.tsx")) {
      return [];
    }
    const file = path.join(root, relative);
    return [{ file: relative, source: fs.readFileSync(file, "utf8") }];
  });
}

describe("Unified data flow architectural sanity", () => {
  it("keeps spreadsheet parsing out of App and React components", () => {
    const files = [
      { file: "App.tsx", source: fs.readFileSync(path.join(root, "App.tsx"), "utf8") },
      ...readProductionFiles("components"),
    ];
    const forbiddenParserUsage = /(?:from\s+["']xlsx["']|import\(\s*["']xlsx["']\s*\)|XLSX\.(?:read|utils)|sheet_to_json)/;

    expect(files.filter(entry => forbiddenParserUsage.test(entry.source)).map(entry => entry.file)).toEqual([]);
  });

  it("does not reintroduce demo identifiers into production code", () => {
    const files = [
      ...readProductionFiles("components"),
      ...readProductionFiles("core"),
      { file: "App.tsx", source: fs.readFileSync(path.join(root, "App.tsx"), "utf8") },
    ];
    const forbiddenDemoTokens = /\b(?:DEMO_DATA|demoData|generateDemo|mockRows)\b|Grupo Alpha|Topázio Demo/i;

    expect(files.filter(entry => forbiddenDemoTokens.test(entry.source)).map(entry => entry.file)).toEqual([]);
  });

  it("keeps activation event emission centralized in ActiveDatasetStore", () => {
    const activation = fs.readFileSync(path.join(root, "core/data/DataActivation.ts"), "utf8");
    const store = fs.readFileSync(path.join(root, "core/data/ActiveDatasetStore.ts"), "utf8");

    expect(activation).not.toMatch(/new CustomEvent\(["']DATASET_ACTIVATED["']/);
    expect(store).toMatch(/ACTIVE_DATASET_CHANGED/);
  });
});
