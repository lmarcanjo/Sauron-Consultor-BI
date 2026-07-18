# F19 Human Observation Report — Atualização F19.1

**Data da atualização:** 2026-07-18  
**Status da sessão humana:** ❌ PENDENTE — não executada nesta rodada  

---

## Estado da sessão

Nenhuma sessão observacional com consultor externo foi executada nesta rodada F19.1.

O agente de IA não pode executar nem simular a sessão humana prevista no Bloco 1.

Isso é registrado como **bloqueador** para o parecer final F19.1.

---

## Por que a sessão humana é insubstituível

A sessão humana existe para descobrir:

- **Hesitações** que código não produz — onde a pessoa para, lê, e não sabe o que fazer
- **Interpretações incorretas** — o que a pessoa acha que vai acontecer vs. o que acontece
- **Medo de excluir** — quanto a pessoa hesita antes de ações irreversíveis
- **Terminologia incompreendida** — quais palavras causam confusão
- **Workarounds espontâneos** — como a pessoa contorna algo que não funciona
- **Abandono de tarefa** — quando a pessoa desiste e por quê

Nenhum teste automatizado captura isso.

---

## Roteiro da sessão que precisa ser realizada

### Perfil da pessoa a observar

- Consultor experiente em negócios (finanças, estratégia, RH ou operações)
- Baixo ou médio domínio de tecnologia
- **Não participou** do desenvolvimento
- **Não conhece** a arquitetura
- **Não recebeu** treinamento prévio

### Ambiente

- Computador limpo (sem dados pré-carregados)
- Navegador sem extensões (Chrome ou Firefox vanilla)
- Tela compartilhada ou câmera para registro
- Observador em silêncio — não tocar no teclado, não antecipar dúvidas

### Tarefas a observar (na ordem)

1. Entrar no sistema
2. Cadastrar grupo
3. Cadastrar empresa
4. Cadastrar unidade
5. Importar uma ou mais planilhas
6. Confirmar informações encontradas
7. Abrir Dashboard
8. Trocar empresa
9. Abrir DRE
10. Gerar apresentação
11. Preparar reunião
12. Arquivar e restaurar uma planilha
13. Recarregar a página
14. Sair e entrar novamente

### O que registrar

Para cada tarefa:
- Tempo de execução (início → conclusão ou abandono)
- Número de cliques
- Hesitações (>3s parado olhando)
- Perguntas feitas em voz alta
- Voltas (voltou para tela anterior)
- Cliques sem resposta visível
- Medo explícito de excluir
- Mensagens que causaram confusão
- Termos não compreendidos
- Erros cometidos
- Sugestões espontâneas
- Tarefa abandonada (S/N)

### Classificação de problemas

| Prioridade | Definição |
|---|---|
| P0 | Bloqueador — tarefa não concluída sem ajuda |
| P1 | Atrito alto — conclui mas com dificuldade significativa |
| P2 | Atrito médio — hesitação ou caminho errado |
| P3 | Melhoria futura — não impede uso atual |

### Perguntas finais (pós-jornada)

1. O que você entendeu que o SAURON faz?
2. Em qual tela ficou mais confuso?
3. Qual tarefa foi mais difícil?
4. Qual tarefa foi mais fácil?
5. Você usaria isso em um cliente real?
6. O que impediria o uso amanhã?
7. Em qual momento confiou no sistema?
8. Em qual momento desconfiou?
9. A apresentação parece profissional?
10. Você precisaria de treinamento?
11. Você saberia repetir o processo sozinho amanhã?
12. O sistema parece ajudar ou atrapalhar seu trabalho?

---

## Evidências substitutas disponíveis (não equivalentes)

- Jornadas executiva e multiempresa anteriores (RC-3): automatizadas
- E2E de personas F18: cobre primeiro acesso, importação, reload e apresentação
- E2E F19: mede cliques estimados, troca de empresa, DRE
- E2E F19.1 novo: axe/WCAG + teclado + zoom (em execução)
- Inspeção de código: linguagem técnica mapeada e parcialmente corrigida

**Essas evidências NÃO autorizam o parecer APROVADO.**

---

## Metas da sessão humana

| Meta | Alvo |
|---|---|
| Primeiro cadastro | ≤ 2 minutos |
| Importação | ≤ 3 minutos |
| Confirmação de campos | ≤ 2 minutos |
| Troca de empresa | ≤ 20 segundos |
| Abrir DRE | ≤ 30 segundos |
| Gerar apresentação | ≤ 1 minuto |
| Ajuda técnica necessária | 0 vezes |
| Tela branca | 0 ocorrências |
| Erro de console | 0 |

---

## Critério para aprovação

A F19.1 só pode ser aprovada quando **uma pessoa real** concluir a jornada acima sem:

- ajuda técnica (ou com ajuda claramente documentada)
- bloqueadores (P0) não corrigidos
- mais de 3 atritos alto (P1) não documentados

---

## Limite formal

Sem esta sessão, **não há base para afirmar** que um consultor tradicional conclui o fluxo sozinho.

O parecer permanece: **❌ REPROVADO — sessão humana pendente.**
