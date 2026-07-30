# SAURON SX DESIGN FREEZE — VISUAL LANGUAGE (07/10)
## docs/releases/v0.7/design-freeze/07_VISUAL_LANGUAGE.md

Este documento especifica a linguagem visual e o design sensorial que regem a plataforma Sauron. Ele define as escolhas de acabamento que traduzem conceitos abstratos (como governança, inteligência e integridade de dados) em elementos e texturas palpáveis de tela, sem onerar ou poluir a experiência operacional do consultor.

---

### 1. Confiabilidade e Rigor Técnico (Trust)
- **Como Transmitimos**: O cliente e o consultor não devem duvidar do dado exposto. O Sauron demonstra precisão técnica destacando sempre o **Selo de Linhagem (Data Lineage)** em posições visuais estratégicas.
- **Tradução em UI**: Cada número crítico ou indicador financeiro principal vem acompanhado de um badge minimalista e elegante cinza-claro. O uso de fontes mono de alta precisão (JetBrains Mono) em números de auditoria e hashes de lote reforça a sensação de que o sistema é blindado e auditado deterministicamente.

---

### 2. Segurança Enterprise (Security)
- **Como Transmitimos**: Transmitir a certeza física de que o Sauron é um software maduro e de leitura protegida que não colocará os dados do ERP ou transações operacionais em risco de corrupção ou vazamento.
- **Tradução em UI**: Visualizadores e inputs de configuração de banco de dados exibem selos explícitos e ícones da biblioteca de segurança (e.g., `ShieldCheck`, `LockKeyhole`). Todas as mensagens de sucesso de conexão ou validação de tabelas são apresentadas de forma sóbria e informativa, omitindo exclamações vulgares ou excesso de cores festivas.

---

### 3. Clareza e Pragmatismo de Negócios (Clarity)
- **Como Transmitimos**: O consultor deve encontrar o que precisa em segundos. A interface de dados é despida de adereços cosméticos redundantes para que a informação chave tome os holofotes.
- **Tradução em UI**: Uso sistemático de espaços em branco amplos (negative space) circundando os cards e tabelas. Aplicação de hierarquia tipográfica nítida onde títulos usam Space Grotesk em negrito e dados brutos usam Inter em tamanho regular, permitindo ao olho do usuário escanear a página e separar instantaneamente os metadados das conclusões estratégicas.

---

### 4. Inteligência Determinística (Intelligence)
- **Como Transmitimos**: Evitar a imagem amadora de "alucinações matemáticas" comuns em inteligências generativas. O Sauron demonstra inteligência através de detecções matemáticas exatas e indubitáveis.
- **Tradução em UI**: Os diagnósticos gerados pelo `AnomalyEngine` ou pelo `TrendEngine` são apresentados de forma clara, contextual e factual (e.g., *"Oscilação atípica de +35% em Outros Custos. Histórico estável de 12 meses rompido"*). O texto é sóbrio e baseado em fatos matemáticos comprováveis pelo cliente ao detalhar a linhagem do lote.

---

### 5. Sofisticação Sóbria (Sophistication)
- **Como Transmitimos**: O Sauron não se parece com um dashboard genérico gratuito da web. Ele respira o rigor de uma ferramenta projetada sob medida para executivos e tomadores de decisão de médias e grandes empresas corporativas.
- **Tradução em UI**: Cores são aplicadas como pontos de foco cirúrgico (semáforo de status), mantendo o resto da paleta em tons neutros, grafites profundos e off-whites. Bordas finas de 1px delimitam seções com extrema elegância e botões primários apresentam cantos arredondados modernos que se comportam com transições elegantes de micro-animações de estado de foco.
