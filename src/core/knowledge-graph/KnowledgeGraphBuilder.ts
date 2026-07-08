import { ModuleName } from "../data/moduleMapping";
import {
  BusinessRuleCandidate,
  KpiCandidate,
  SheetDependencySummary,
  StructuralRisk,
} from "../workbook-reverse";
import {
  KnowledgeGraphDraft,
  makeEdge,
  makeNode,
  safeGraphIdPart,
  semanticNodeId,
  sheetNodeId,
  workbookNodeId,
  columnNodeId,
} from "./EnterpriseKnowledgeGraph";
import { buildKnowledgeGraphDiagnostics } from "./KnowledgeGraphDiagnostics";
import { mapModuleMappingsToKnowledgeGraph } from "./ModuleMappingGraphMapper";
import { mapWorkbookToKnowledgeGraph } from "./WorkbookToKnowledgeGraphMapper";
import {
  BuildKnowledgeGraphInput,
  EnterpriseKnowledgeGraph,
  KnowledgeNodeType,
} from "./KnowledgeGraphTypes";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function columnKey(columnLetter: string, originalName: string): string {
  return `${columnLetter}:${originalName || "sem_nome"}`;
}

function moduleForRule(candidate: BusinessRuleCandidate): ModuleName | null {
  if (candidate.category === "commission") return "Comissão";
  if (candidate.category === "dre") return "DRE";
  if (candidate.category === "aggregation" || candidate.category === "lookup") return "Comercial";
  if (candidate.category === "validation" || candidate.category === "reference") return null;
  return null;
}

function conceptForRule(candidate: BusinessRuleCandidate): KnowledgeNodeType | null {
  if (candidate.category === "commission") return "Commission";
  if (candidate.category === "dre") return "DRECandidate";
  if (candidate.category === "aggregation") return "Revenue";
  return null;
}

function moduleForKpi(candidate: KpiCandidate): ModuleName | null {
  if (candidate.category === "commission") return "Comissão";
  if (candidate.category === "people") return "Pessoas";
  if (candidate.category === "sales" || candidate.category === "margin" || candidate.category === "operational") return "Comercial";
  if (candidate.category === "financial") return "Financeiro";
  if (candidate.category === "dre") return "DRE";
  return null;
}

function conceptForKpi(candidate: KpiCandidate): KnowledgeNodeType | null {
  if (candidate.category === "commission") return "Commission";
  if (candidate.category === "sales") return "Revenue";
  if (candidate.category === "margin") return "Cost";
  if (candidate.category === "people") return "Seller";
  if (candidate.category === "financial") return "Revenue";
  if (candidate.category === "dre") return "DRECandidate";
  return null;
}

function addSemanticCandidate(draft: KnowledgeGraphDraft, workbookId: string, type: KnowledgeNodeType, key: string, fromNodeId: string, evidence: string[]): void {
  const semanticId = semanticNodeId(workbookId, type, key);
  draft.addNode(makeNode({
    id: semanticId,
    type,
    label: key,
    properties: { conceptKey: key },
    evidence,
  }));
  draft.addEdge(makeEdge({
    type: "CANDIDATE_FOR",
    from: fromNodeId,
    to: semanticId,
    label: "candidato para conceito",
    evidence,
  }));
}

function addModuleTargetNode(draft: KnowledgeGraphDraft, workbookId: string, moduleName: ModuleName, fromNodeId: string, evidence: string[]): void {
  const moduleId = `module-mapping:${safeGraphIdPart(workbookId)}:inferred:${safeGraphIdPart(moduleName)}`;
  draft.addNode(makeNode({
    id: moduleId,
    type: "ModuleMapping",
    label: `Módulo ${moduleName} (inferido)`,
    properties: {
      moduleName,
      inferred: true,
    },
    evidence: [`Nó de módulo inferido para conectar candidatos sem mapeamento salvo.`],
  }));
  draft.addEdge(makeEdge({
    type: "FEEDS_MODULE",
    from: fromNodeId,
    to: moduleId,
    label: "alimenta módulo",
    evidence,
  }));
}

function addRelatedColumns(params: {
  input: BuildKnowledgeGraphInput;
  draft: KnowledgeGraphDraft;
  fromNodeId: string;
  relatedColumns: string[];
  edgeType: "DERIVED_FROM" | "CANDIDATE_FOR";
}): void {
  const { input, draft, fromNodeId, relatedColumns, edgeType } = params;
  const normalizedColumns = new Set(relatedColumns.map(normalize));
  if (normalizedColumns.size === 0) return;

  input.workbookCatalog.columns
    .filter(column => normalizedColumns.has(normalize(column.originalName)))
    .forEach(column => {
      const id = columnNodeId(input.workbookCatalog.id, column.sheetName, columnKey(column.columnLetter, column.originalName));
      draft.addEdge(makeEdge({
        type: edgeType,
        from: fromNodeId,
        to: id,
        label: "relaciona coluna",
        evidence: [`Candidato relacionado à coluna ${column.sheetName}!${column.columnLetter} (${column.originalName}).`],
      }));
    });
}

function mapDependencies(input: BuildKnowledgeGraphInput, draft: KnowledgeGraphDraft): void {
  input.reverseReport.dependencySummary.forEach((dependency: SheetDependencySummary) => {
    const from = sheetNodeId(input.workbookCatalog.id, dependency.from);
    const to = sheetNodeId(input.workbookCatalog.id, dependency.to);
    if (!draft.hasNode(from) || !draft.hasNode(to)) return;

    draft.addEdge(makeEdge({
      type: "DEPENDS_ON",
      from,
      to,
      label: "aba depende de aba",
      weight: dependency.count,
      evidence: [
        `${dependency.from} depende de ${dependency.to} em ${dependency.count} referência(s).`,
        ...dependency.sampleEvidence.slice(0, 3),
      ],
    }));
  });
}

function mapBusinessRules(input: BuildKnowledgeGraphInput, draft: KnowledgeGraphDraft): void {
  const workbookId = workbookNodeId(input.workbookCatalog.id);
  input.reverseReport.businessRuleCandidates.forEach((candidate: BusinessRuleCandidate) => {
    const id = `business-rule:${safeGraphIdPart(input.workbookCatalog.id)}:${safeGraphIdPart(candidate.id)}`;
    draft.addNode(makeNode({
      id,
      type: "BusinessRuleCandidate",
      label: candidate.title,
      properties: {
        candidateId: candidate.id,
        category: candidate.category,
        confidence: candidate.confidence,
        formulaTypes: candidate.formulaTypes,
        requiresConsultantReview: candidate.requiresConsultantReview,
      },
      evidence: candidate.evidence,
      riskLevel: candidate.requiresConsultantReview ? "medium" : undefined,
    }));
    draft.addEdge(makeEdge({
      type: "CONTAINS",
      from: workbookId,
      to: id,
      label: "contém regra candidata",
      evidence: [`Regra candidata derivada do relatório reverso: ${candidate.title}.`],
    }));

    candidate.sheetNames.forEach(sheetName => {
      const sheetId = sheetNodeId(input.workbookCatalog.id, sheetName);
      if (!draft.hasNode(sheetId)) return;
      draft.addEdge(makeEdge({
        type: "DERIVED_FROM",
        from: id,
        to: sheetId,
        label: "derivada da aba",
        evidence: [`Regra candidata usa evidência da aba ${sheetName}.`],
      }));
    });
    addRelatedColumns({ input, draft, fromNodeId: id, relatedColumns: candidate.relatedColumns, edgeType: "DERIVED_FROM" });

    const conceptType = conceptForRule(candidate);
    if (conceptType) {
      addSemanticCandidate(draft, input.workbookCatalog.id, conceptType, `${candidate.category}:${candidate.title}`, id, candidate.evidence);
    }

    const moduleName = moduleForRule(candidate);
    if (moduleName) addModuleTargetNode(draft, input.workbookCatalog.id, moduleName, id, candidate.evidence);
  });
}

function mapKpis(input: BuildKnowledgeGraphInput, draft: KnowledgeGraphDraft): void {
  const workbookId = workbookNodeId(input.workbookCatalog.id);
  input.reverseReport.kpiCandidates.forEach((candidate: KpiCandidate) => {
    const id = `kpi:${safeGraphIdPart(input.workbookCatalog.id)}:${safeGraphIdPart(candidate.id)}`;
    draft.addNode(makeNode({
      id,
      type: "KpiCandidate",
      label: candidate.name,
      properties: {
        candidateId: candidate.id,
        category: candidate.category,
        confidence: candidate.confidence,
      },
      evidence: candidate.evidence,
    }));
    draft.addEdge(makeEdge({
      type: "CONTAINS",
      from: workbookId,
      to: id,
      label: "contém KPI candidato",
      evidence: [`KPI candidato derivado do relatório reverso: ${candidate.name}.`],
    }));

    candidate.sheetNames.forEach(sheetName => {
      const sheetId = sheetNodeId(input.workbookCatalog.id, sheetName);
      if (!draft.hasNode(sheetId)) return;
      draft.addEdge(makeEdge({
        type: "DERIVED_FROM",
        from: id,
        to: sheetId,
        label: "derivado da aba",
        evidence: [`KPI candidato usa evidência da aba ${sheetName}.`],
      }));
    });
    addRelatedColumns({ input, draft, fromNodeId: id, relatedColumns: candidate.relatedColumns, edgeType: "DERIVED_FROM" });

    const conceptType = conceptForKpi(candidate);
    if (conceptType) {
      addSemanticCandidate(draft, input.workbookCatalog.id, conceptType, `${candidate.category}:${candidate.name}`, id, candidate.evidence);
    }

    const moduleName = moduleForKpi(candidate);
    if (moduleName) addModuleTargetNode(draft, input.workbookCatalog.id, moduleName, id, candidate.evidence);
  });
}

function applyStructuralRisks(input: BuildKnowledgeGraphInput, draft: KnowledgeGraphDraft): void {
  const highRiskCount = input.reverseReport.structuralRisks.filter((risk: StructuralRisk) => risk.severity === "high").length;
  if (highRiskCount === 0) return;

  draft.addNode(makeNode({
    id: workbookNodeId(input.workbookCatalog.id),
    type: "Workbook",
    label: input.workbookCatalog.metadata.name,
    properties: {
      highStructuralRiskCount: highRiskCount,
      structuralRisks: input.reverseReport.structuralRisks.slice(0, 12).map(risk => risk.title),
    },
    evidence: input.reverseReport.structuralRisks.slice(0, 8).map(risk => `${risk.severity}: ${risk.title}`),
    riskLevel: "high",
  }));
}

export function buildKnowledgeGraph(input: BuildKnowledgeGraphInput): EnterpriseKnowledgeGraph {
  const draft = new KnowledgeGraphDraft();
  const graphId = `knowledge-graph:${safeGraphIdPart(input.workbookCatalog.id)}`;

  mapWorkbookToKnowledgeGraph(input.workbookCatalog, draft);

  if (input.activeDataset) {
    draft.addNode(makeNode({
      id: workbookNodeId(input.workbookCatalog.id),
      type: "Workbook",
      label: input.workbookCatalog.metadata.name,
      properties: {
        activeDatasetId: input.activeDataset.datasetId,
        activeDatasetSourceName: input.activeDataset.sourceName,
        activeDatasetRowCount: input.activeDataset.rowCount,
        activeDatasetColumnCount: input.activeDataset.columnCount,
        rawStorageRef: input.activeDataset.rawStorageRef,
      },
      evidence: [`ActiveDataset ${input.activeDataset.datasetId} associado como contexto do grafo.`],
    }));
  }

  mapDependencies(input, draft);
  mapBusinessRules(input, draft);
  mapKpis(input, draft);
  applyStructuralRisks(input, draft);
  mapModuleMappingsToKnowledgeGraph({
    catalog: input.workbookCatalog,
    activeDataset: input.activeDataset,
    moduleMappings: input.moduleMappings || [],
    draft,
  });

  return draft.build(graphId, buildKnowledgeGraphDiagnostics);
}
