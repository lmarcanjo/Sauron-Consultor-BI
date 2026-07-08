# Engine Performance Baseline

Data da medição: 2026-07-08T18:36:46.047Z

Workbook medido:

- Arquivo: `Teste_Automação_Peças Honda Faberge Mogi~06.26 Veiculo ativou.xlsx`
- Caminho local: `/home/natalicorreia/Downloads/Teste_Automação_Peças Honda Faberge Mogi~06.26 Veiculo ativou.xlsx`
- Tamanho: 1.8 MB
- Abas: 21
- Linhas catalogadas: 38.179
- Colunas máximas: 183
- Células estimadas: 3.203.186
- Fórmulas catalogadas: 194.143
- Runtime: Node v22.17.0, Linux x64

## Tempos por Engine

| Engine | Tempo | Heap delta | Heap após etapa |
|---|---:|---:|---:|
| WorkbookEngine | 9.454,4 ms | +192,8 MB | 277,0 MB |
| ReverseEngineering | 423,3 ms | +26,0 MB | 303,0 MB |
| KnowledgeGraph | 13.961,8 ms | +874,7 MB | 1.177,8 MB |
| RuleEngine | 9.942,6 ms | +76,3 MB | 1.254,1 MB |
| BusinessIntelligenceEngine | 3.056,2 ms | +490,0 MB | 1.744,1 MB |
| ExecutiveDashboardEngine | 8.239,3 ms | -524,4 MB | 1.219,8 MB |

## Volumes Gerados

- Nós do Knowledge Graph: 195.022
- Arestas do Knowledge Graph: 1.141.322
- Regras candidatas: 15
- Blocos executivos no dashboard principal: 6

## Leitura da Medição

- `WorkbookEngine` é aceitável localmente para uma planilha de 1,8 MB, mas já carrega workbook completo para catalogação.
- `ReverseEngineering` é rápido porque opera sobre o catálogo já materializado.
- `KnowledgeGraph` é o maior gargalo estrutural: muitas fórmulas e dependências geram alto volume de nós/arestas.
- `RuleEngine` é custoso por parse/classificação de fórmulas candidatas em cima de um catálogo grande.
- `BusinessIntelligenceEngine` ficou pesado por leitura repetida de linhas reais por métrica.
- `ExecutiveDashboardEngine` agrega métricas, rankings e tabelas; deve compartilhar cache de linhas com BI para reduzir custo.

## Recomendações

1. Produção online deve executar `WorkbookEngine`, `KnowledgeGraph` e `RuleEngine` em backend/worker assíncrono.
2. Persistir `WorkbookCatalog`, `ReverseReport`, `KnowledgeGraph` e `BusinessRule[]` em storage/banco; frontend deve receber apenas resumos paginados.
3. Adicionar cache por aba no contexto do `BusinessIntelligenceEngine` e `ExecutiveDashboardEngine`.
4. Limitar construção inicial do grafo:
   - grafo resumido por aba/módulo no frontend;
   - grafo completo apenas sob demanda no backend.
5. Criar thresholds:
   - se fórmulas > 50.000, grafo completo somente em worker;
   - se células > 1.000.000, evitar execução no browser;
   - se arestas > 250.000, paginação obrigatória no visualizador de grafo.
6. Manter IndexedDB como fallback local, mas não como estratégia de produção para processamento completo.

## Conclusão

O pipeline F8.1→F8.5 funciona com a planilha Honda, mas a construção completa do Knowledge Graph e a releitura de linhas por BI/Dashboard são os pontos que impedem processamento seguro no navegador em produção. A arquitetura já aponta para backend/worker; a próxima consolidação deve transformar row access, grafo e regras em serviços persistidos e paginados.
