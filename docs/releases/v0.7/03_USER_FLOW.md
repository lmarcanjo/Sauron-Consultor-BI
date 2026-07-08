# SAURON SX — USER FLOWS (v0.7)
## Mapeamento de Fluxos e Jornada dos Usuários

Este documento especifica as trilhas de navegação e fluxos passo a passo que o consultor (Carlos) percorre na plataforma Sauron para realizar suas principais atividades de assessoria empresarial.

---

### 1. Fluxo Geral: Do Cadastro de Cliente ao Acompanhamento de Metas

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 1. Novo Cliente │ ───>  │  2. Ingestão e  │ ───>  │  3. Mapeamento  │
│  (Cadastrar no  │       │  Carga (XLS ou  │       │   de Colunas    │
│    Workspace)   │       │   Banco Read)   │       │   (Validação)   │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                                             │
                                                             ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 6. Modo Reunião │ <───  │ 5. Story Builder│ <───  │ 4. Diagnóstico  │
│  (Ata e Ações   │       │ (Preparo de Deck│       │   e Analytics   │
│  Síncronas UI)  │       │  Customizado)   │       │  (Filtros/Core) │
└─────────────────┘       └─────────────────┘       └─────────────────┘
         │
         ▼
┌─────────────────┐       ┌─────────────────┐
│   7. Follow-up  │ ───>  │ 8. Conclusão ou │
│  (Execução de   │       │  Arquivamento   │
│   Planos Kanban)│       │   do Projeto    │
└─────────────────┘       └─────────────────┘
```

---

### 2. Detalhamento Passo a Passo de Fluxos Chave

#### Fluxo 1: Onboarding e Ingestão de Dados
1.  **Ação**: O consultor abre o seletor de projetos e clica em "Adicionar Novo Projeto".
2.  **Dados**: Fornece nome do cliente,CNPJ, logotipo e o segmento empresarial correspondente.
3.  **Encaminhamento**: O sistema cria o contêiner do projeto e redireciona Carlos para a **Central de Ingestão de Dados (ETL)**.
4.  **Decisão**: Carlos escolhe entre conectar o ERP em modo seguro Read-Only ou subir um lote de planilhas locais.
5.  **Verificação**: O `DataSourceManager` valida as colunas e registra a linhagem (gerando o hash correspondente).
    *   *Se houver sucesso*: O lote é ativado e os cálculos globais são disparados nos engines de background.
    *   *Se houver falha*: O sistema destaca visualmente as colunas incompatíveis e sugere a correção sem quebrar a tela de navegação.

#### Fluxo 2: Preparo e Customização de Apresentações
1.  **Ação**: Carlos clica no menu **Presentation Studio** e escolhe "Criar Nova Apresentação".
2.  **Sugestão de Modelos**: O sistema exibe templates pré-configurados (e.g., "Fechamento Mensal de Controladoria", "Diagnóstico de Performance de Equipe").
3.  **Montagem**: O consultor arrasta e ordena blocos de slides contendo gráficos de DRE, anomalias e tabelas de benchmarks.
4.  **Enriquecimento**: Carlos clica em qualquer bloco de slide para expandir o painel lateral de anotações e redige as recomendações de negócios personalizadas da consultoria.
5.  **Salvamento**: O deck é salvo de forma transparente no cache de estados persistido localmente.

#### Fluxo 3: Condução e Lavratura de Ata de Reunião
1.  **Ação**: Na sala de reuniões do cliente, Carlos acessa a apresentação criada e clica em **Iniciar Modo Reunião**.
2.  **Imersão**: A tela entra em modo tela cheia limpo (ocultando barras do navegador e utilitários da plataforma).
3.  **Navegação**: O consultor usa as teclas direcionais (ou controles visuais) para passar os slides.
4.  **Anotações & Ata**: Durante a projeção, ao debater um ponto, Carlos pressiona um atalho ou clica em um botão discreto de controle para abrir a gaveta de anotações lateral direita.
5.  **Adição de Ações**: Ele cadastra uma nova recomendação ativa (título, executor, prazo).
6.  **Encerramento**: Carlos clica em "Finalizar Apresentação". O Sauron consolida os planos de ação cadastrados e os injeta automaticamente no módulo Kanban de acompanhamento.
