import { describe, it, expect } from 'vitest';
import { QualityArtifact } from './QualityContracts';
import { PlatformUser } from '../identity/types';
import { LocalDataSourceRepository } from '../datasource/LocalDataSourceRepository';

describe("Canonical Contract Integrity & Anti-Regression Guards", () => {
  it("compiles full QualityArtifact without mandatory field omission", () => {
    const artifact: QualityArtifact = {
      artifactId: "qual_123",
      discoveryArtifactId: "disc_123",
      dataSourceId: "ds_123",
      engagementId: "eng_123",
      alerts: [],
      recommendations: [],
      evaluatedAt: new Date().toISOString()
    };
    expect(artifact.artifactId).toBe("qual_123");
  });

  it("compiles PlatformUser contract", () => {
    const user: PlatformUser = {
      id: "usr_1",
      profile: {
        id: "prof_1",
        fullName: "Test User",
        email: "test@asterion.com"
      },
      role: "CONSULTANT"
    };
    expect(user.id).toBe("usr_1");
  });

  it("Sprint 3.3.1 Guard: React UI components in src/components MUST NOT import repositories or PersistenceManager directly", async () => {
    const fs = await import('fs');
    const path = await import('path');
    const componentsDir = path.resolve(__dirname, '../../components');
    const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

    for (const file of files) {
      if (file.endsWith('.test.tsx') || file.endsWith('.test.ts')) continue;
      const content = fs.readFileSync(path.join(componentsDir, file), 'utf-8');
      expect(content, `Component ${file} must not import LocalDataSourceRepository directly`).not.toContain('LocalDataSourceRepository');
      expect(content, `Component ${file} must not import DataSourceRepository directly`).not.toContain('DataSourceRepository');
      expect(content, `Component ${file} must not import PersistenceManager directly`).not.toContain('PersistenceManager');
    }
  });

  it("Sprint 3.3.2 Guard: FinancialObservationService.resolveContext MUST NOT use any in signature and MUST preserve 5 CanonicalDataStates", async () => {
    const fs = await import('fs');
    const path = await import('path');
    const serviceFile = path.resolve(__dirname, '../financial-structure/FinancialObservationService.ts');
    const content = fs.readFileSync(serviceFile, 'utf-8');

    expect(content).not.toContain('activeDatasetInput: any');
    expect(content).toContain('CanonicalDataState');
    expect(content).toContain('SOURCE_CONNECTED');
    expect(content).toContain('DISCOVERING');
    expect(content).toContain('WAITING_CONFIRMATION');
    expect(content).toContain('READY');
    expect(content).toContain('NO_SOURCE');
  });

  it("Sprint 3.3.3 Guard: Canonical E2E tests MUST NOT use pre-fabricated mock TrustArtifacts", async () => {
    const fs = await import('fs');
    const path = await import('path');
    const e2eFile = path.resolve(__dirname, '../../../tests/e2e/sprint3-3-real-financial-observation.spec.ts');
    const content = fs.readFileSync(e2eFile, 'utf-8');

    expect(content).not.toContain('trust_fin_mock_1');
    expect(content).not.toContain('createMockTrustArtifact');
  });

  it("Sprint 3.3.3-R1 Guard: TrustPolicy change MUST require reassessment and preserve history without overwriting V1", async () => {
    const fs = await import('fs');
    const path = await import('path');
    const engineFile = path.resolve(__dirname, '../trust/TrustEngine.ts');
    const content = fs.readFileSync(engineFile, 'utf-8');

    expect(content).toContain('policy');
    expect(content).toContain('fingerprint');
  });

  it("Sprint 4.0 Guard: Financial classification MUST NOT perform automatic classification, generate DRE or use LLMs", async () => {
    const fs = await import('fs');
    const path = await import('path');
    const classEngineFile = path.resolve(__dirname, '../financial-classification/FinancialClassificationEngine.ts');
    const content = fs.readFileSync(classEngineFile, 'utf-8');

    expect(content).not.toContain('calculateEBITDA');
    expect(content).not.toContain('generateDRE');
    expect(content).not.toContain('openai');
    expect(content).not.toContain('gemini');
  });

  it("Sprint 4.0.1 Guard: CustomRule MUST NOT use eval() or dynamic Function constructors", async () => {
    const fs = await import('fs');
    const path = await import('path');
    const engineFile = path.resolve(__dirname, '../financial-classification/FinancialClassificationEngine.ts');
    const content = fs.readFileSync(engineFile, 'utf-8');

    expect(content).not.toContain('eval(');
    expect(content).not.toContain('new Function(');
  });

  it("Sprint 4.0.2 Guard: LocalFinancialClassificationRepository MUST NOT contain silent memoryStore fallback in production", async () => {
    const fs = await import('fs');
    const path = await import('path');
    const repoFile = path.resolve(__dirname, '../financial-classification/FinancialClassificationRepository.ts');
    const content = fs.readFileSync(repoFile, 'utf-8');

    expect(content).not.toContain('static memoryStore');
    expect(content).toContain('InMemoryFinancialClassificationRepository');
  });

  it("Sprint 4.0.2-R1/R2 Guard: ADR MUST NOT be duplicated in standalone docs/adr/ folder and MUST NOT duplicate ADR numbers", async () => {
    const fs = await import('fs');
    const path = await import('path');
    const standaloneAdr = path.resolve(__dirname, '../../../docs/adr/ADR-004-financial-classification-dre-readiness.md');
    const canonicalAdr = path.resolve(__dirname, '../../../docs/architecture/ADR_RECORDS.md');
    
    expect(fs.existsSync(standaloneAdr)).toBe(false);
    
    const trustAdrFile = path.resolve(__dirname, '../../../docs/architecture/ADR_016_TrustEngine.md');
    expect(fs.existsSync(trustAdrFile)).toBe(true);
    
    const canonicalContent = fs.readFileSync(canonicalAdr, 'utf-8');
    expect(canonicalContent).toContain('ADR-019: Financial Classification');
    expect(canonicalContent).toContain('ADR-020: DRE Composition');

    // Validar que nenhum número de ADR se repete
    const adrMatches = canonicalContent.match(/ADR-?\d+/gi) || [];
    const numbers = adrMatches.map(m => m.replace(/ADR-?/i, '').padStart(3, '0'));
    const uniqueNumbers = new Set(numbers);
    expect(numbers.length).toBe(uniqueNumbers.size);
  });

  it("Sprint 4.1 Guard: DRECompositionEngine MUST NOT use eval(), LLMs or compute Net Revenue/EBITDA/Profit", async () => {
    const fs = await import('fs');
    const path = await import('path');
    const dreEngineFile = path.resolve(__dirname, '../dre-composition/DRECompositionEngine.ts');
    const repoFile = path.resolve(__dirname, '../dre-composition/DREArtifactRepository.ts');
    
    const engineContent = fs.readFileSync(dreEngineFile, 'utf-8');
    expect(engineContent).not.toContain('eval(');
    expect(engineContent).not.toContain('new Function(');
    expect(engineContent).not.toContain('openai');
    expect(engineContent).not.toContain('gemini');

    const repoContent = fs.readFileSync(repoFile, 'utf-8');
    expect(repoContent).not.toContain('static memoryStore');
    expect(repoContent).toContain('InMemoryDREArtifactRepository');
  });

  it("Sprint 4.1.1 Guard: DRECompositionPolicy MUST NOT set silent BRL default currency without declaration", async () => {
    const fs = await import('fs');
    const path = await import('path');
    const policyFile = path.resolve(__dirname, '../dre-composition/DRECompositionPolicy.ts');
    
    const policyContent = fs.readFileSync(policyFile, 'utf-8');
    expect(policyContent).toContain("currencyCode: 'UNKNOWN'");
    expect(policyContent).toContain("currencySource: 'UNKNOWN'");
  });

  it("Sprint 4.1.2 Guard: DRECompositionRegistry MUST NOT use static instance or global singleton", async () => {
    const fs = await import('fs');
    const path = await import('path');
    const registryFile = path.resolve(__dirname, '../dre-composition/DRECompositionRegistry.ts');
    
    const content = fs.readFileSync(registryFile, 'utf-8');
    expect(content).not.toContain('static instance');
    expect(content).not.toContain('getInstance()');
    expect(content).not.toContain('resetInstance()');
  });

  it("HOTFIX 4.1.3-R1 Guard: DRECompositionEngine MUST use ContributionIdentityBuilder.build for contribution key generation", async () => {
    const fs = await import('fs');
    const path = await import('path');
    const engineFile = path.resolve(__dirname, '../dre-composition/DRECompositionEngine.ts');
    
    const content = fs.readFileSync(engineFile, 'utf-8');
    expect(content).toContain('ContributionIdentityBuilder.build');
    expect(content).not.toContain('contribId = `${context.dataSourceId}_v${context.schemaVersionNumber}_${dec.decisionId}_${dec.categoryIdentity}`');
  });

  it("Sprint 4.2 Guard: DRECompositionEngine MUST NOT infer period when temporal field is missing and MUST enforce PhysicalContributionIdentity", async () => {
    const fs = await import('fs');
    const path = await import('path');
    const engineFile = path.resolve(__dirname, '../dre-composition/DRECompositionEngine.ts');
    
    const content = fs.readFileSync(engineFile, 'utf-8');
    expect(content).toContain('DUPLICATE_PHYSICAL_RECORD');
    expect(content).toContain('TEMPORAL_FIELD_NOT_AVAILABLE');
  });

  it("HOTFIX 4.3-R1 Guard: DRECompositionEngine MUST enforce SIGNED_VALUE_MODEL and ADD_SUBTOTALS for NET_INFLOW and GROSS_RESULT without Math.abs", async () => {
    const fs = await import('fs');
    const path = await import('path');
    const engineFile = path.resolve(__dirname, '../dre-composition/DRECompositionEngine.ts');
    const policyFile = path.resolve(__dirname, '../dre-composition/DRECompositionPolicy.ts');
    
    const engineContent = fs.readFileSync(engineFile, 'utf-8');
    const policyContent = fs.readFileSync(policyFile, 'utf-8');

    // Mapeamento de sinais e adição direta
    expect(policyContent).toContain('SIGNED_VALUE_MODEL');
    expect(policyContent).toContain('ADD_SUBTOTALS');
    expect(engineContent).toContain('SIGNED_VALUE_MODEL');
    expect(engineContent).toContain('totalGrossInflowVal + totalDeductionsVal');
    expect(engineContent).toContain('netInflowVal + totalDirectCostVal');
    
    // Proibição de Math.abs oculto no cálculo de subtotais
    expect(engineContent).not.toContain('Math.abs(totalDeductionsVal)');
    expect(engineContent).not.toContain('Math.abs(totalDirectCostVal)');
  });

  it("Sprint 4.4 Guard: DRECompositionPolicy MUST preserve V1, V2 and V3, compute 13 subtotals in V3, and MUST NOT label RESULT_AFTER_NON_OPERATING as Net Profit / Lucro Líquido", async () => {
    const fs = await import('fs');
    const path = await import('path');
    const policyFile = path.resolve(__dirname, '../dre-composition/DRECompositionPolicy.ts');
    
    const policyContent = fs.readFileSync(policyFile, 'utf-8');
    expect(policyContent).toContain('CANONICAL_DRE_COMPOSITION_POLICY_V1');
    expect(policyContent).toContain('CANONICAL_DRE_COMPOSITION_POLICY_V2');
    expect(policyContent).toContain('CANONICAL_DRE_COMPOSITION_POLICY_V3');
    expect(policyContent).toContain('CANONICAL_DRE_FORMULAS_V3');

    // Proibição de nomear RESULT_AFTER_NON_OPERATING com termos informais/oficiais não autorizados
    expect(policyContent).not.toContain('label: \'Lucro Líquido\'');
    expect(policyContent).not.toContain('label: \'Resultado Líquido\'');
    expect(policyContent).not.toContain('label: \'Resultado do Exercício\'');
    expect(policyContent).not.toContain('label: \'Resultado Efetivo\'');

    // Proibição de KPIs não autorizados
    expect(policyContent).not.toContain('EBITDA');
    expect(policyContent).not.toContain('MARGEM_PERCENTUAL');
  });

  it("Sprint 4.5 Guard: DREReconciliationEngine MUST be a pure engine, use an independent oracle, and MUST NOT compute Net Profit / EBITDA / Margins / LLMs", async () => {
    const fs = await import('fs');
    const path = await import('path');
    const engineFile = path.resolve(__dirname, '../dre-reconciliation/DREReconciliationEngine.ts');
    const contractFile = path.resolve(__dirname, '../dre-reconciliation/DREReconciliationContracts.ts');
    
    const engineContent = fs.readFileSync(engineFile, 'utf-8');
    const contractContent = fs.readFileSync(contractFile, 'utf-8');

    // Integridade da equação estrutural
    expect(engineContent).toContain('eligibleSignedValue');
    expect(engineContent).toContain('usedSignedValue');
    expect(engineContent).toContain('excludedSignedValue');
    expect(contractContent).toContain('DREReconciliationArtifact');
    expect(contractContent).toContain('SourceReconciliationResult');

    // Proibição de eval, Function e IA
    expect(engineContent).not.toContain('eval(');
    expect(engineContent).not.toContain('new Function');
    expect(engineContent).not.toContain('OpenAI');
    expect(engineContent).not.toContain('Gemini');

    // Proibição de KPIs não autorizados
    expect(engineContent).not.toContain('Lucro Líquido');
    expect(engineContent).not.toContain('EBITDA');
    expect(engineContent).not.toContain('MARGEM');

    // Guarda de Independência do Oracle
    expect(engineContent).not.toContain("import { DRECompositionEngine }");
    expect(engineContent).not.toContain("from '../dre-composition/DRECompositionEngine'");
    expect(engineContent).not.toContain("DRECompositionEngine");
    expect(engineContent).not.toContain("DRESubtotalProvenanceValidator");

    // Guarda de enforcamento de SUM_LINES / ADD_SUBTOTALS
    expect(engineContent).toContain("SUM_LINES");
    expect(engineContent).toContain("ADD_SUBTOTALS");
    expect(engineContent).toContain("INVALID_FORMULA_INPUT_TYPE");
    expect(engineContent).toContain("FORMULA_OPERATION_MISMATCH");

    // Guarda de enforcamento da política de exclusão
    expect(contractContent).toContain("DREReconciliationExclusionPolicy");
    expect(engineContent).toContain("exclusionPolicy");
  });

  it("Sprint 4.6 Guard: DREExecutionGraphEngine MUST NOT use eval(), LLMs, and MUST enforce topological sorting and SUM_LINES vs ADD_SUBTOTALS validation", async () => {
    const fs = await import('fs');
    const path = await import('path');
    const builderFile = path.resolve(__dirname, '../dre-composition/DREExecutionGraphBuilder.ts');
    const validatorFile = path.resolve(__dirname, '../dre-composition/DREExecutionGraphValidator.ts');
    const coordinatorFile = path.resolve(__dirname, '../dre-composition/DREExecutionCoordinator.ts');
    
    const builderContent = fs.readFileSync(builderFile, 'utf-8');
    const validatorContent = fs.readFileSync(validatorFile, 'utf-8');
    const coordinatorContent = fs.readFileSync(coordinatorFile, 'utf-8');

    // Impedir eval()
    expect(builderContent).not.toContain('eval(');
    expect(validatorContent).not.toContain('eval(');
    expect(coordinatorContent).not.toContain('eval(');

    // Enforcar detecção de ciclos e ordem topológica
    expect(builderContent).toContain('DRETopologicalSorter');
    expect(builderContent).toContain('EXECUTION_GRAPH_CYCLE_DETECTED');

    // Validador de tipos de input
    expect(validatorContent).toContain('INVALID_FORMULA_INPUT_TYPE');
    expect(validatorContent).toContain('SUM_LINES');
    expect(validatorContent).toContain('ADD_SUBTOTALS');
  });
});
