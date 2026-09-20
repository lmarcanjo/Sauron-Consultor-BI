# ASTERION — Guia do Agregado DataSource

Especificação do Agregado Raiz `DataSource` e suas regras de negócio.

---

## 1. Responsabilidade do Agregado
O `DataSource` é um Ativo de Negócio de Primeira Classe governado. Ele não representa um socket técnico, mas a própria origem oficial dos dados.

## 2. Maquina de Estado Canônico Derivado

```
[NO_SOURCE] ──► [SOURCE_CONNECTED] ──► [DISCOVERING] ──► [WAITING_CONFIRMATION] ──► [READY]
```

- **`NO_SOURCE`**: Fonte desprovida de evidências ativas ou arquivada.
- **`SOURCE_CONNECTED`**: Evidência registrada (upload/handshake), aguardando leitura autônoma.
- **`DISCOVERING`**: Processo de leitura física em execução.
- **`WAITING_CONFIRMATION`**: Schema vN gerado aguardando aceite semântico do consultor.
- **`READY`**: Schema vN confirmado pelo consultor.
