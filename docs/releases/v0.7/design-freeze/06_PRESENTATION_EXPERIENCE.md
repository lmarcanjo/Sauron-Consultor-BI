# SAURON SX DESIGN FREEZE — PRESENTATION EXPERIENCE (06/10)
## docs/releases/v0.7/design-freeze/06_PRESENTATION_EXPERIENCE.md

Este documento especifica o ciclo de vida completo de uma Apresentação no ecossistema Sauron SX. Ele documenta as etapas de nascimento, customização de conteúdo, condução de reuniões, e as mecânicas de exportação e compartilhamento de relatórios estratégicos finais com a diretoria do cliente assessorado.

---

### 1. Nascimento da Apresentação (Creation Flow)
- **Geração por Período**: O consultor clica em "Nova Apresentação" no menu do Presentation Studio.
- **Associação Automática**: Ele seleciona o período contábil de referência (e.g., Maio/2026). O sistema automaticamente indexa todos os KPIs consolidados, anomalias e ranks de benchmarks gerados deterministicamente para aquele mês e cria o primeiro deck de slides preliminar sugerido em menos de 5 segundos.

---

### 2. Edição e Personalização (Editing Flow)
- **Ajustes Contextuais**: O consultor pode clicar em qualquer slide do deck gerado e customizar os títulos, subtextos ou notas explicativas analíticas da consultoria.
- **Inserção de Evidências**: Se o `AnomalyEngine` detectou um estouro de despesas administrativas de R$ 50k, o consultor pode arrastar o card específico desse desvio para dentro do slide correspondente de custos, enriquecendo a explicação visual do indicador.

---

### 3. Apresentação (Conduction Flow)
- Conduzida inteiramente através do **Modo Reunião (SX)** conforme especificado em `04_MEETING_EXPERIENCE.md`.
- Garante total imersão e integridade do ritual corporativo mensal.

---

### 4. Exportação Resiliente (Export Flow)
Ao final da reunião, ou para envio prévio para auditorias internas da diretoria do cliente, o consultor pode exportar o material:
- **Exportar PDF Executivo (Estático)**: O sistema gera uma versão em PDF elegante e de alta resolução formatada para impressão vertical contendo todos os slides projetados e as respectivas notas estratégicas completas do consultor.
- **Exportar Relatório Detalhado (Spreadsheet Backup)**: O sistema gera um backup estruturado em planilha Excel contendo todas as transações, contas e faturamentos reais que alimentaram as métricas expostas, preservando a transparência de ponta a ponta (lineage).

---

### 5. Compartilhamento Digital Seguro (Sharing Flow)
- **Link do Cliente (Viewer Mode)**: Carlos pode gerar um link exclusivo criptografado temporário para Mariana (a cliente final).
- **Acesso Controlado**: Através deste link, Mariana acessa a apresentação em um visualizador web interativo estritamente seguro, em modo somente-leitura (Read-Only Viewer), permitindo que ela navegue pelos slides e revise as decisões, atas e planos de ação pactuados de forma autônoma de seu próprio computador ou tablet, sem que de forma alguma comprometa a segurança de configurações internas da plataforma.
