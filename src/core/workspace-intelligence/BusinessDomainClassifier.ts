import {
  BusinessDomain,
  BusinessDomainClassification,
  WorkbookFingerprint,
} from "./WorkspaceIntelligenceTypes";
import { normalizeBusinessToken, tokenizeBusinessText } from "./WorkbookFingerprint";

const DOMAIN_TERMS: Record<BusinessDomain, string[]> = {
  automotive: [
    "acessorio",
    "chassi",
    "comissao",
    "concessionaria",
    "garantia",
    "marca",
    "modelo",
    "oficina",
    "os",
    "peca",
    "pecas",
    "revisao",
    "veiculo",
    "vendedor",
  ],
  agribusiness: [
    "boi",
    "colheita",
    "cultura",
    "fazenda",
    "grao",
    "hectare",
    "insumo",
    "leite",
    "lote",
    "plantio",
    "produtor",
    "propriedade",
    "safra",
    "talhao",
  ],
  retail: ["caixa", "categoria", "cliente", "cupom", "estoque", "loja", "produto", "sku", "varejo", "venda"],
  services: ["agenda", "atendimento", "chamado", "cliente", "contrato", "hora", "projeto", "servico", "sla"],
  finance: ["banco", "caixa", "centro", "conta", "credito", "custo", "dre", "financeiro", "margem", "receita"],
  healthcare: ["clinica", "consulta", "exame", "medico", "paciente", "procedimento", "saude"],
  education: ["aluno", "aula", "curso", "disciplina", "escola", "matricula", "nota", "professor"],
  construction: ["canteiro", "construcao", "empreendimento", "engenharia", "medicao", "obra", "orcamento"],
  unknown: [],
};

function emptyScores(): Record<BusinessDomain, number> {
  return {
    automotive: 0,
    agribusiness: 0,
    retail: 0,
    services: 0,
    finance: 0,
    healthcare: 0,
    education: 0,
    construction: 0,
    unknown: 0,
  };
}

export function classifyBusinessDomain(fingerprint: WorkbookFingerprint): BusinessDomainClassification {
  const tokens = new Set([
    ...fingerprint.businessTerms,
    ...fingerprint.columnTokens,
    ...fingerprint.sheetNames.flatMap(tokenizeBusinessText),
    ...tokenizeBusinessText(fingerprint.sourceName),
  ].map(normalizeBusinessToken).filter(Boolean));

  const scores = emptyScores();
  const matchedByDomain = new Map<BusinessDomain, string[]>();

  (Object.keys(DOMAIN_TERMS) as BusinessDomain[]).forEach(domain => {
    const matches = DOMAIN_TERMS[domain].filter(term => tokens.has(term));
    matchedByDomain.set(domain, matches);
    scores[domain] = matches.length;
  });

  const ranked = (Object.keys(scores) as BusinessDomain[])
    .filter(domain => domain !== "unknown")
    .sort((left, right) => scores[right] - scores[left]);

  const bestDomain = ranked[0] || "unknown";
  const bestScore = scores[bestDomain] || 0;
  const secondScore = scores[ranked[1]] || 0;

  if (bestScore === 0) {
    return {
      domain: "unknown",
      confidence: 0,
      matchedTerms: [],
      scores,
    };
  }

  const confidence = Math.min(0.95, Math.max(0.2, (bestScore - secondScore + bestScore) / 8));
  return {
    domain: bestDomain,
    confidence,
    matchedTerms: matchedByDomain.get(bestDomain) || [],
    scores,
  };
}

export function getBusinessDomainLabel(domain: BusinessDomain): string {
  const labels: Record<BusinessDomain, string> = {
    automotive: "Automotivo",
    agribusiness: "Agro",
    retail: "Varejo",
    services: "Serviços",
    finance: "Financeiro",
    healthcare: "Saúde",
    education: "Educação",
    construction: "Construção",
    unknown: "Indefinido",
  };
  return labels[domain];
}
