# ASTERION — Plano de Implementação da Sprint 1 (`SPRINT_01_IMPLEMENTATION_PLAN.md`)

---

# Visão Geral da Sprint 1

A Sprint 1 foca exclusivamente na implementação do **Épico 1: Gestão de Carteira e Estrutura Organizacional**. 

O objetivo desta Sprint é entregar a fundação operacional da plataforma: permitir que o consultor gerencie seus clientes, cadastre engajamentos e estruture a árvore de empresas e unidades do cliente, posicionando obrigatoriamente a empresa no estado canônico **`NO_SOURCE`**.

---

# Detalhamento das Funcionalidades da Sprint 1

---

## 1. Minha Carteira (`F1.1`)

### Objetivo
Permitir que o consultor visualize todas as contas, clientes e engajamentos sob sua responsabilidade, fornecendo um ponto de partida centralizado para a rotina diária de trabalho.

### Dependências
Nenhuma (primeira funcionalidade da plataforma).

### Ordem recomendada
**1º item a ser implementado**.

### Critérios de aceite
- Exibir a lista de todos os engajamentos ativos atribuídos ao consultor logado.
- Para cada engajamento, indicar visualmente o nome do Cliente, o nome da Empresa e o estado canônico atual (`NO_SOURCE`, `SOURCE_CONNECTED`, `DISCOVERING`, `WAITING_CONFIRMATION`, `READY`).
- Permitir ao consultor selecionar um engajamento para abrir o Workspace de Engajamento correspondente.
- Permitir acionar a criação de um novo engajamento.

### Casos extremos
- **Carteira Vazia**: Consultor novo sem nenhum cliente cadastrado. Deve exibir estado inicial orientando a criação do primeiro cliente/engajamento.
- **Múltiplos Engajamentos para o Mesmo Cliente**: Exibir os engajamentos agrupados por cliente sem duplicar cartões.

### Riscos
- Carregamento lento em carteiras com dezenas de engajamentos (mitigar com paginação ou carregamento otimizado).

### Impacto no domínio
- Consome a entidade `Cliente`, `Empresa` e o estado canônico da empresa.

### Critérios para considerar concluída
- Consultor consegue visualizar sua lista de contas, selecionar um engajamento existente ou disparar o fluxo de novo cliente.

---

## 2. Cadastro de Cliente e Engajamento (`F1.2`)

### Objetivo
Formalizar no sistema a organização contratante (Cliente) e registrar um novo projeto de trabalho consultivo (Engajamento).

### Dependências
Minha Carteira (`F1.1`).

### Ordem recomendada
**2º item a ser implementado**.

### Critérios de aceite
- Permitir cadastrar um novo Cliente (Razão Social, Nome Fantasia, Segmento, Responsável no Cliente).
- Permitir criar um Engajamento associado a um Cliente existente ou recém-criado.
- Exigir título do Engajamento, consultor responsável e a seleção de um **Modelo Consultivo** de referência (Financeiro, Comercial, etc.).
- Vincular o engajamento à árvore organizacional inicial.

### Casos extremos
- **Tentativa de Cadastrar Cliente com Nome/CNPJ Duplicado**: Alertar que a conta já existe na carteira e sugerir vincular o engajamento ao cliente cadastrado.
- **Engajamento sem Modelo Consultivo**: O sistema deve selecionar o Modelo Financeiro Padrão por omissão.

### Riscos
- Inconsistência ao tentar criar um engajamento sem associar um cliente válido.

### Impacto no domínio
- Cria instâncias das entidades `Cliente` e `Engajamento`.

### Critérios para considerar concluída
- Novo cliente e engajamento registrados com sucesso e visíveis no painel Minha Carteira.

---

## 3. Estrutura Organizacional: Grupo Econômico, Empresa e Unidades (`F1.3`)

### Objetivo
Permitir o mapeamento completo da arborescência organizacional do cliente no escopo do engajamento (Grupo Econômico, Empresas e Filiais/Unidades).

### Dependências
Cadastro de Cliente e Engajamento (`F1.2`).

### Ordem recomendada
**3º item a ser implementado**.

### Critérios de aceite
- Permitir cadastrar um Grupo Econômico (opcional).
- Permitir cadastrar uma ou mais Empresas vinculadas ao Cliente/Grupo.
- Permitir cadastrar Unidades/Filiais vinculadas a uma Empresa específica.
- Inicializar a Empresa obrigatoriamente no estado canônico **`NO_SOURCE`**.
- Disponibilizar a visualização da árvore organizacional no Workspace do Engajamento.

### Casos extremos
- **Empresa Única sem Grupo e sem Filiais**: Permitir o cadastro simplificado de 1 Empresa direta sem forçar o cadastro de Grupo ou Filiais.
- **Empresa com Múltiplas Filiais em Estados Diferentes**: Preservar o vínculo hierárquico correto (Filial sempre pertence a 1 Empresa).

### Riscos
- Permitir a criação de Unidades órfãs (sem Empresa pai).
- Não inicializar a Empresa no estado `NO_SOURCE`.

### Impacto no domínio
- Cria instâncias das entidades `BusinessGroup`, `Company` e `Unit`.
- Define o estado inicial da empresa em **`NO_SOURCE`**.

### Critérios para considerar concluída
- Árvore organizacional cadastrada e Empresa posicionada em `NO_SOURCE`, pronta para receber a conexão de dados na Sprint 2.

---

# Ordem Oficial de Implementação da Sprint 1

```
1. Minha Carteira (F1.1) ──► 2. Criar Cliente e Engajamento (F1.2) ──► 3. Estrutura Organizacional (F1.3)
```

---

# Matriz de Dependências

| Funcionalidade | Depende de | Liberado para |
| --- | --- | --- |
| **F1.1 — Minha Carteira** | Nenhuma | Abertura do sistema e listagem de contas |
| **F1.2 — Criar Cliente/Engajamento** | F1.1 | Criação de novos projetos consultivos |
| **F1.3 — Estrutura Organizacional** | F1.2 | Recepção de dados (Sprint 2) |

---

# Checklist da Sprint 1

- [ ] **Minha Carteira (F1.1)**
  - [ ] Tela/painel de listagem de engajamentos ativos implementada.
  - [ ] Exibição correta do Cliente, Empresa e Estado Canônico em cada cartão.
  - [ ] Tratamento de estado vazio para novos consultores.
- [ ] **Cadastro de Cliente e Engajamento (F1.2)**
  - [ ] Fluxo de criação de Cliente concluído.
  - [ ] Fluxo de criação de Engajamento associado com seleção de Modelo Consultivo concluído.
  - [ ] Validação de dados duplicados de cliente ativa.
- [ ] **Estrutura Organizacional (F1.3)**
  - [ ] Cadastro de Grupos Econômicos, Empresas e Filiais concluído.
  - [ ] Garantia de que toda nova Empresa é iniciada em **`NO_SOURCE`**.
  - [ ] Visualização da árvore organizacional no engajamento funcionando.

---

# Critérios de Validação da Sprint 1

1. **Validação de Estado Canônico**: Toda empresa criada deve relatar rigorosamente o estado **`NO_SOURCE`** em todas as consultas.
2. **Validação de Hierarquia**: Nenhuma Filial/Unidade pode ser criada sem estar associada a uma Empresa válida.
3. **Navegabilidade**: O consultor consegue navegar de "Minha Carteira" -> "Novo Cliente" -> "Criar Engajamento" -> "Mapear Empresa" sem interrupções de fluxo.

---

# Riscos da Sprint 1

| Risco Identificado | Impacto | Mitigação |
| --- | --- | --- |
| **Inconsistência de Estado Inicial** | ALTO | Enforçar no contrato de criação que o estado inicial da empresa é imutavelmente `NO_SOURCE`. |
| **Complexidade Excessiva no Onboarding** | MÉDIO | Permitir o fluxo rápido de cadastro (criar empresa direta sem obrigatoriedade de grupo ou filial). |
| **Vínculo Órfão de Engajamento** | ALTO | Garantir validação estrita que impede criar engajamento sem cliente atribuído. |
