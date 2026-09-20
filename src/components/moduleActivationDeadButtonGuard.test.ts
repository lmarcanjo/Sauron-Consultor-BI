import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(fullPath) : fullPath.endsWith('.tsx') ? [fullPath] : [];
  });
}

describe('MVP-2 dead button guard', () => {
  it('não permite padrões óbvios de CTA sem ação em componentes produtivos', () => {
    const componentsRoot = path.resolve(process.cwd(), 'src/components');
    const violations: string[] = [];
    for (const file of sourceFiles(componentsRoot)) {
      const source = fs.readFileSync(file, 'utf8');
      if (/onClick=\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/.test(source)) violations.push(`${file}: empty onClick`);
      if (/onClick=\{\s*\(\)\s*=>\s*undefined\s*\}/.test(source)) violations.push(`${file}: undefined onClick`);
      if (/href=["']#["']/.test(source)) violations.push(`${file}: placeholder href`);
      if (/onClick=\{[\s\S]{0,300}?\bTODO\b/.test(source)) violations.push(`${file}: TODO-only action`);
      if (/onClick=\{[\s\S]{0,300}?console\.log\s*\(/.test(source)) violations.push(`${file}: console-only action`);
    }
    expect(violations).toEqual([]);
  });
});
