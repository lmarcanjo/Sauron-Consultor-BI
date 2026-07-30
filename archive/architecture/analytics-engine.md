# Analytics Engine Architecture

O motor de análise do Sauron é composto por engines determinísticos focados em transformar dados financeiros e operacionais em insights acionáveis sem dependência de IA generativa.

## Fluxo Analítico

1. **Entrada de Dados**: `AnalysisContext` agrega dados reais (DRE, KPIs, Lançamentos, etc).
2. **Processamento**: Motores independentes realizam análises específicas baseadas em regras consultivas:
   - **RecommendationEngine**: Gera recomendações baseadas em desvios de margem e despesas.
   - **TrendEngine**: Calcula variações reais de performance (crescimento/queda).
   - **BenchmarkEngine**: Compara performance entre lojas/empresas com ranking.
   - **AnomalyEngine**: Detecta anomalias financeiras relevantes.
   - **NarrativeEngine**: Converte achados em texto executivo didático.

## Integração com Workspace

Os resultados (recomendações, anomalias, tendências, benchmarks) são persistidos no `WorkspaceProject` através do `ConsultantWorkspaceManager`, permitindo histórico e auditoria.

## Futuras Integrações com IA

A arquitetura foi desenhada para permitir que no futuro um LLM possa ser acoplado ao `AnalyticsEngine` para enriquecer as narrativas ou sugerir recomendações mais complexas, mas todos os diagnósticos fundamentais permanecem determinísticos.
