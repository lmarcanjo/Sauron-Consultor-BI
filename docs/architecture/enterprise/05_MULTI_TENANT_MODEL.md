# SAURON MULTI-TENANT MODEL — ISOLAMENTO DE DADOS ENTERPRISE

## 1. ESTRATÉGIA DE PARTIÇÃO E ISOLAMENTO DE MULTI-TENANCY

Para o Sauron Enterprise, o Architecture Review Board (ARB) escolheu o modelo de **Banco de Dados Único com Isolamento por Linha (Shared Database, Shared Schema, Row-Level Partition)**. 

```
┌────────────────────────────────────────────────────────────────────────┐
│                      SAURON CENTRAL POSTGRESQL DB                      │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                     TABLE: `financial_records`                 │   │
│   │ ────────────────────────────────────────────────────────────── │   │
│   │ [Row 1] Tenant: ten_001 (Deloitte) -> Access only for ten_001  │   │
│   │ [Row 2] Tenant: ten_001 (Deloitte) -> Access only for ten_001  │   │
│   │ [Row 3] Tenant: ten_002 (PwC)      -> Access only for ten_002  │   │
│   │ [Row 4] Tenant: ten_002 (PwC)      -> Access only for ten_002  │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

#### Por que este modelo?
* **Custo-Benefício de Escala:** Gerenciar 500 bancos de dados individuais (um para cada tenant) gera altíssimo custo de manutenção de DevOps, complexidade no deploy de migrations e desperdício de conexões e processadores físicos em bancos subutilizados.
* **Flexibilidade de Grupos e Holdings:** Permite criar relatórios unificados de holdings que envolvem múltiplos sub-tenants através de heranças seguras de chaves estrangeiras de forma natural, sem necessidade de consultas entre múltiplos bancos físicos.
* **Isolamento de Segurança Físico via RLS:** Com a tecnologia nativa de Row-Level Security do PostgreSQL, o banco de dados se encarrega de garantir que nenhuma linha vaze entre tenants, eliminando erros acidentais de programação nas queries do backend.

---

## 2. ESPECIFICAÇÃO DE ROW-LEVEL SECURITY (RLS) NO POSTGRESQL

Todas as tabelas críticas de dados (Workspace, Projetos, Balancetes,Stories, Decisões, logs) conterão uma coluna mandatória `tenant_id` e terão o recurso de RLS ativado de forma imperativa.

### Exemplo do Esquema de Banco de Dados de Produção:

```sql
-- 1. Criação da tabela de lançamentos contábeis com coluna tenant_id
CREATE TABLE financial_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(50) NOT NULL,
    project_id UUID NOT NULL,
    account_code VARCHAR(30) NOT NULL,
    label VARCHAR(150) NOT NULL,
    value DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Habilitação do Row Level Security na tabela
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;

-- 3. Criação da política de isolamento.
-- A função `current_setting('app.current_tenant_id', true)` lê o ID do tenant em sessão.
CREATE POLICY tenant_isolation_policy ON financial_records
    USING (tenant_id = current_setting('app.current_tenant_id', true));
```

---

## 3. MECANISMO DE GERENCIAMENTO DE CONTEXTO EM TRANSAÇÕES (MIDDLEWARE)

Toda conexão retirada do Pooler de banco de dados pelo backend deve, antes de executar qualquer query de leitura ou escrita, configurar a variável de ambiente local de sessão dentro da transação correspondente.

```ts
// Exemplo lógico de middleware Express injetando contexto de Tenant
import { Request, Response, NextFunction } from "express";
import { db } from "../db";

export async function tenantContextMiddleware(req: Request, res: Response, next: NextFunction) {
  const tenantId = req.headers["x-tenant-id"] as string;
  const userToken = req.headers["authorization"];

  if (!tenantId) {
    return res.status(400).json({ error: "X-Tenant-Id header is required" });
  }

  // Define de forma transacional o tenant_id no escopo da conexão atual do PostgreSQL
  await db.transaction(async (tx) => {
    await tx.execute(
      `SET LOCAL app.current_tenant_id = ${tenantId};`
    );
    // Prossegue com os casos de uso sob a proteção de RLS do Postgres
    next();
  });
}
```

---

## 4. PREVENÇÃO COMPLETA DE VAZAMENTO DE TENANTS (TENANT LEAK PREVENTION)

Para garantir proteção absoluta contra o vazamento cruzado de dados entre concorrentes corporativos:
1. **Auditoria em CI/CD:** Scripts de teste automatizados tentarão intencionalmente forçar leituras sem cabeçalho ou com cabeçalho adulterado para verificar se o banco de dados dispara erros de permissão de acesso nativos.
2. **Definição de Fallback:** Se a variável `app.current_tenant_id` do PostgreSQL estiver vazia, a política de RLS retorna zero registros (`null`), garantindo que o comportamento padrão na falta de credencial seja de segurança total (Fail-Safe Defaults).
3. **Isolamento de Cache no Redis:** O cache de dados analíticos no Redis utilizará prefixos de chave contendo obrigatoriamente o tenant correspondente: `tenant:{tenant_id}:project:{project_id}:kpis`.
