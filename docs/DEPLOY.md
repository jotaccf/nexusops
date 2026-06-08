# Deploy NexusOps via Docker

Guia rápido para correr o NexusOps numa máquina nova a partir do GitHub.

## Pré-requisitos

- **Docker Desktop** (Windows/Mac) ou **Docker Engine + Compose** (Linux)
- **Git** (para clonar)
- ~500MB de espaço em disco

## Instalação (3 passos)

### 1. Clonar repo

```bash
git clone https://github.com/jotaccf/nexusops.git
cd nexusops
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Editar `.env` e alterar pelo menos:
- `POSTGRES_PASSWORD` — password forte para a BD
- `JWT_SECRET` — string aleatória longa (ex: `openssl rand -hex 32`)

### 3. Arrancar

```bash
docker compose up -d --build
```

Aguardar ~30 segundos para o build e arranque. O `entrypoint.sh` aplica o schema e corre o seed automaticamente na primeira vez.

### 4. Aceder

http://localhost:3030

**Contas pré-criadas** (password: `nexus2026`):

| Email | Role |
|---|---|
| ana@empresa.pt | admin |
| pedro@empresa.pt | gestor |
| carlos@empresa.pt | logística |
| rita@empresa.pt | logística |

⚠️ **Alterar passwords no primeiro acesso em produção.**

---

## Comandos úteis

### Ver logs
```bash
docker compose logs -f app
docker compose logs -f postgres
```

### Parar
```bash
docker compose down
```

### Parar e apagar dados
```bash
docker compose down -v   # remove também os volumes (BD!)
```

### Actualizar para nova versão
```bash
git pull
docker compose build app
docker compose up -d
```

### Backup BD
```bash
docker exec nexusops_postgres pg_dump -U nexusops nexusops > backup_$(date +%Y%m%d).sql
```

### Restaurar BD
```bash
cat backup.sql | docker exec -i nexusops_postgres psql -U nexusops nexusops
```

---

## Produção

Para deploy em produção, usar override:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Diferenças em produção:
- App bind em `127.0.0.1:3030` (atrás de reverse proxy)
- PostgreSQL sem porta exposta externamente
- `restart: always` em ambos os containers

Configurar reverse proxy (nginx/caddy/traefik) para HTTPS na porta 443 → 3030.

---

## Troubleshooting

### Porta 3030 ocupada
Mudar mapeamento em `docker-compose.yml`:
```yaml
ports:
  - "4040:3000"   # ou outra porta
```

### Resetar tudo (apaga dados!)
```bash
docker compose down -v
docker compose up -d --build
```

### Verificar saúde
```bash
docker ps
# nexusops_postgres deve estar (healthy)
# nexusops_app deve estar Up
```

### Container app não arranca
```bash
docker logs nexusops_app
# Verificar se a BD está acessível e env vars estão correctas
```
