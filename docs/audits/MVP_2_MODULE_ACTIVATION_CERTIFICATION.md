# MVP-2 Module Activation Certification

Data da certificação final: 2026-08-11  
Fonte validada: `/home/natalicorreia/Downloads/Consulta Financeiro Topp.xls`  
Escopo: Certification Gate final do framework de ativação e da jornada sem
dead ends.

Revalidação final executada em 2026-08-11 sobre o mesmo estado do repositório:
scanner, guards, typecheck, Vitest, Playwright, lint, build e diff check foram
repetidos sem alteração de código produtivo.

## A. O QUE O CONSULTOR CONSEGUE FAZER AGORA

- Importar a planilha Topp pela interface e executar a análise preliminar.
- Abrir Financeiro, Comercial, Estoque, Itens e Pós-vendas pelo menu.
- Ver os dados financeiros reais da análise preliminar, sem recálculo nos
  componentes React.
- Ver, em cada módulo sem dados suficientes, os campos encontrados, os campos
  ausentes e a próxima ação.
- Clicar nas CTAs principais. Quando a fonte não possui os campos necessários,
  a CTA abre a análise da fonte para revisar ou adicionar uma fonte.
- Persistir configurações de módulo pelo `ModuleConfigurationRepository` e
  invalidá-las quando fonte, schema ou engajamento mudam.
- Recarregar a aplicação e recuperar a fonte ativa e o Financeiro.

## B. O QUE AINDA NÃO FUNCIONA

Com a planilha Topp, não é possível ativar Comercial, Estoque, Itens ou
Pós-vendas porque os campos físicos mínimos desses módulos não existem na
fonte. O sistema não inventa esses campos nem oferece um wizard que salvaria
uma configuração impossível.

O caminho de configuração está implementado e coberto por teste de serviço,
mas não há configuração ativa a recuperar na jornada Topp: Comercial,
Estoque, Itens e Pós-vendas terminam em `INSUFFICIENT_DATA`, antes da etapa de
wizard.

## C. ESTADO DOS 5 MÓDULOS

### FINANCEIRO

- **Status:** `ACTIVE`.
- **Dados encontrados:** `Valor`, `Valor Pago`, `Saldo`, `Emissão`,
  `Vencimento`, `Pagamento`, `Situação`, `Pessoa`, `Forma de Pagamento`,
  `Unidade de Negócio`, `Centro de Resultado` e `Conta Contábil`, entre os 18
  campos físicos observados.
- **Dados exibidos:** Valor Total `R$ 8.668.993,62`; Valor Pago
  `R$ 32.479,07`; Saldo `R$ 8.636.514,55`; séries temporais e agrupamentos do
  `PreliminaryFinancialAnalysisArtifact`.
- **Dados ausentes:** nenhuma exigência mínima para a visualização preliminar.
- **CTA:** abrir o Dashboard Financeiro; revisão da fonte permanece disponível.
- **Ação:** renderiza o artefato preliminar persistido.
- **Persistência:** artefato e fonte recuperados após reload.
- **Resultado após reload:** ativo, com os mesmos valores certificados.

### COMERCIAL

- **Status:** `INSUFFICIENT_DATA`.
- **Dados encontrados:** `Pessoa` e `Valor`.
- **Dados ausentes:** `Produto`; `Quantidade` e `Representante` são opcionais
  para o requisito mínimo, mas também não foram identificados.
- **CTA:** `Alterar / Adicionar Fonte`.
- **Ação:** abre a análise da fonte (`analise_estrutura`), sem tela vazia.
- **Persistência:** nenhuma configuração é salva porque falta requisito
  físico; o contrato de configuração é persistido quando os requisitos
  existem.
- **Resultado após reload:** estado explicativo permanece e não aparece o
  encerramento genérico `Configuração pendente`.

### ESTOQUE

- **Status:** `INSUFFICIENT_DATA`.
- **Dados encontrados:** nenhum campo mínimo de estoque identificado na fonte.
- **Dados ausentes:** `Item / Produto` e `Quantidade`.
- **CTA:** `Alterar / Adicionar Fonte`.
- **Ação:** abre a análise da fonte para localizar requisitos ou adicionar
  outra fonte.
- **Persistência:** não há configuração impossível salva.
- **Resultado após reload:** estado explicativo recuperável pelo mesmo fluxo.

### ITENS

- **Status:** `INSUFFICIENT_DATA`.
- **Dados encontrados:** nenhum identificador físico de item/produto
  identificado.
- **Dados ausentes:** `Identificador de Item`; quantidade, valor, categoria e
  marca são opcionais.
- **CTA:** `Alterar / Adicionar Fonte`.
- **Ação:** abre a análise da fonte.
- **Persistência:** nenhuma configuração é salva sem identificador físico.
- **Resultado após reload:** estado explicativo permanece sem dados fictícios.

### PÓS-VENDAS

- **Status:** `INSUFFICIENT_DATA`.
- **Dados encontrados:** `Pessoa` e `Valor`; `Situação` pode ser usado como
  status opcional.
- **Dados ausentes:** `Data` e `Evento / Serviço`.
- **CTA:** `Alterar / Adicionar Fonte`.
- **Ação:** abre a análise da fonte para revisão ou adição de dados.
- **Persistência:** nenhuma configuração é salva sem os requisitos mínimos.
- **Resultado após reload:** estado explicativo permanece, sem pressupor um
  modelo setorial.

## D. INVENTÁRIO DE DEAD ENDS

- **working:** análise da fonte; Dashboard Financeiro; CTAs de alteração de
  fonte; fluxo de oito etapas do `ModuleActivationWizard`; salvar e concluir
  configuração quando requisitos existem.
- **fixed:** wrappers de Financeiro, Comercial, Estoque, Itens e Pós-vendas
  agora delegam exclusivamente ao `ModuleActivationView`; Pós-vendas passou a
  ser rota canônica registrada; guarda arquitetural substituiu a exigência
  obsoleta de renderer direto.
- **disabled_with_reason:** nenhuma CTA principal dos cinco módulos fica
  visualmente ativa sem uma ação; configurações impossíveis não são oferecidas.
- **removed:** caminho concorrente de wrapper com cálculo/renderer legado e o
  termo de vocabulário setorial removido de `PosVendasTab`.
- **remaining_dead_actions:** **0** nos cinco módulos MVP-2.

## E. VOCABULARY BASELINE DIFF

A comparação foi executada antes da atualização explícita da baseline:

| Indicador | Baseline anterior | Varredura atual antes da atualização | Baseline final / check |
| --- | ---: | ---: | ---: |
| `totalFindings` deduplicados | 268 | 267 | 267 |
| `allowedFindings` | 168 | 168 | 168 |
| `trackedDebtFindings` | 100 | 99 | 99 |
| `unauthorizedFindings` | 0 | 0 | 0 |
| `newFindings` | 0 | 0 | 0 |
| `newTrackedDebtFindings` | 0 | 0 | 0 |
| `removedFindings` | 0 | 1 | 0 |

A única diferença foi a remoção factual de
`src/components/PosVendasTab.tsx | serviços | services`, com identidade
`dfcedf4bcf930686`. Nenhuma allowlist foi ampliada, nenhum prefixo genérico foi
adicionado e nenhum finding foi reclassificado artificialmente. Depois da
atualização deliberada, o check terminou com 267/267 e zero diferenças.

## F. TESTES E COMANDOS

| Comando / validação | Resultado | Exit code |
| --- | --- | ---: |
| `npx tsc --noEmit --pretty false` | aprovado | 0 |
| testes focados Module Activation, Repository e Guards | 12/12 | 0 |
| `npx vitest run` | 129 arquivos / 678 testes | 0 |
| `mvp-module-activation.spec.ts` | 1/1 | 0 |
| `mvp-real-financial-spreadsheet.spec.ts` | 1/1 | 0 |
| `mvp-two-consultants-isolation.spec.ts` | 1/1 | 0 |
| Playwright obrigatório combinado (revalidação final) | 3/3 em 22,1s | 0 |
| `npm run quality:domain-vocabulary:check` | 267 atuais; 0 novos; 0 removidos | 0 |
| `npm run lint` | aprovado (typecheck) | 0 |
| `VITE_IMPORT_MODE=local npm run build` | aprovado; warning de chunk conhecido | 0 |
| `git diff --check` | aprovado | 0 |

O build mantém o alerta não bloqueante do bundle principal grande e a
advertência de importação estática/dinâmica já existente. Nenhuma dessas
advertências altera a jornada MVP-2.

## Veredito

MVP-2 MODULE ACTIVATION APROVADO
