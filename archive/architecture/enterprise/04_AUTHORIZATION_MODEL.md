# SAURON AUTHORIZATION & IDENTITY MODEL — ENTERPRISE IAM

## 1. HIERARQUIA DE IDENTIDADE E ENTIDADES (IAM MODEL)

Para gerenciar milhares de usuários distribuídos por dezenas de consultorias estratégicas independentes e seus respectivos clientes, o Sauron implementará um modelo hierárquico de controle de acesso altamente estruturado.

```
                  ┌──────────────────────┐
                  │    Tenant (SaaS)     │ (Ex: Deloitte, PwC, ou Consultoria ABC)
                  └──────────┬───────────┘
                             │
                  ┌──────────▼───────────┐
                  │     Organization     │ (Ex: Grupo Simpar ou Rede CarMais)
                  └──────────┬───────────┘
                             │
                  ┌──────────▼───────────┐
                  │    Business Group    │ (Ex: Divisão de Veículos ou Divisão de Alimentos)
                  └──────────┬───────────┘
                             │
                  ┌──────────▼───────────┐
                  │  Company (Empresa)   │ (Ex: Concessionária CarMais Fortaleza CNPJ...)
                  └──────────────────────┘
```

---

## 2. CONTROLE DE ACESSO BASEADO EM FUNÇÕES E PERMISSÕES (RBAC + ABAC)

A plataforma usará um modelo híbrido que mescla **Role-Based Access Control (RBAC)** para funções amplas com **Attribute-Based Access Control (ABAC)** para regras finas baseadas em políticas dinâmicas.

### 2.1. Funções (Roles) Padronizadas do Sistema

* **`SYSTEM_ADMIN` (Administrador Sauron):** Acesso universal irrestrito a configurações de infraestrutura e billing do SaaS. Não acessa os dados contábeis de clientes a menos que explicitamente convidado.
* **`TENANT_OWNER` (Dono da Consultoria):** Administrador principal da consultoria parceira contratante. Gerencia faturamento, convites de consultores e ativação de projetos.
* **`SENIOR_CONSULTANT` (Consultor Sênior):** Responsável por conduzir os rituais, importar dados, modelar as simulações, criar e aprovar *Sauron Executive Stories*.
* **`CLIENT_VIEWER` (Diretor / CEO Cliente):** Visualizador de resultados dos Stories autorizados. Pode responder a rituais e registrar decisões estratégicas acordadas.
* **`CLIENT_OPERATOR` (Equipe Contábil/Financeira do Cliente):** Usuário responsável unicamente por subir planilhas financeiras e alimentar conexões SQL de dados, sem permissão para aprovar narrativas táticas.

### 2.2. Modelo de Permissões Finas (Fine-Grained Permissions)

Ao invés de verificar o nome da Role diretamente no código React ou Express, o sistema sempre avaliará **Ações e Recursos** (`actions:resources`):

```ts
// Exemplo lógico de verificação no SecurityEngine do Core
const checkPermission = (user: UserContext, resource: string, action: string): boolean => {
  return securityEngine.can(user.permissions, resource, action);
};

// Exemplo de uso prático
if (!checkPermission(currentUser, "stories", "approve")) {
  throw new Error("Forbidden: Operação de aprovação exige permissão específica.");
}
```

---

## 3. IMPERSONAÇÃO SEGURA (IMPERSONATION FLOW)

Frequentemente, consultores seniores precisam simular a visão exata que o cliente (CEO/Diretoria) terá dos painéis estratégicos ou validar problemas relatados pela operação técnica de carga contábil.

```
┌─────────────────┐             ┌─────────────────────┐             ┌─────────────────┐
│Consultor Sênior │ ──imperson──►│ Security Engine JWT │ ──new token─►│  Client Persona │
│(Session Active) │             │ (Validate & Audit)  │ ◄─Impersonat─ │  (Read-Only UI) │
└─────────────────┘             └─────────────────────┘             └─────────────────┘
```

### Regras de Segurança Críticas para Impersonação:
1. **Apenas com Consentimento do Tenant:** Um consultor só pode impersonar usuários de uma organização cliente se o administrador de segurança do tenant houver concedido a flag `allow_impersonation: true`.
2. **Assinatura Dual de JWT:** O token JWT de impersonação gerado contém os metadados de quem está impersonando (`impersonator_user_id`) e de quem está sendo impersonado (`target_user_id`).
3. **Escrita de Log de Auditoria Imutável:** O `AuditEngine` registra a ação de impersonação de forma imperativa: `User X started impersonating User Y at timestamp T`. Esse log é gravado diretamente em banco com hash de controle contra adulterações.

---

## 4. PREPARAÇÃO PARA SINGLE SIGN-ON (SSO) ENTERPRISE

Para atender indústrias, holdings e grandes concessionárias que já utilizam infraestruturas centralizadas de controle de acesso, a arquitetura do Sauron foi planejada desde o Dia Zero para se integrar de forma plugável com sistemas externos:
* **Protocolos Suportados:** **OAuth2 / OIDC** (OpenID Connect) e **SAML 2.0**.
* **Integrações de Identity Providers (IdP):** Azure Active Directory (Microsoft Entra ID), Okta, Keycloak e Google Workspace Cloud IAM.
* **Estratégia de Provisionamento Automatizado:** Suporte futuro ao padrão **SCIM 2.0** (System for Cross-domain Identity Management) para provisionamento, sincronização e desativação em lote de usuários a partir do diretório central da empresa parceira.
