# RC1 Enterprise Certification

Data: 2026-07-15

## Estado atual

RC-1 executada como sprint de hardening incremental. Não houve recriação de arquitetura, troca de stack ou alteração do importador pesado.

Estado validado:

- Importação real funcionando e persistindo após reload.
- Dashboard, Central de Dados, DRE/KPIs, Pessoas, Comercial/diagnóstico, apresentação, sessão, ata, plano e histórico abrem sem tela branca.
- Fluxo normal sem fallback automático para demo/mock.
- Termos proibidos removidos de produção fora dos Domain Packs.
- Story templates não carregam mais indicadores numéricos fictícios.
- Sessão executiva não exibe mais valores financeiros hardcoded; usa dados reais agregados quando disponíveis ou mostra configuração pendente.

## Bugs encontrados

| Área | Causa | Impacto | Correção | Evidência |
|---|---|---|---|---|
| Playwright boot/login | Helpers não tratavam primeiro acesso/login de forma resiliente e falhavam quando o app montava com atraso. | Falsos negativos e telas aparentemente quebradas no smoke. | `ensureConsultantSession` passou a inicializar/login com recarga única e espera explícita pela UI. | Playwright 17/17. |
| Playwright navegação | Helper clicava botões fora do menu lateral quando havia textos iguais no conteúdo/header. | Navegação para módulos errados ou drawer em vez de rota. | `navigateSidebar` escopado ao `aside`. | Full navigation E2E 25 áreas navegadas. |
| Playwright upload paralelo | Specs geravam o mesmo arquivo `varejo_teste.xlsx` no mesmo diretório. | `NotReadableError` e importações intermitentes. | Fixtures passam a usar diretório único por `testInfo.outputPath`. | ActiveDataset/import specs verdes. |
| Central de Dados | Drawer exibia status técnico/integrações como saudáveis sem fonte real. | Consultor via informação falsa. | Status neutro: fonte ausente, configuração pendente e logs de origem reais. | E2E sem mock/demo visível. |
| Sessão Executiva | Gráficos e números fixos em receita, margem, custos, comercial e pessoas. | Quebra da consistência planilha → dashboard → apresentação/ata/plano. | Agregação simples via `filteredData`; sem coluna suficiente, mostra configuração pendente. | Busca de hardcodes da sessão limpa; Playwright verde. |
| Story Engine | Templates e seeds carregavam indicadores fictícios. | Decks podiam parecer preenchidos com dados reais. | Seeds somente em teste; templates sem indicadores default. | Vitest Story atualizado e verde. |
| Módulos legados | SDLStudio, CompensationEngine, WorkspaceDNAEngine e DigitalTwin tinham exemplos setoriais. | Resíduos visuais e risco de demo parecer dado real. | Exemplos neutralizados ou removidos do fluxo normal. | Varredura case-insensitive zerada fora dos Domain Packs. |

## Bugs corrigidos

- Removido `DEMO_DATA` dos tipos públicos de fonte ativa; manager ainda bloqueia valor legado defensivamente.
- Removidos textos e placeholders com termos proibidos no Core/UI.
- Neutralizados seeds de pessoas, compensação, digital twin, história e atividades.
- Módulos de estoque/itens/comissões sem fonte real agora mostram “Nenhuma fonte de dados ativa.” ou “Configuração pendente”.
- Importação E2E usa diretórios isolados para evitar colisão em paralelo.
- Navegação E2E valida o menu lateral real.

## Melhorias de UX

- Estado vazio mais claro: “Nenhuma fonte de dados ativa.”
- Central de Dados deixou de exibir infraestrutura simulada como saudável.
- Sessão executiva evita números inventados e orienta configuração pendente.
- Biblioteca de Workbooks validada pelo caminho real da UI.
- Linguagem visível ficou neutra para consultores de qualquer segmento.

## Módulos legados

| Módulo | Utilizado? | Resíduo encontrado | Ação RC-1 |
|---|---:|---|---|
| SDLStudio | Apenas super admin | Dados artificiais e cliente/marca fictícios | Amostras neutralizadas. |
| WorkspaceDNAEngine | Sim, contexto consultivo | Default setorial específico | Default alterado para operação geral. |
| CompensationEngine | Sim, Pessoas/Comissão | Políticas com nomes setoriais | Políticas renomeadas para performance/volume padrão. |
| EnterpriseDigitalTwinTab | Sim | Placeholders setoriais | Textos neutralizados. |
| ExecutiveSession | Sim | Números hardcoded | Usa dados reais agregados ou pendência. |
| Story Engine | Sim | Seeds/templates com métricas fictícias | Seeds restritos a teste; templates sem métricas default. |

## Validação

- Typecheck: `npm run typecheck` passou.
- Vitest: `63` arquivos, `324` testes, `324` verdes.
- Build: `npm run build` passou.
- Playwright: `17` testes, `17` verdes.
- Varredura de nomenclatura: `rg -ni` para termos proibidos em `src`, excluindo Domain Packs, retornou zero ocorrências.

## Performance

- Build Vite: concluído com sucesso.
- Bundle principal: `1,740.56 kB`, gzip `467.33 kB`.
- Chunk XLSX: `429.53 kB`, gzip `143.08 kB`.
- Risco não bloqueante: Vite ainda alerta chunk acima de 500 kB. Não quebra demonstração, mas deve entrar em sprint futura de code splitting.

## Consistência dos dados

- Home/Dashboard e módulos obrigatórios usam ActiveDataset, preview, metadata ou configuração pendente.
- Sessão executiva não usa mais números fixos para receita, margem, custos, comercial ou pessoas.
- Templates de apresentação não criam indicadores fictícios.
- Quando não há mapeamento suficiente, a interface não inventa valor e solicita configuração.

## Evidências

- `npm run typecheck`: OK.
- `npm test`: 324/324.
- `npm run build`: OK.
- `npx playwright test`: 17/17.
- E2E cobre importação, ativação, reload, Central de Dados, Dashboard, KPIs/DRE, navegação completa, biblioteca e workbook real.

## Itens restantes

- Recomendada otimização futura de bundle/chunks.
- Aviso técnico existente em Vitest: `vi.mock("pg")` não está no topo do módulo. Não falha a suíte hoje, mas deve ser ajustado antes de upgrade de Vitest.

## Parecer final

✅ Aprovado para demonstração Enterprise

Motivo: os bloqueadores da RC-1 foram corrigidos, a suíte E2E está verde, os testes unitários estão verdes, o build passa, a nomenclatura proibida saiu do Core/UI normal, e o sistema não exibe mais dados fictícios no fluxo principal.
