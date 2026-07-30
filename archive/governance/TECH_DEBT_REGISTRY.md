# SAURON TECHNICAL DEBT REGISTRY
## Registro Oficial de Dívidas Técnicas e Melhorias Estruturais

Este documento cataloga, prioriza e planeja as intervenções arquiteturais necessárias para manter a saúde, performance e escalabilidade do código do **Sauron** em alto nível profissional.

---

### Mapeamento Geral de Dívidas Técnicas

| ID | Descrição da Dívida Técnica | Prioridade | Impacto | Release Prevista | Responsável | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TD-001** | Densidade excessiva e tamanho de arquivo de `src/App.tsx` | **ALTA** | Manutenibilidade / Tempo de Build | v0.7 | Lead Architect | **ABERTO** |
| **TD-002** | Migração do localStorage para Banco de Nuvem Resiliente | **MÉDIA** | Integridade / Persistência Multi-dispositivo | v0.9 | Backend Engineer | **ABERTO** |
| **TD-003** | Centralização das lógicas de VPN e Banco em Server dedicado | **MÉDIA** | Performance / Separação de Responsabilidades | v0.8 | DevOps / Backend | **ABERTO** |
| **TD-004** | Ausência de isolamento Multi-Tenant completo em `server.ts` | **ALTA** | Segurança / Proteção de Clientes | v0.9 | Security Engineer | **ABERTO** |

---

### Detalhamento das Dívidas Técnicas

#### TD-ID: TD-001
- **Descrição**: O arquivo principal `src/App.tsx` possui atualmente mais de 1.900 linhas de código, contendo declarações de estado visual de abas de roteamento, componentes visuais menores inlined e handlers de manipulação de planilhas locais.
- **Prioridade**: **ALTA**
- **Impacto**: Reduz a velocidade de manutenção visual, dificulta o reaproveitamento de componentes em outras telas e aumenta o risco de geração de conflitos de merge durante o desenvolvimento em paralelo de novas equipes.
- **Release prevista**: v0.7 (Presentation Studio)
- **Responsável**: Lead Architect
- **Status**: **ABERTO**
- **Ação corretiva sugerida**: Extrair abas inteiras (e.g., CentralDadosTab, ImportacaoPlanilhasTab, DatabaseConnector) para arquivos de componentes isolados dentro do diretório `/src/components/`, reduzindo `src/App.tsx` a uma rota principal de coordenação de tela e menu global de navegação.

#### TD-ID: TD-002
- **Descrição**: Atualmente, a persistência de projetos do `ConsultantWorkspaceManager` e os relatórios transacionais e de planilhas estão armazenados estritamente na memória volátil ou no `localStorage` do navegador do consultor.
- **Prioridade**: **MÉDIA**
- **Impacto**: Consultores não conseguem acessar o histórico de seus clientes a partir de dispositivos móveis ou outros computadores sem exportar e importar arquivos de backup. Limitação física de cota de armazenamento no browser (limite médio de 5MB).
- **Release prevista**: v0.9 (SaaS Foundation)
- **Responsável**: Backend Engineer
- **Status**: **ABERTO**
- **Ação corretiva sugerida**: Criar rotas no Express para persistir o `WorkspaceProject` no Firestore (via Firebase) ou PostgreSQL (via Cloud SQL) de forma transparente, mantendo cache local reativo apenas para garantir performance.

#### TD-ID: TD-003
- **Descrição**: O arquivo `server.ts` coordena simulações locais e conexões VPN ad-hoc, além de simular comportamentos de concorrência com timers locais.
- **Prioridade**: **MÉDIA**
- **Impacto**: O backend central fica congestionado em cenários de alta concorrência de múltiplos consultores fazendo uploads simultâneos.
- **Release prevista**: v0.8 (Intelligence Layer)
- **Responsável**: DevOps / Backend Engineer
- **Status**: **ABERTO**
- **Ação corretiva sugerida**: Delegar a resolução de VPNs e conexões a microsserviços em contêineres autônomos ou gateways de VPN dedicados na infraestrutura de nuvem, desonerando o servidor central da aplicação SaaS.

#### TD-ID: TD-004
- **Descrição**: O servidor central (`server.ts`) atua de forma unificada sem conferência rígida de identificadores de tenant ou validação de escopos de privilégios de consultores concorrentes sobre as mesmas APIs.
- **Prioridade**: **ALTA**
- **Impacto**: Vulnerabilidade alta de quebra de confidencialidade de dados financeiros entre diferentes consultores que usem a mesma instância servidora.
- **Release prevista**: v0.9 (SaaS Foundation)
- **Responsável**: Security Engineer
- **Status**: **ABERTO**
- **Ação corretiva sugerida**: Implementar JWT tokens associando cada requisição HTTP ao ID do Tenant e incluir middlewares robustos de verificação no Express que validam se o `tenant_id` correspondente à requisição é idêntico ao do recurso financeiro acessado.
