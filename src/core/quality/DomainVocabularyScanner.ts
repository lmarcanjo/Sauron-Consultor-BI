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

const allowedPrefixes = [
  "src/core/business-domains/",
  "src/core/plugins/",
  "src/core/migrations/",
  "src/core/quality/",
];

function normalizeRelative(file: string): string {
  return file.replaceAll(path.sep, "/");
}

function isAllowedPath(file: string): boolean {
  const relative = normalizeRelative(file);
  return allowedPrefixes.some(prefix => relative.startsWith(prefix)) || DOMAIN_VOCABULARY_LEGACY_PATHS.has(relative);
}

export function scanDomainVocabulary(files: Array<{ file: string; source: string }>): DomainVocabularyFinding[] {
  const findings: DomainVocabularyFinding[] = [];
  files.forEach(({ file, source }) => {
    source.split(/\r?\n/).forEach((line, index) => {
      const lowerLine = line.toLocaleLowerCase("pt-BR");
      VOCABULARY.forEach(({ category, terms }) => {
        terms.forEach(term => {
          if (lowerLine.includes(term)) {
            findings.push({
              file: normalizeRelative(file),
              line: index + 1,
              term,
              category,
              allowed: isAllowedPath(file),
            });
          }
        });
      });
    });
  });
  return findings;
}

function listProductionFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listProductionFiles(filePath);
    if (!/\.(ts|tsx)$/.test(entry.name) || /\.test\.(ts|tsx)$/.test(entry.name)) return [];
    return [filePath];
  });
}

export function scanProductionDomainVocabulary(root = path.resolve(process.cwd(), "src")): DomainVocabularyFinding[] {
  return scanDomainVocabulary(listProductionFiles(root).map(file => ({ file: path.relative(process.cwd(), file), source: fs.readFileSync(file, "utf8") })));
}

export function findUnauthorizedDomainVocabulary(findings: DomainVocabularyFinding[]): DomainVocabularyFinding[] {
  return findings.filter(finding => !finding.allowed);
}
