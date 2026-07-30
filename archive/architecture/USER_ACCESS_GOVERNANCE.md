# User Access Governance

Este documento detalha o controle de acesso por empresa, módulo e ação baseando-se no contrato de governança `UserAccessGrant`.

---

## 1. Contrato do UserAccessGrant

```typescript
export interface UserAccessGrant {
  userId: string;
  groupId: string;
  companyIds: string[];
  unitIds: string[];
  modulePermissions: string[];
  actionPermissions: string[];
  role: "SUPER_ADMIN" | "CONSULTANT" | "CLIENT_ADMIN" | "CLIENT_USER" | "VIEWER";
  validFrom?: string;
  validUntil?: string;
}
```

---

## 2. Aplicação de Permissões na UI e Serviços

- **Seletor de Contexto:** Filtra e exibe no dropdown global somente as empresas e filiais listadas em `companyIds` e `unitIds`.
- **Navegação (AppSidebar):** Oculta os itens do menu cujos identificadores de módulo não constam nas permissões do usuário logado.
- **Serviços de Consolidação:** A camada de serviço rejeita e joga erros de acesso se o contexto solicitar agregação de uma empresa sem a devida autorização em `UserAccessGrant`.
