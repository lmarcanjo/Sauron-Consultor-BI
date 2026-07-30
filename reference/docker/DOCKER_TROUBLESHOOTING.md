# Sauron Platform - Docker Dev Troubleshooting Guide

Este guia fornece soluções para os problemas mais comuns encontrados ao utilizar o Docker no ambiente de desenvolvimento da plataforma Sauron.

---

## 1. Erro de Docker Hub TLS Handshake Timeout

### Sintoma
Ao tentar baixar uma imagem (ex.: `postgres:15-alpine` ou `redis:7-alpine`), o Docker trava ou falha com uma mensagem parecida com:
```
Error response from daemon: Get "https://registry-1.docker.io/v2/": net/http: TLS handshake timeout
```

### Causa
Geralmente ocorre devido a instabilidades de rede local, problemas na resolução de DNS, ou bloqueio/lentidão de rotas de rede até os servidores do Docker Hub.

### Soluções
1. **Configurar Servidores de DNS Públicos**:
   Configure o daemon do seu Docker para utilizar servidores DNS rápidos (como Cloudflare `1.1.1.1` ou Google `8.8.8.8`).
   Edite (ou crie) o arquivo `/etc/docker/daemon.json`:
   ```json
   {
     "dns": ["1.1.1.1", "8.8.8.8"]
   }
   ```
   Depois, reinicie o serviço do Docker:
   ```bash
   sudo systemctl restart docker
   ```
2. **Utilizar Espelhos do Docker Registry (Mirrors)**:
   Se estiver operando em redes corporativas com restrições, configure um espelho (mirror) oficial ou corporativo no mesmo arquivo `daemon.json` usando a chave `"registry-mirrors"`.
3. **Verificar Configurações de Proxy**:
   Se a sua rede usa proxy, certifique-se de configurar as variáveis `HTTP_PROXY` e `HTTPS_PROXY` nas configurações do Docker Daemon.

---

## 2. Diferença entre DATABASE_URL com host "postgres" e "localhost"

### Causa
Como o banco de dados PostgreSQL roda dentro de um container isolado em uma rede Docker interna, a resolução do endereço IP depende do contexto de quem está fazendo a chamada.

### Resumo dos Contextos

| Contexto de Execução | Host do Banco | Exemplo de `DATABASE_URL` |
| :--- | :--- | :--- |
| **Dentro de um container** (ex.: `api`, `worker`) | `postgres` | `postgresql://sauron_user:sauron_secure_pass@postgres:5432/sauron_db?schema=public` |
| **Fora dos containers** (máquina local / host) | `localhost` | `postgresql://sauron_user:sauron_secure_pass@localhost:5432/sauron_db?schema=public` |

*   **Host `postgres`**: Funciona apenas dentro da rede virtual criada pelo Docker Compose, onde o serviço `postgres` tem seu nome resolvido automaticamente via DNS interno do Docker.
*   **Host `localhost`**: É utilizado quando você executa processos diretamente na sua máquina hospedeira (ex: `npm run dev`), apontando para a porta `5432` que foi mapeada externamente pelo compose.

---

## 3. Erro "Dockerfile.dev: no such file or directory"

### Sintoma
Ao executar o comando `docker compose up`, o Docker falha com:
```
failed to read dockerfile: open Dockerfile.dev: no such file or directory
```

### Causa
O arquivo `docker-compose.dev.yml` aponta para um caminho relativo de Dockerfile que não existe no local indicado pelo parâmetro `context` do serviço.

### Solução
A plataforma Sauron utiliza a seguinte estrutura padrão:
*   `context: ..` (resolve para a raiz do repositório)
*   `dockerfile: ./apps/api/Dockerfile.dev` (ou `./apps/worker/Dockerfile.dev`, `./Dockerfile.dev`)

Certifique-se de que:
1. Você está executando o comando a partir do diretório correto:
   ```bash
   sudo docker compose -f infrastructure/docker-compose.dev.yml up
   ```
2. Os arquivos de build estão de fato presentes nas pastas correspondentes:
   *   `/apps/api/Dockerfile.dev`
   *   `/apps/worker/Dockerfile.dev`
   *   `/Dockerfile.dev`

---

## 4. Como subir apenas os serviços de Infraestrutura (Postgres / Redis)

Em muitos cenários de desenvolvimento, você prefere rodar a API e o Frontend localmente no seu host (`npm run dev`) mas quer utilizar o Postgres e o Redis rodando de forma isolada em containers.

Para iniciar apenas os bancos de dados, execute:
```bash
sudo docker compose -f infrastructure/docker-compose.dev.yml up postgres redis -d
```

Para parar os bancos de dados mantendo os dados preservados nos volumes locais:
```bash
sudo docker compose -f infrastructure/docker-compose.dev.yml down
```

---

## 5. Como Testar a Saúde, Prontidão e Versão do Backend

Após subir os containers da API e do Worker, você pode validar o correto funcionamento utilizando chamadas HTTP simples.

### Teste de Health Check (Saúde Geral)
Verifica se a API está de pé e respondendo:
```bash
curl -i http://localhost:3001/api/v1/health
```
*   **Resposta esperada**: HTTP `200 OK`
*   **JSON esperado**: `{"status": "healthy"}`

### Teste de Readiness (Prontidão de Serviços)
Verifica se as conexões de banco e mensageria estão prontas:
```bash
curl -i http://localhost:3001/api/v1/readiness
```
*   **Resposta esperada**: HTTP `200 OK`
*   **JSON esperado**: `{"status": "ready"}`

### Teste de Versão (Release e Git Metadata)
Verifica a versão implantada no container:
```bash
curl -i http://localhost:3001/api/v1/version
```
*   **Resposta esperada**: HTTP `200 OK`
*   **JSON esperado**: Contém propriedades como `version` e metadata de compilação.
