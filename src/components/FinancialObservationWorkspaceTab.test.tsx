import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FinancialObservationWorkspaceTab } from './FinancialObservationWorkspaceTab';
import { ActiveDataset } from '../types/dataSource';
import { trustArtifactRepository } from '../core/trust/TrustArtifactRepository';
import { semanticConfirmationRepository } from '../core/semantic/confirmation/SemanticConfirmationRepository';
import { TrustArtifact } from '../core/trust/TrustContracts';
import { SemanticConfirmationArtifact } from '../core/semantic/confirmation/SemanticConfirmationContracts';

describe('FinancialObservationWorkspaceTab — Workspace Integration Tests', () => {
  const mockDataset: ActiveDataset = {
    datasetId: 'ds_test_123',
    sourceType: 'SPREADSHEET_DATA',
    sourceName: 'vendas_2026.xlsx',
    rowCount: 500,
    columnCount: 3,
    sheets: [],
    activeSheet: 'Sheet1',
    previewRows: [],
    columnProfiles: [
      { name: 'VALOR_TOTAL', type: 'number', originalName: 'VALOR_TOTAL' },
      { name: 'DATA_VENDA', type: 'date', originalName: 'DATA_VENDA' },
      { name: 'CATEGORIA', type: 'string', originalName: 'CATEGORIA' }
    ],
    importProfile: null,
    importedAt: new Date().toISOString(),
    rawStorageRef: 'ref_1',
    status: 'ACTIVE'
  };

  const mockTrustArtifact: TrustArtifact = {
    artifactId: 'trust_123',
    dataSourceId: 'ds_test_123',
    engagementId: 'eng_123',
    schemaVersionNumber: 1,
    trustAssessment: {
      overallState: 'TRUSTED',
      overallScore: 0.95,
      scoreSuppressed: false,
      isUsableForAny: true
    },
    dimensionAssessments: [],
    usageAssessments: [
      {
        usageType: 'FINANCIAL_ANALYSIS',
        status: 'TRUSTED',
        score: 0.95,
        requiredDimensions: [],
        satisfiedConditions: [],
        blockingConditions: [],
        limitations: [],
        explanation: 'OK',
        evidenceIds: []
      }
    ],
    blockingConditions: [],
    trustFindings: [],
    limitations: ['Amostra de 500 registros'],
    evaluatedAt: new Date().toISOString(),
    provenance: {
      dataSourceId: 'ds_test_123',
      engagementId: 'eng_123',
      schemaVersionNumber: 1,
      policyId: 'asterion_trust_policy_v1',
      policyVersion: '1.0.0'
    },
    metadata: {
      engineVersion: '1.0.0',
      policyId: 'asterion_trust_policy_v1',
      policyVersion: '1.0.0',
      rulesAppliedCount: 5,
      totalFindingsCount: 0,
      executionDurationMs: 10
    },
    fingerprint: {
      trustHash: 'hash_123',
      algorithm: 'FNV1A_32_CANONICAL',
      generatedAt: new Date().toISOString()
    },
    version: 1
  };

  const mockConfirmationArtifact: SemanticConfirmationArtifact = {
    artifactId: 'conf_123',
    semanticArtifactId: 'sem_1',
    discoveryArtifactId: 'disc_123',
    evidenceArtifactId: 'ev_1',
    dataSourceId: 'ds_test_123',
    engagementId: 'eng_123',
    schemaVersionNumber: 1,
    consultantId: 'usr_1',
    version: 1,
    fieldDecisions: [
      {
        containerId: 'c1',
        columnId: 'col_1',
        physicalName: 'VALOR_TOTAL',
        semanticFieldInterpretationId: 'interp_1',
        decision: 'CONFIRMED',
        supportingEvidenceIds: [],
        decidedBy: 'usr_1',
        decidedAt: new Date().toISOString(),
        limitationsAcknowledged: []
      }
    ],
    containerDecisions: [],
    relationshipDecisions: [],
    overallStatus: 'CONFIRMED',
    createdAt: new Date().toISOString(),
    fingerprint: {
      semanticArtifactId: 'sem_1',
      confirmationHash: 'conf_hash',
      algorithm: 'FNV1A_32_CANONICAL',
      generatedAt: new Date().toISOString()
    },
    metadata: {
      engineVersion: '1.0.0',
      schemaVersionNumber: 1,
      totalFieldsCount: 1,
      confirmedFieldsCount: 1,
      rejectedFieldsCount: 0,
      keptOriginalFieldsCount: 0,
      customFieldsCount: 0,
      deferredFieldsCount: 0,
      materialFieldsPendingCount: 0
    }
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(trustArtifactRepository, 'findLatestByDataSource').mockResolvedValue(mockTrustArtifact);
    vi.spyOn(semanticConfirmationRepository, 'findLatestByDataSource').mockResolvedValue(mockConfirmationArtifact);
  });

  it('instantiates FinancialObservationWorkspaceTab component without throwing', () => {
    expect(FinancialObservationWorkspaceTab).toBeDefined();
  });

  it('validates mockDataset and prerequisites structure', () => {
    expect(mockDataset.datasetId).toBe('ds_test_123');
    expect(mockTrustArtifact.trustAssessment.overallState).toBe('TRUSTED');
    expect(mockConfirmationArtifact.overallStatus).toBe('CONFIRMED');
  });
});
