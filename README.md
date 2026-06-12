# 📊 Sauron - Portal de Governança Contábil e Auditoria Fiscal

O **Sauron** é uma plataforma inovadora e de nível empresarial focada na governança, auditoria fiscal, acompanhamento orçamentário e parametrização de comissões para grupos de concessionárias de voo com múltiplos CNPJs e bandeiras/marcas operacionais. 

Desenvolvido sob rígidas normas de segregação de funções contábeis, a plataforma separa de forma nativa as credenciais e recursos do **Consultor Técnico** (responsável pelo core de engenharia de dados e infraestrutura) das aplicações voltadas aos **Diretores, Gerentes e Analistas Operacionais**.

---

## 🛡️ Conformidade Estrita à LGPD (Lei nº 13.709)

O Sauron foi projetado sob os princípios de *Privacy by Design* e *Privacy by Default*, garantindo conformidade absoluta com as regras da lei de proteção de dados:

1. **Segregação Rigorosa de Funções (Role-Based Access Control - RBAC)**:
   * **Consultor**: Acesso administrativo total para configuração de perfis, auditoria de logs e exportação de códigos-fonte.
   * **Diretor**: Visualizações estratégicas dos KPIs sem exibição ou parametrização de código.
   * **Gerente**: Ajustes comerciais locais e parametrização de metas e offsets de margens operacionais.
   * **Analista**: Acesso estritamente para leitura das tabelas financeiras com bloqueio absoluto de edições.

2. **Centro de Privacidade Interativo (Artigo 18 - Direito ao Esquecimento)**:
   * Qualquer usuário ou cliente tem o direito de gerenciar suas permissões de cookies e local storage.
   * Disponibilidade do botão **"Anonimizar e Expurgar meus dados locais"**, que destrói de forma irreversível e criptograficamente segura qualquer credencial customizada de sessões ativas no navegador.

3. **Log de Rastreabilidade Operacional**:
   * Painel de auditoria em tempo real no menu do Consultor rastreia quando perfis foram modificados, deletados ou adicionados, incluindo timestamps UTC e IPs de conexão, mantendo um log forense imutável localmente.

---

## 📈 Principais Funcionalidades da Aplicação

### 1. Análise Contábil Avançada com Controle Orçamentário ("Orçamento")
* **Coluna de Orçamento Dedicada**: Cada rubrica e lançamento no Razão Contábil possui uma métrica de orçamento planejado vs executado.
* **Cálculo Dinâmico de Desvios**: Apresentação visual clara do desvio nominal (**Desvio R$**) e desvio percentual (**% Desvio**), acompanhados por indicadores de sinalização de risco térmico (cores vermelho/verde).
* **Filtros por CNPJ e Conta Contábil**: Isolamento imediato de desvios operacionais por concessionária participante.

### 2. Controle de Temas de Interface (Modo Escuro / Claro)
* Sistema visual inteiramente adaptativo através do Tailwind CSS v4 para garantir ergonomia visual em turnos de trabalho prolongados.

### 3. Editor e Gerenciador de Perfis Corporativos (Aba do Consultor)
* Mecanismo visual de ajustes rápidos onde o Consultor pode trocar nomes, e-mails, senhas secretas e descrições de papéis de governança.
* Inclusão e expurgo dinâmico de novos colaboradores com persistência segura do estado do portal via `localStorage`.

### 4. Exportação do Código de Backend (Streamlit Exporter)
* O ecossistema de exportação contábil para servidores Streamlit ou arquivos de análise local é **oculto para os demais papéis contábeis** e exposto estritamente para o consultor técnico responsável.

---

## 🚀 Como Executar o Portal Web Localmente

Para iniciar e testar o frontend completo base-Vite do Sauron, siga os comandos abaixo de forma direta:

### Pré-requisitos
* Ter o **Node.js 18+** instalado em seu computador.

### 1. Instalar as dependências do ecossistema:
```bash
npm install
```

### 2. Iniciar o servidor de desenvolvimento local:
```bash
npm run dev
```
O console exibirá o endereço para visualização imediata da interface (geralmente [http://localhost:3000](http://localhost:3000)).

### 3. Gerar build de produção otimizada:
```bash
npm run build
```

---

## 📅 Estrutura das Planilhas de Upload de Razões
O Sauron aceita a carga de lançamentos individuais nos formatos Excel (`.xlsx`) ou CSV brasileiro (separado por `;` e codificação UTF-8 ou ISO-8859-1).

### Colunas Suportadas pela Inteligência Contábil:
1. **Grupo** (ex: `Carbon Motors`)
2. **CNPJ** (ex: `12.345.678/0001-90`)
3. **Marca** (ex: `Toyota`, `Chevrolet`)
4. **Empresa** (Razão Social contábil)
5. **Filial** (Ex: `Filial Norte`)
6. **Mês** (Mês competência do Razão)
7. **Razão** (Rubrica da Conta)
8. **Categoria** (Classificação de despesa)
9. **Receita** (Valor da receita nominal)
10. **Custo** (Custos operacionais associados)
11. **Despesa** (Gastos logísticos ou fixos)
12. **Orçamento** (Orçamento planejado associado para avaliar desvios)

---

## 🎨 Linhas de Design e Ergonomia de Interface
* **Tema Espacial ("Sauron Dark")**: Desenvolvido com cantos arredondados, bordas sutis e contraste perfeito para auditores.
* **Micro-animações**: Transições de abas via estados suaves que guiam visualmente a leitura dos fluxos de caixa e alertas fiscais sem poluição visual.
