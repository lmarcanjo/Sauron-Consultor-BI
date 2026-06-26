# Analytics Engine Architecture

O motor de análise do Sauron é composto por engines determinísticos focados em transformar dados financeiros e operacionais em insights acionáveis sem dependência de IA generativa.

## Fluxo Analítico

1. **Entrada de Dados**: `AnalysisContext` agrega KPIs, DRE, centros de custo e indicadores.
2. **Processamento**: Motores independentes realizam análises específicas (Tendência, Anomalia, Benchmark, Recomendação).
3. **Narrativa**: `NarrativeEngine` converte os achados em texto executivo.

## Motores

- **RecommendationEngine**: Identifica problemas e oportunidades baseados em regras.
- **TrendEngine**: Calcula tendências sazonais e de crescimento.
- **BenchmarkEngine**: Compara performance entre entidades.
- **AnomalyEngine**: Detecta comportamentos atípicos.
- **NarrativeEngine**: Gera resumos inteligentes via templates.

## Integração

Integra-se diretamente com o `ConsultantWorkspaceManager` e `PresentationManager` para disponibilizar os insights diretamente na área de trabalho do consultor.
