export type QualityAlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface QualityAlert {
  id: string;
  code: string;
  severity: QualityAlertSeverity;
  message: string;
  containerId?: string;
  columnName?: string;
  metricsImpacted?: string[];
  detectedAt: string;
}

export interface TechnicalRecommendation {
  id: string;
  type: string;
  description: string;
  targetRef: string;
  suggestedAction: string;
  impactScore: number;
}

export interface ColumnQualityMetric {
  columnName: string;
  inferredType: string;
  totalValues: number;
  nullsCount: number;
  nullsPercentage: number;
  distinctValuesCount: number;
  uniquenessPercentage: number;
  duplicationPercentage: number;
  densityPercentage: number;
  isConstant: boolean;
  isEmpty: boolean;
  hasMixedTypes: boolean;
  qualityScore: number; // 0 a 100
}

export interface ContainerQualityMetric {
  containerId: string;
  containerName: string;
  totalRows: number;
  totalColumns: number;
  completenessPercentage: number;
  consistencyPercentage: number;
  uniquenessPercentage: number;
  columnMetrics: ColumnQualityMetric[];
  qualityScore: number; // 0 a 100
}

export interface QualityMetricsSummary {
  overallQualityScore: number; // 0 a 100
  completenessScore: number;
  consistencyScore: number;
  uniquenessScore: number;
  densityScore: number;
  totalContainers: number;
  totalColumns: number;
  totalRowsEvaluated: number;
  emptyColumnsCount: number;
  constantColumnsCount: number;
  mixedTypeColumnsCount: number;
}

export interface QualityArtifact {
  artifactId: string;
  discoveryArtifactId: string;
  dataSourceId: string;
  engagementId: string;
  schemaVersionNumber?: number;
  overallQualityScore?: number;
  metricsSummary?: QualityMetricsSummary;
  containerMetrics?: ContainerQualityMetric[];
  alerts: QualityAlert[];
  recommendations: TechnicalRecommendation[];
  evaluatedAt: string;
  fingerprint?: any;
  metadata?: any;
}
