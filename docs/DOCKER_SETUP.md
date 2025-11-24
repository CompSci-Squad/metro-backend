# Docker Setup Guide

Este guia explica como executar o projeto Construction Site Monitoring usando Docker e Docker Compose.

## Pré-requisitos

- Docker Desktop instalado (Windows/Mac) ou Docker Engine + Docker Compose (Linux)
- Mínimo 4GB RAM disponível
- Porta 3000 (Backend), 5432 (PostgreSQL), 4566 (LocalStack S3) disponíveis

## Estrutura dos Containers

O projeto usa 4 containers principais:

1. **postgres** - Banco de dados PostgreSQL 14
2. **localstack** - Emulador AWS S3 para desenvolvimento
3. **backend** - API Node.js/Express
4. **localstack-init** - Inicialização automática do bucket S3 (executa uma vez e para)

## Instalação e Execução

### 1. Clonar o Repositório

\`\`\`bash
git clone https://github.com/seu-usuario/construction-monitoring.git
cd construction-monitoring
\`\`\`

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

\`\`\`bash
# VIRAG-BIM API (obrigatório para integração com IA)
NGROK_URL=https://your-ngrok-url.ngrok-free.app
VIRAG_API_KEY=your_virag_api_key_here
\`\`\`

**Nota:** As outras variáveis (DB, S3) já estão configuradas no `docker-compose.yml`.

### 3. Iniciar os Containers

\`\`\`bash
# Construir e iniciar todos os serviços
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f

# Ver logs apenas do backend
docker-compose logs -f backend
\`\`\`

### 4. Verificar se está funcionando

\`\`\`bash
# Health check da API
curl http://localhost:3000/health

# Resposta esperada:
# {"status":"OK","message":"API de Monitoramento de Obras funcionando!"}
\`\`\`

### 5. Criar o Bucket S3 no LocalStack (se necessário)

O bucket é criado automaticamente pelo container `localstack-init`, mas se precisar criar manualmente:

\`\`\`bash
# Entrar no container do LocalStack
docker exec -it construction-localstack sh

# Criar bucket
awslocal s3 mb s3://construction-monitoring-bucket

# Listar buckets
awslocal s3 ls
\`\`\`

## Comandos Úteis

### Gerenciamento de Containers

\`\`\`bash
# Parar todos os containers
docker-compose stop

# Parar e remover containers
docker-compose down

# Parar e remover containers + volumes (CUIDADO: apaga banco de dados)
docker-compose down -v

# Reiniciar um serviço específico
docker-compose restart backend

# Ver status dos containers
docker-compose ps
\`\`\`

### Logs e Debug

\`\`\`bash
# Logs de todos os serviços
docker-compose logs

# Logs do backend com seguimento
docker-compose logs -f backend

# Logs do PostgreSQL
docker-compose logs postgres

# Últimas 100 linhas de log
docker-compose logs --tail=100 backend
\`\`\`

### Acessar Containers

\`\`\`bash
# Bash no container do backend
docker exec -it construction-backend sh

# PostgreSQL CLI
docker exec -it construction-postgres psql -U postgres -d construction_monitoring

# LocalStack
docker exec -it construction-localstack sh
\`\`\`

### Rebuild e Atualização

\`\`\`bash
# Rebuild do backend (após mudanças no código)
docker-compose up -d --build backend

# Rebuild completo (todos os serviços)
docker-compose up -d --build

# Forçar recreação dos containers
docker-compose up -d --force-recreate
\`\`\`

## Executar Scripts SQL

### Dentro do container PostgreSQL:

\`\`\`bash
docker exec -it construction-postgres psql -U postgres -d construction_monitoring -f /docker-entrypoint-initdb.d/001_create_tables.sql
\`\`\`

### Da sua máquina local:

\`\`\`bash
docker exec -i construction-postgres psql -U postgres -d construction_monitoring < scripts/001_create_tables.sql
\`\`\`

## Testar a API

### Criar um Projeto

\`\`\`bash
curl -X POST http://localhost:3000/api/projects \
  -F "nome_obra=Edifício Test" \
  -F "responsavel_obra=Eng. João" \
  -F "localizacao=São Paulo" \
  -F "previsao_termino=31-12-2025" \
  -F "arquivo=@/caminho/para/arquivo.ifc"
\`\`\`

### Listar Projetos

\`\`\`bash
curl http://localhost:3000/api/projects
\`\`\`

### Upload de Foto

\`\`\`bash
curl -X POST http://localhost:3000/api/photos/123456 \
  -F "foto=@/caminho/para/foto.jpg" \
  -F "nome_foto=Fachada Principal" \
  -F "descricao_foto=Vista frontal"
\`\`\`

## Configuração de Produção

Para produção, modifique o `docker-compose.yml`:

1. **Remover LocalStack** - Usar AWS S3 real
2. **Usar PostgreSQL gerenciado** - AWS RDS, Google Cloud SQL, etc.
3. **Adicionar HTTPS** - Nginx/Traefik com certificados SSL
4. **Configurar secrets** - Usar Docker Secrets ou AWS Secrets Manager
5. **Aumentar recursos** - Ajustar limites de CPU/RAM

### Exemplo de configuração para AWS S3 real:

\`\`\`yaml
backend:
  environment:
    # Remover AWS_ENDPOINT_URL
    AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
    AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
    AWS_REGION: us-east-1
    S3_BUCKET_NAME: production-construction-bucket
\`\`\`

## Troubleshooting

### Container não inicia

\`\`\`bash
# Ver logs completos
docker-compose logs backend

# Verificar se porta está em uso
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Linux/Mac
\`\`\`

### Erro de conexão com banco de dados

\`\`\`bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Verificar health check
docker inspect construction-postgres | grep -A 10 Health

# Conectar manualmente
docker exec -it construction-postgres psql -U postgres
\`\`\`

### Bucket S3 não existe

\`\`\`bash
# Recriar bucket
docker exec -it construction-localstack sh
awslocal s3 mb s3://construction-monitoring-bucket
awslocal s3 ls
\`\`\`

### Puppeteer/PDF não funciona

\`\`\`bash
# Verificar se Chromium está instalado no container
docker exec -it construction-backend chromium-browser --version

# Ver logs de erro do Puppeteer
docker-compose logs backend | grep -i puppeteer
\`\`\`

## Monitoramento

### Health Checks

Todos os serviços têm health checks configurados:

\`\`\`bash
# Ver status de saúde
docker inspect construction-backend | grep -A 5 Health
docker inspect construction-postgres | grep -A 5 Health
docker inspect construction-localstack | grep -A 5 Health
\`\`\`

### Recursos

\`\`\`bash
# Ver uso de recursos
docker stats

# Ver apenas backend
docker stats construction-backend
\`\`\`

## Backup

### Backup do Banco de Dados

\`\`\`bash
# Criar backup
docker exec construction-postgres pg_dump -U postgres construction_monitoring > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker exec -i construction-postgres psql -U postgres construction_monitoring < backup_20241120.sql
\`\`\`

### Backup de Volumes

\`\`\`bash
# Backup do volume PostgreSQL
docker run --rm -v construction-monitoring_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data

# Restaurar volume PostgreSQL
docker run --rm -v construction-monitoring_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz
\`\`\`

## Desenvolvimento

Para desenvolvimento com hot-reload:

\`\`\`yaml
backend:
  # ... outras configurações
  volumes:
    - ./src:/app/src  # Hot reload do código fonte
  command: npm run dev  # Usar nodemon
\`\`\`

Depois execute:

\`\`\`bash
docker-compose up -d --build backend
\`\`\`

## Portas Expostas

- **3000** - Backend API
- **5432** - PostgreSQL
- **4566** - LocalStack S3
- **4571** - LocalStack S3 (alternativa)

## Variáveis de Ambiente

Todas as variáveis de ambiente estão documentadas em `.env.example`.

**Obrigatórias:**
- `NGROK_URL` - URL do túnel ngrok para conectar com a IA VIRAG-BIM
- `VIRAG_API_KEY` - Chave de API da VIRAG-BIM

**Automáticas no Docker Compose:**
- Credenciais do banco de dados
- Configuração do LocalStack S3
- Porta do servidor

## Suporte

Se encontrar problemas:

1. Verifique os logs: `docker-compose logs -f`
2. Verifique o health check: `docker-compose ps`
3. Reinicie os containers: `docker-compose restart`
4. Reconstrua: `docker-compose up -d --build`
5. Limpe tudo: `docker-compose down -v && docker-compose up -d --build`
