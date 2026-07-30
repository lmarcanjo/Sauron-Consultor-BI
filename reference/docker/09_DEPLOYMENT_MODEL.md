# SAURON DEPLOYMENT MODEL — CONTAINER & CLOUD INFRASTRUCTURE

## 1. DOCKER CONTEXT & COMPILING STRATEGY (PRODUCTION STAGE)

O Sauron Enterprise será distribuído exclusivamente sob o formato de contêineres Docker, permitindo homogeneidade entre os ambientes de Desenvolvimento, Homologação e Produção.

```
                      ┌────────────────────────────────┐
                      │    Dockerfile (Multi-Stage)    │
                      └──────────────┬─────────────────┘
                                     │ (Build Stage & Dev Dependencies)
                                     ▼
                      ┌────────────────────────────────┐
                      │    Compiled Static Web Asset   │
                      │    (HTML, JS, CSS inside dist/)│
                      └──────────────┬─────────────────┘
                                     │ (Runtime Stage & Only Production deps)
                                     ▼
                      ┌────────────────────────────────┐
                      │     Sauron Production Image    │
                      │     (Node.js server-side)      │
                      └────────────────────────────────┘
```

### 1.1. Dockerfile Otimizado Multi-Stage
A imagem de produção do Sauron utiliza uma estratégia de compilação em múltiplos estágios para garantir que a imagem final seja enxuta, livre de compiladores de TypeScript ou dependências de desenvolvimento, reduzindo a superfície de ataque e o tempo de inicialização (cold start).

```dockerfile
# Estágio 1: Build da Aplicação
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Estágio 2: Runner de Produção Enxuto
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./

EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

---

## 2. ORQUESTRAÇÃO & ESCALABILIDADE HORIZONTAL (KUBERNETES)

Para garantir estabilidade durante reuniões de conselhos de administração em horários de pico, a infraestrutura utilizará o **Google Kubernetes Engine (GKE)** ou contêineres escaláveis no **Google Cloud Run** com escalonamento horizontal automático baseada no consumo de CPU e RAM (Horizontal Pod Autoscaler - HPA).

* **Limites de CPU e RAM por Pod (Resource Limits):**
  * `requests`: `cpu: "500m"`, `memory: "1Gi"`
  * `limits`: `cpu: "1.5"`, `memory: "2.5Gi"`
* **Autoscaling Threshold:** Dispara a criação de réplicas adicionais sempre que a média de utilização de CPU de todos os contêineres ultrapassar **75%** ou se o consumo de memória cruzar **80%** de ocupação estável.

---

## 3. CICLO DE ATUALIZAÇÕES CONTÍNUAS SEM INSTABILIDADE (ROLLING UPDATE)

Para evitar interrupções de serviço para rituais estratégicos ativos, todas as atualizações de novas versões em produção executarão o fluxo de **Rolling Update** (atualização progressiva):

1. **Início do Deploy:** O orquestrador Kubernetes inicia um novo Pod com a imagem atualizada.
2. **Checagem de Prontidão (Readiness Probe):** O novo Pod aguarda o endpoint `/api/health/ready` retornar `HTTP 200 OK` (aguarda conexões com banco e Redis).
3. **Redirecionamento de Tráfego:** Uma vez saudável, o proxy de entrada (Ingress) passa a rotear novas conexões para a versão atualizada.
4. **Desativação Gradual:** O Pod antigo recebe um sinal de término (`SIGTERM`), aguarda 30 segundos para concluir transações de planilhas financeiras em andamento e, em seguida, é desligado com segurança.

---

## 4. GERENCIAMENTO DE SEGREDOS & VARIÁVEIS DE AMBIENTE

* **Regra Rígida:** É expressamente proibido versionar chaves de API, senhas de banco ou segredos criptográficos no arquivo de código, imagens do Docker ou repositórios Git.
* **Solução:** Integração nativa com o **Google Secret Manager** ou **HashiCorp Vault**.
* No momento da inicialização do contêiner no Cloud Run/Kubernetes, as chaves secretas são injetadas de forma segura diretamente na memória RAM do processo do Node.js, expostas exclusivamente através da variável global `process.env`.

```bash
# .env.example (Padrão de Variáveis Obrigatórias Documentadas)
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://sauron_user@cloudsql_ip:5432/sauron_prod?sslmode=require
REDIS_URL=redis://redis_ip:6379
JWT_SECRET=your_jwt_signing_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```
