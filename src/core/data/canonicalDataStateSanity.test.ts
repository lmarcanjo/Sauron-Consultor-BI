import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd());

describe("canonical data-state architecture", () => {
  it("has removed the DataSourceManager family", () => {
    expect(fs.existsSync(path.join(root, "src/core/data/DataSourceManager.ts"))).toBe(false);
    expect(fs.existsSync(path.join(root, "src/hooks/useDataSourceManager.ts"))).toBe(false);
    expect(fs.existsSync(path.join(root, "src/services/dataSourceManager.ts"))).toBe(false);
    expect(fs.existsSync(path.join(root, "src/services/dataSourceManager.test.ts"))).toBe(false);
  });

  it("keeps legacy persisted rows outside production consumers", () => {
    const productionFiles: string[] = [];
    const walk = (directory: string) => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const filename = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          if (!entry.name.includes("node_modules") && entry.name !== "dist") walk(filename);
        } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".test.tsx")) {
          productionFiles.push(filename);
        }
      }
    };
    walk(path.join(root, "src"));

    const allowedMigration = path.join(root, "src/core/migrations/LegacyLocalStateRepairService.ts");
    const violations = productionFiles
      .filter(filename => filename !== allowedMigration)
      .filter(filename => /sauron_ds_(db_data|versions|state|workspace|adjustments|filters|import_profile)/.test(fs.readFileSync(filename, "utf8")))
      .map(filename => path.relative(root, filename));

    expect(violations).toEqual([]);
  });
});
