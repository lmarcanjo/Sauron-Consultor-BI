# MVP Delivery Scope

## Entregue

- Importação local de planilha real pelo fluxo existente.
- Fonte ativa visível no Dashboard com preview real.
- Lista de todas as colunas físicas encontradas.
- Nome exibido editável sem renomear a coluna original.
- Seleção de colunas para uma tabela simples.
- Indicador com soma, média, contagem, distintos, mínimo ou máximo.
- Gráfico simples agrupado por categoria.
- Persistência da configuração por fonte após reload.
- Isolamento entre duas empresas com planilhas diferentes.
- Ativação de outra planilha pela Biblioteca.
- Apresentação usando os indicadores, gráficos e tabela configurados.
- Ata imprimível, encerramento da sessão e retorno à aplicação.

## Fora do escopo

- F21 e qualquer fase posterior.
- Novo importador ou processamento pesado no navegador.
- Backend, Cloud ou worker novo.
- Dashboards avançados.
- Mapeamento semântico completo.
- Novas funcionalidades de IA.
- Migração ampla dos engines existentes.

## Critério operacional

O consultor escolhe as informações que deseja utilizar a partir da planilha
ativa. Se não configurar uma coluna, o Sauron não inventa uma interpretação nem
altera o dado original.
