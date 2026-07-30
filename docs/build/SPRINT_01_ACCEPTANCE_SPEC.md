# ASTERION — Especificação de Aceite da Sprint 1 (`SPRINT_01_ACCEPTANCE_SPEC.md`)

---

# 1. Especificação de Aceite por Funcionalidade

---

## Funcionalidade 1.1: Minha Carteira (`F1.1`)

### Objetivo
Validar que a listagem de engajamentos apresenta corretamente todas as contas ativas do consultor logado, exibindo a síntese de status canônico e reuniões agendadas.

### Pré-condições
- Consultor devidamente autenticado no sistema.

### Fluxo Principal
1. Consultor acessa a plataforma e é direcionado para a tela "Minha Carteira".
2. O sistema carrega e exibe a lista de todos os engajamentos vinculados ao consultor.
3. Para cada engajamento, são exibidos: Nome do Cliente, Nome da Empresa principal, Estado Canônico atual e data da próxima reunião/revisão.
4. Consultor clica em um cartão de engajamento.
5. O sistema direciona o consultor para o Workspace do Engajamento selecionado.

### Fluxos Alternativos
- **Filtro de Carteira**: O consultor filtra os engajamentos por estado canônico (ex: filtrar apenas engajamentos em `NO_SOURCE` ou `READY`). O sistema exibe exclusivamente os cartões correspondentes.
- **Acesso Direto ao Cadastro**: O consultor clica no botão "Novo Engajamento" na Carteira. O sistema abre o fluxo de cadastro de Cliente e Engajamento (`F1.2`).

### Casos Extremos
- **Consultor sem Engajamentos (Carteira Vazia)**: O sistema não deve exibir erro ou tela em branco; deve apresentar uma mensagem amigável orientando o início do primeiro engajamento.
- **Engajamentos com Nomes Extensos de Clientes**: A interface deve truncar adequadamente sem quebrar o layout do cartão.

### Regras de Negócio
- A carteira exibe apenas engajamentos em que o consultor possui permissão explícita de acesso/atribuição.
- O estado canônico exibido no cartão deve corresponder rigorosamente ao estado atual da empresa vinculada no banco/persistência.

### Critérios de Aceite
- [ ] Exibir 100% dos engajamentos atribuídos ao consultor.
- [ ] Apresentar o badge visual do estado canônico correto (`NO_SOURCE`, `SOURCE_CONNECTED`, `DISCOVERING`, `WAITING_CONFIRMATION`, `READY`).
- [ ] O clique em um cartão redireciona corretamente para o engajamento alvo.

### Critérios de Rejeição
- [ ] Exibir engajamentos de outros consultores aos quais o usuário não tem permissão.
- [ ] Exibir estado canônico divergente ou desatualizado do registro de persistência.
- [ ] Tela travada ou em branco ao carregar carteira sem engajamentos.

### Eventos Auditáveis
- `CARTEIRA_ACESSADA`: Registro de visualização da carteira pelo consultor (User ID, Timestamp).
- `ENGAJAMENTO_SELECIONADO`: Registro de abertura de um engajamento (User ID, Engagement ID, Timestamp).

### Estados Esperados
- **Estado Inicial**: Carteira carregada com sucesso.
- **Estado Final**: Redirecionamento para o Workspace do Engajamento escolhido ou para a tela de Novo Engajamento.

---

## Funcionalidade 1.2: Cadastro de Cliente e Engajamento (`F1.2`)

### Objetivo
Validar que a criação de uma nova conta de Cliente e o registro de seu respectivo Engajamento ocorrem com os dados obrigatórios e a atribuição do Modelo Consultivo de referência.

### Pré-condições
- Consultor autenticado na tela Minha Carteira (`F1.1`).

### Fluxo Principal
1. Consultor clica em "Novo Engajamento".
2. O sistema apresenta o formulário de cadastro.
3. Consultor insere a Razão Social/Nome Fantasia do Cliente, Segmento e Responsável.
4. Consultor insere o Título do Engajamento e seleciona o Modelo Consultivo de referência (ex: *Modelo Financeiro DRE*).
5. Consultor confirma o cadastro.
6. O sistema cria o Cliente, o Engajamento e redireciona para a etapa de Mapeamento Organizacional (`F1.3`).

### Fluxos Alternativos
- **Vincular a Cliente Existente**: Consultor opta por criar um novo Engajamento para um Cliente que já está cadastrado na carteira. O sistema associa o novo engajamento à conta existente.

### Casos Extremos
- **Tentativa de Salvar sem Preencher Campos Obrigatórios**: O sistema deve bloquear o envio e destacar visualmente os campos faltantes (Razão Social e Título do Engajamento).
- **Tentativa de Cadastrar Cliente com Nome/CNPJ Identico**: O sistema avisa que a empresa já existe e oferece a opção de vincular o engajamento à conta existente.

### Regras de Negócio
- Todo Engajamento deve pertencer obrigatoriamente a um Cliente válido.
- Se nenhum Modelo Consultivo for explicitamente selecionado pelo consultor, o sistema deve atribuir o *Modelo Financeiro DRE Padrão* por omissão.

### Critérios de Aceite
- [ ] Cliente e Engajamento persistidos com sucesso no repositório.
- [ ] Modelo Consultivo corretamente vinculado ao engajamento.
- [ ] Validação contra campos em branco funcionando adequadamente.

### Critérios de Rejeição
- [ ] Criação de Engajamento sem Cliente associado (Engajamento órfão).
- [ ] Envio do formulário aceito com Razão Social em branco.

### Eventos Auditáveis
- `CLIENTE_CRIADO`: Registro de novo cliente (Client ID, User ID, Timestamp).
- `ENGAJAMENTO_CRIADO`: Registro de novo engajamento (Engagement ID, Client ID, Model ID, Timestamp).

### Estados Esperados
- **Estado Inicial**: Formulário de cadastro em branco ou com cliente selecionado.
- **Estado Final**: Cliente e Engajamento persistidos, aguardando cadastro da estrutura organizacional.

---

## Funcionalidade 1.3: Estrutura Organizacional: Grupo, Empresa e Unidades (`F1.3`)

### Objetivo
Validar que a hierarquia organizacional do cliente (Grupo Econômico, Empresas e Filiais) é construída corretamente e que toda nova Empresa é inicializada obrigatoriamente no estado canônico **`NO_SOURCE`**.

### Pré-condições
- Engajamento criado na funcionalidade `F1.2`.

### Fluxo Principal
1. Consultor acessa a tela de Estrutura Organizacional do engajamento.
2. Consultor insere o nome da Empresa principal (PJ/Unidade Consolidada).
3. (Opcional) Consultor cadastra um Grupo Econômico pai ou insere Filiais/Unidades sob a Empresa.
4. Consultor salva a estrutura organizacional.
5. O sistema grava a hierarquia e atribui imutavelmente o estado canônico **`NO_SOURCE`** à Empresa.
6. A árvore organizacional é exibida no Workspace do Engajamento.

### Fluxos Alternativos
- **Cadastro Simplificado (Apenas 1 Empresa)**: O consultor cadastra apenas a Empresa principal sem criar Grupo ou Filiais. O sistema aceita e posiciona a Empresa em `NO_SOURCE`.
- **Cadastro de Grupo com Múltiplas Empresas**: O consultor cria 1 Grupo Econômico e adiciona 3 Empresas vinculadas a ele. O sistema atribui o estado `NO_SOURCE` para cada uma das 3 empresas.

### Casos Extremos
- **Tentativa de Criar Filial Órfã**: O sistema bloqueia a criação de uma Filial/Unidade que não possua uma Empresa pai associada.
- **Nomes Especiais / Caracteres em Razão Social**: O sistema deve aceitar razões sociais contendo números, traços e caracteres acentuados.

### Regras de Negócio
- Toda nova Empresa cadastrada no ASTERION deve ser inicializada **obrigatoriamente e exclusivamente** no estado canônico **`NO_SOURCE`**.
- Nenhuma Filial/Unidade pode existir sem estar vinculada a uma Empresa.

### Critérios de Aceite
- [ ] Hierarquia Grupo -> Empresa -> Filial gravada corretamente.
- [ ] A Empresa criada relata rigorosamente o estado **`NO_SOURCE`**.
- [ ] Bloqueio ativo contra criação de unidades órfãs.

### Critérios de Rejeição
- [ ] Empresa criada em estado diferente de `NO_SOURCE` (ex: criada direto como `READY` ou sem estado).
- [ ] Unidade/Filial criada sem vínculo com Empresa.

### Eventos Auditáveis
- `EMPRESA_CRIADA`: Registro de nova empresa (Company ID, Engagement ID, Initial State = NO_SOURCE, Timestamp).
- `ESTRUTURA_ORGANIZACIONAL_MAPEADA`: Registro da árvore completa gravada (Tree Metadata, Timestamp).

### Estados Esperados
- **Estado Inicial**: Estrutura em definição.
- **Estado Final**: Árvore organizacional salva no repositório com a Empresa no estado canônico **`NO_SOURCE`**.

---

# 2. Matriz de Cobertura e Prioridade de Testes

| Funcionalidade | Critério de Aceite / Teste | Prioridade | Automatizável? | Impacto |
| --- | --- | --- | --- | --- |
| **F1.1** | Exibir lista de engajamentos atribuídos | P0 (Crítica) | **SIM** (E2E / Componente) | ALTO |
| **F1.1** | Exibir badge de estado canônico correto | P0 (Crítica) | **SIM** (E2E / Componente) | ALTO |
| **F1.1** | Tratamento de carteira vazia | P1 (Alta) | **SIM** (Componente) | MÉDIO |
| **F1.2** | Criar Cliente e Engajamento com dados válidos | P0 (Crítica) | **SIM** (E2E / Integração) | ALTO |
| **F1.2** | Atribuição de Modelo Consultivo Padrão | P1 (Alta) | **SIM** (Integração) | MÉDIO |
| **F1.2** | Bloqueio de formulário com campos em branco | P0 (Crítica) | **SIM** (Componente) | ALTO |
| **F1.3** | Garantia de estado inicial `NO_SOURCE` | P0 (Crítica) | **SIM** (Integração / E2E) | CRÍTICO |
| **F1.3** | Mapeamento hierárquico Grupo -> Empresa -> Filial | P0 (Crítica) | **SIM** (Integração) | ALTO |
| **F1.3** | Bloqueio de criação de Filial órfã | P1 (Alta) | **SIM** (Integração) | ALTO |
