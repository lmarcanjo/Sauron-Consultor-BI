/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ModuleId,
  ModuleActivationStatus,
  ModuleActivationProjection,
  ModuleActivationInput,
  ModuleRequirement,
  ModulePrimaryAction
} from './ModuleActivationContracts';
import type { PreliminaryFieldUsage } from '../preliminary-analysis/PreliminaryFinancialAnalysisContracts';

// ---------------------------------------------------------------------------
// Internal definitions — module requirement catalog
// ---------------------------------------------------------------------------

interface FieldRequirementDef {
  requirementId: string;
  label: string;
  description: string;
  semanticRoles: string[];
  physicalNamePatterns: RegExp[];
}

interface ModuleDefinition {
  moduleId: ModuleId;
  label: string;
  requiredFields: FieldRequirementDef[];
  optionalFields: FieldRequirementDef[];
}

const MODULE_DEFINITIONS: readonly ModuleDefinition[] = [
  {
    moduleId: 'FINANCIAL',
    label: 'Financeiro',
    requiredFields: [
      { requirementId: 'FIN_VALUE', label: 'Valor', description: 'Coluna de valor monetário (Valor, Valor Total)', semanticRoles: ['VALUE'], physicalNamePatterns: [/^valor$/i, /^valor\s*total$/i] },
    ],
    optionalFields: [
      { requirementId: 'FIN_PAID', label: 'Valor Pago', description: 'Coluna de valor pago', semanticRoles: ['PAID_VALUE'], physicalNamePatterns: [/^valor\s*pago$/i] },
      { requirementId: 'FIN_BALANCE', label: 'Saldo', description: 'Coluna de saldo', semanticRoles: ['BALANCE'], physicalNamePatterns: [/^saldo$/i] },
      { requirementId: 'FIN_EMISSION', label: 'Emissão', description: 'Data de emissão', semanticRoles: ['EMISSION_DATE'], physicalNamePatterns: [/^emiss[ãa]o$/i] },
      { requirementId: 'FIN_DUE', label: 'Vencimento', description: 'Data de vencimento', semanticRoles: ['DUE_DATE'], physicalNamePatterns: [/^vencimento$/i] },
      { requirementId: 'FIN_PAYMENT_DATE', label: 'Pagamento', description: 'Data de pagamento', semanticRoles: ['PAYMENT_DATE'], physicalNamePatterns: [/^pagamento$/i] },
      { requirementId: 'FIN_SITUATION', label: 'Situação', description: 'Status do lançamento', semanticRoles: ['SITUATION'], physicalNamePatterns: [/^situa[çc][ãa]o$/i] },
      { requirementId: 'FIN_PERSON', label: 'Pessoa', description: 'Cliente ou fornecedor', semanticRoles: ['PERSON'], physicalNamePatterns: [/^pessoa$/i, /^cliente$/i] },
      { requirementId: 'FIN_ACCOUNT', label: 'Conta Contábil', description: 'Conta contábil', semanticRoles: ['ACCOUNT'], physicalNamePatterns: [/^conta\s*cont[áa]bil$/i] },
      { requirementId: 'FIN_RESULT_CENTER', label: 'Centro de Resultado', description: 'Centro de resultado ou custo', semanticRoles: ['RESULT_CENTER'], physicalNamePatterns: [/^centro\s*de\s*resultado$/i, /^centro\s*de\s*custo$/i] },
      { requirementId: 'FIN_BUSINESS_UNIT', label: 'Unidade de Negócio', description: 'Unidade de negócio', semanticRoles: ['BUSINESS_UNIT'], physicalNamePatterns: [/^unidade\s*de\s*neg[óo]cio$/i] },
      { requirementId: 'FIN_PAYMENT_METHOD', label: 'Forma de Pagamento', description: 'Forma de pagamento', semanticRoles: ['PAYMENT_METHOD'], physicalNamePatterns: [/^forma\s*de\s*pagamento$/i] },
    ],
  },
  {
    moduleId: 'COMMERCIAL',
    label: 'Comercial',
    requiredFields: [
      { requirementId: 'COM_CUSTOMER', label: 'Cliente', description: 'Identificação do cliente ou pessoa compradora', semanticRoles: ['PERSON'], physicalNamePatterns: [/^cliente$/i, /^pessoa$/i, /^comprador$/i] },
      { requirementId: 'COM_PRODUCT', label: 'Produto', description: 'Identificação do produto ou serviço vendido', semanticRoles: [], physicalNamePatterns: [/^produto$/i, /^item$/i, /^servi[çc]o$/i, /^descri[çc][ãa]o\s*produto$/i] },
      { requirementId: 'COM_VALUE', label: 'Valor da Venda', description: 'Valor monetário da venda', semanticRoles: ['VALUE'], physicalNamePatterns: [/^valor$/i, /^total$/i, /^valor\s*venda$/i] },
    ],
    optionalFields: [
      { requirementId: 'COM_QUANTITY', label: 'Quantidade', description: 'Quantidade vendida', semanticRoles: [], physicalNamePatterns: [/^quantidade$/i, /^qtd$/i, /^qtde$/i] },
      { requirementId: 'COM_REP', label: 'Representante', description: 'Vendedor ou representante comercial', semanticRoles: [], physicalNamePatterns: [/^representante$/i, /^vendedor$/i, /^consultor$/i] },
      { requirementId: 'COM_DATE', label: 'Data da Venda', description: 'Data da transação comercial', semanticRoles: ['EMISSION_DATE'], physicalNamePatterns: [/^data$/i, /^data\s*venda$/i] },
    ],
  },
  {
    moduleId: 'INVENTORY',
    label: 'Estoque',
    requiredFields: [
      { requirementId: 'INV_ITEM', label: 'Item / Produto', description: 'Identificação do item em estoque', semanticRoles: [], physicalNamePatterns: [/^item$/i, /^produto$/i, /^material$/i, /^c[óo]digo$/i] },
      { requirementId: 'INV_QTY', label: 'Quantidade', description: 'Quantidade em estoque', semanticRoles: [], physicalNamePatterns: [/^quantidade$/i, /^qtd$/i, /^estoque$/i, /^saldo\s*estoque$/i] },
    ],
    optionalFields: [
      { requirementId: 'INV_LOCATION', label: 'Localização', description: 'Local de armazenamento', semanticRoles: [], physicalNamePatterns: [/^local$/i, /^armaz[ée]m$/i, /^dep[óo]sito$/i] },
      { requirementId: 'INV_COST', label: 'Custo', description: 'Custo unitário ou total', semanticRoles: [], physicalNamePatterns: [/^custo$/i, /^custo\s*unit[áa]rio$/i, /^pre[çc]o$/i] },
      { requirementId: 'INV_DATE', label: 'Data', description: 'Data de referência do estoque', semanticRoles: [], physicalNamePatterns: [/^data$/i, /^refer[êe]ncia$/i] },
    ],
  },
  {
    moduleId: 'ITEMS',
    label: 'Itens',
    requiredFields: [
      { requirementId: 'ITM_ID', label: 'Identificador de Item', description: 'Código ou descrição do item/produto', semanticRoles: [], physicalNamePatterns: [/^item$/i, /^produto$/i, /^c[óo]digo$/i, /^descri[çc][ãa]o$/i, /^material$/i] },
    ],
    optionalFields: [
      { requirementId: 'ITM_QTY', label: 'Quantidade', description: 'Quantidade do item', semanticRoles: [], physicalNamePatterns: [/^quantidade$/i, /^qtd$/i] },
      { requirementId: 'ITM_VALUE', label: 'Valor', description: 'Valor unitário ou total', semanticRoles: ['VALUE'], physicalNamePatterns: [/^valor$/i, /^pre[çc]o$/i] },
      { requirementId: 'ITM_CATEGORY', label: 'Categoria', description: 'Categoria ou grupo do item', semanticRoles: [], physicalNamePatterns: [/^categoria$/i, /^grupo$/i, /^tipo$/i] },
      { requirementId: 'ITM_BRAND', label: 'Marca', description: 'Marca do item', semanticRoles: [], physicalNamePatterns: [/^marca$/i, /^fabricante$/i] },
    ],
  },
  {
    moduleId: 'AFTER_SALES',
    label: 'Pós-Vendas',
    requiredFields: [
      { requirementId: 'AFS_CUSTOMER', label: 'Cliente / Pessoa', description: 'Identificação do cliente no pós-venda', semanticRoles: ['PERSON'], physicalNamePatterns: [/^cliente$/i, /^pessoa$/i] },
      { requirementId: 'AFS_DATE', label: 'Data', description: 'Data do atendimento ou evento', semanticRoles: ['EMISSION_DATE', 'PAYMENT_DATE'], physicalNamePatterns: [/^data$/i, /^data\s*atendimento$/i] },
      { requirementId: 'AFS_SERVICE', label: 'Evento / Serviço', description: 'Tipo de serviço, atendimento ou evento pós-venda', semanticRoles: [], physicalNamePatterns: [/^servi[çc]o$/i, /^atendimento$/i, /^evento$/i, /^tipo\s*servi[çc]o$/i, /^os$/i, /^ordem\s*servi[çc]o$/i] },
    ],
    optionalFields: [
      { requirementId: 'AFS_VALUE', label: 'Valor', description: 'Valor do serviço', semanticRoles: ['VALUE'], physicalNamePatterns: [/^valor$/i] },
      { requirementId: 'AFS_STATUS', label: 'Status', description: 'Status do atendimento', semanticRoles: ['SITUATION'], physicalNamePatterns: [/^status$/i, /^situa[çc][ãa]o$/i] },
    ],
  },
];

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class ModuleActivationService {
  /**
   * Resolve activation projections for ALL modules.
   * Pure function based on artifact data — no DOM, no localStorage, no calculations.
   */
  public resolveModules(input: ModuleActivationInput): ModuleActivationProjection[] {
    return MODULE_DEFINITIONS.map(def => this.resolveModule(def, input));
  }

  /**
   * Resolve a single module by ID.
   */
  public resolveModuleById(moduleId: ModuleId, input: ModuleActivationInput): ModuleActivationProjection {
    const def = MODULE_DEFINITIONS.find(d => d.moduleId === moduleId);
    if (!def) {
      return {
        moduleId,
        status: 'ERROR',
        requirements: [],
        availableMetrics: [],
        availableDimensions: [],
        missingRequirements: [],
        limitations: [`Módulo ${moduleId} não possui definição.`],
        primaryAction: 'NONE',
        sourceFileName: '',
        lastUpdated: new Date().toISOString(),
      };
    }
    return this.resolveModule(def, input);
  }

  private resolveModule(def: ModuleDefinition, input: ModuleActivationInput): ModuleActivationProjection {
    const { preliminaryArtifact } = input;

    // No artifact at all → INSUFFICIENT_DATA
    if (!preliminaryArtifact) {
      return this.buildProjection(def, 'INSUFFICIENT_DATA', [], [], [], ['Nenhuma análise preliminar disponível. Importe e analise uma fonte de dados.'], 'CHANGE_SOURCE', '', '');
    }

    // Artifact invalidated → BLOCKED
    if (preliminaryArtifact.status === 'INVALIDATED') {
      return this.buildProjection(
        def, 'BLOCKED', [], [], [],
        ['O artefato de análise foi invalidado. Execute uma nova análise.'],
        'CHANGE_SOURCE',
        preliminaryArtifact.sourceFileName,
        preliminaryArtifact.generatedAt
      );
    }

    // Resolve requirements against physical fields
    const physicalFields = preliminaryArtifact.physicalFields || [];
    const fieldUsages = preliminaryArtifact.fieldUsages || {};
    const requirements = this.resolveRequirements(def, physicalFields, fieldUsages);

    const missingRequired = requirements.filter(
      r => r.status === 'MISSING' && def.requiredFields.some(rf => rf.requirementId === r.requirementId)
    );
    const satisfiedRequired = requirements.filter(
      r => r.status === 'SATISFIED' && def.requiredFields.some(rf => rf.requirementId === r.requirementId)
    );

    // Available metrics and dimensions from artifact
    const availableMetrics = (preliminaryArtifact.metrics || []).map(m => m.code);
    const availableDimensions = (preliminaryArtifact.groupings || []).map(g => g.dimensionCode);
    const limitations = (preliminaryArtifact.limitations || []).map(l => l.message);

    // --- FINANCIAL special case ---
    if (def.moduleId === 'FINANCIAL') {
      const hasValueMetric = availableMetrics.includes('VALUE_TOTAL');
      if (hasValueMetric) {
        return this.buildProjection(
          def, 'ACTIVE', requirements, availableMetrics, availableDimensions,
          limitations, 'OPEN_DASHBOARD',
          preliminaryArtifact.sourceFileName,
          preliminaryArtifact.generatedAt
        );
      }
      return this.buildProjection(
        def, 'INSUFFICIENT_DATA', requirements, availableMetrics, availableDimensions,
        [...limitations, 'Nenhuma coluna de valor monetário foi identificada na fonte.'],
        'REVIEW_FIELDS',
        preliminaryArtifact.sourceFileName,
        preliminaryArtifact.generatedAt
      );
    }

    // --- Other modules: all required fields must exist before configuration can activate ---
    // A configuration can associate fields that were found in the artifact, but
    // it cannot manufacture a missing physical column.
    if (missingRequired.length > 0) {
      return this.buildProjection(
        def, 'INSUFFICIENT_DATA', requirements, availableMetrics, availableDimensions,
        [...limitations, `Campos necessários não identificados: ${missingRequired.map(r => r.label).join(', ')}.`],
        'CHANGE_SOURCE',
        preliminaryArtifact.sourceFileName,
        preliminaryArtifact.generatedAt
      );
    }

    const configuredRequired = def.requiredFields.every(required => {
      const requirement = requirements.find(item => item.requirementId === required.requirementId);
      if (!requirement) return false;
      return Boolean(input.configuration?.selectedFields.some(field => requirement.matchingPhysicalFields.includes(field)));
    });

    if (configuredRequired) {
      return this.buildProjection(
        def, 'ACTIVE', requirements, availableMetrics, availableDimensions,
        limitations, 'OPEN_DASHBOARD',
        preliminaryArtifact.sourceFileName,
        preliminaryArtifact.generatedAt
      );
    }

    if (satisfiedRequired.length === def.requiredFields.length) {
      return this.buildProjection(
        def, 'REQUIRES_CONFIGURATION', requirements, availableMetrics, availableDimensions,
        limitations, 'CONFIGURE',
        preliminaryArtifact.sourceFileName,
        preliminaryArtifact.generatedAt
      );
    }

    // A definition without required fields is not currently used, but remains
    // explicit so a new catalog entry cannot produce a blank screen.
    return this.buildProjection(
      def, 'INSUFFICIENT_DATA', requirements, availableMetrics, availableDimensions,
      limitations, 'CHANGE_SOURCE',
      preliminaryArtifact.sourceFileName,
      preliminaryArtifact.generatedAt
    );
  }

  // -------------------------------------------------------------------------
  // Requirement resolution
  // -------------------------------------------------------------------------

  private resolveRequirements(
    def: ModuleDefinition,
    physicalFields: readonly PreliminaryFieldUsage[],
    fieldUsages: Record<string, string>
  ): ModuleRequirement[] {
    const allFieldDefs = [...def.requiredFields, ...def.optionalFields];
    return allFieldDefs.map(fieldDef => {
      const matching = this.findMatchingFields(fieldDef, physicalFields, fieldUsages);
      const isRequired = def.requiredFields.some(rf => rf.requirementId === fieldDef.requirementId);
      return {
        requirementId: fieldDef.requirementId,
        label: fieldDef.label,
        description: fieldDef.description,
        status: matching.length > 0 ? 'SATISFIED' as const : (isRequired ? 'MISSING' as const : 'OPTIONAL' as const),
        matchingPhysicalFields: matching,
      };
    });
  }

  private findMatchingFields(
    fieldDef: FieldRequirementDef,
    physicalFields: readonly PreliminaryFieldUsage[],
    fieldUsages: Record<string, string>
  ): string[] {
    const matched: string[] = [];

    // 1. Check by semantic role in physicalFields
    for (const pf of physicalFields) {
      if (pf.usageStatus !== 'USED') continue;
      if (pf.semanticRole && fieldDef.semanticRoles.includes(pf.semanticRole)) {
        matched.push(pf.displayName || pf.physicalName);
      }
    }

    // 2. Check by physical name patterns (fallback)
    if (matched.length === 0) {
      for (const pf of physicalFields) {
        for (const pattern of fieldDef.physicalNamePatterns) {
          if (pattern.test(pf.physicalName)) {
            matched.push(pf.displayName || pf.physicalName);
            break;
          }
        }
      }
    }

    // 3. Check by fieldUsages map (semantic key → physical name)
    if (matched.length === 0) {
      for (const semanticRole of fieldDef.semanticRoles) {
        const physicalName = fieldUsages[semanticRole.toLowerCase()];
        if (physicalName) {
          matched.push(physicalName);
        }
      }
    }

    return [...new Set(matched)];
  }

  // -------------------------------------------------------------------------
  // Projection builder
  // -------------------------------------------------------------------------

  private buildProjection(
    def: ModuleDefinition,
    status: ModuleActivationStatus,
    requirements: readonly ModuleRequirement[],
    availableMetrics: readonly string[],
    availableDimensions: readonly string[],
    limitations: readonly string[],
    primaryAction: ModulePrimaryAction,
    sourceFileName: string,
    lastUpdated: string
  ): ModuleActivationProjection {
    return {
      moduleId: def.moduleId,
      status,
      requirements,
      availableMetrics,
      availableDimensions,
      missingRequirements: requirements.filter(r => r.status === 'MISSING').map(r => r.label),
      limitations: [...limitations],
      primaryAction,
      sourceFileName,
      lastUpdated,
    };
  }
}

export { MODULE_DEFINITIONS };

export const moduleActivationService = new ModuleActivationService();
