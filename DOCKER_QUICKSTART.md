# 🐳 Docker Quick Start Guide

## 🚀 Início Rápido (3 comandos)

```bash
# 1. Configure as variáveis de ambiente (OBRIGATÓRIO)
cp .env .env.backup  # backup do seu .env atual se existir
nano .env  # ou use seu editor preferido

# 2. Inicie todos os serviços
docker-compose up -d --build

# 3. Verifique os logs
docker-compose logs -f backend
```

## ✅ O que foi configurado

### 📋 Melhorias Implementadas

1. **Dockerfile Otimizado**
   - Multi-stage build para imagem menor
   - PostgreSQL client e bash instalados
   - Scripts automatizados executáveis
   - Logs detalhados em cada etapa
   - Healthcheck configurado

2. **docker-compose.yml Completo**
   - PostgreSQL com inicialização automática de tabelas
   - LocalStack S3 para desenvolvimento
   - Healthchecks em todos os serviços
   - Logging configurado (10MB por arquivo, 3 arquivos)
   - Dependências corretas entre serviços

3. **Scripts de Inicialização**
   - `wait-for-services.sh` - Aguarda PostgreSQL e LocalStack
   - Verifica e cria tabelas automaticamente
   - Logs detalhados de cada etapa

4. **Logs Completos**
   - `database.js` - Conexão, versão, estatísticas de tabelas
   - `s3.js` - Configuração, uploads, downloads
   - `server.js` - Inicialização passo a passo, retry logic

## 📦 Serviços Incluídos

### 1. PostgreSQL (porta 5433)
- Database: `construction_monitoring`
- User: `postgres`
- Password: `postgres123`
- Inicialização automática de tabelas via script SQL

### 2. LocalStack S3 (porta 4566)
- Emulador AWS S3 local
- Bucket criado automaticamente: `construction-monitoring-bucket`
- Persistência de dados

### 3. Backend API (porta 3000)
- Node.js 18 Alpine
- Verificação automática de banco e tabelas
- Retry logic para conexão com banco

## 🛠️ Comandos Úteis

### Gerenciamento de Containers

```bash
# Iniciar todos os serviços
docker-compose up -d

# Iniciar com rebuild (após mudanças no código)
docker-compose up -d --build

# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f localstack

# Parar todos os serviços
docker-compose stop

# Parar e remover containers
docker-compose down

# Parar e remover containers + volumes (CUIDADO: apaga dados)
docker-compose down -v
```

### Verificação de Status

```bash
# Ver status de todos os containers
docker-compose ps

# Ver status de saúde
docker-compose ps | grep -E "(healthy|unhealthy)"

# Testar API
curl http://localhost:3000/health

# Testar LocalStack
curl http://localhost:4566/_localstack/health
```

### Debugging

```bash
# Entrar no container do backend
docker exec -it construction-backend /bin/bash

# Entrar no PostgreSQL
docker exec -it construction-postgres psql -U postgres -d construction_monitoring

# Ver logs em tempo real com timestamps
docker-compose logs -f --timestamps backend

# Ver últimas 100 linhas de log
docker-compose logs --tail=100 backend
```

### Banco de Dados

```bash
# Conectar ao PostgreSQL
docker exec -it construction-postgres psql -U postgres -d construction_monitoring

# Listar tabelas
docker exec -it construction-postgres psql -U postgres -d construction_monitoring -c "\dt"

# Ver registros em uma tabela
docker exec -it construction-postgres psql -U postgres -d construction_monitoring -c "SELECT * FROM obras;"

# Recriar tabelas (CUIDADO: apaga dados)
docker exec -it construction-postgres psql -U postgres -d construction_monitoring -f /docker-entrypoint-initdb.d/001_create_tables.sql
```

### LocalStack S3

```bash
# Listar buckets
docker exec -it construction-localstack awslocal s3 ls

# Listar arquivos em um bucket
docker exec -it construction-localstack awslocal s3 ls s3://construction-monitoring-bucket/

# Criar bucket manualmente (se necessário)
docker exec -it construction-localstack awslocal s3 mb s3://construction-monitoring-bucket
```

## 🔍 Verificação de Inicialização

### O que você deve ver nos logs:

```
==========================================
🚀 INICIANDO SERVIDOR METRO BACKEND
==========================================

📊 Configuração do banco de dados:
   Host: postgres:5432
   Database: construction_monitoring
   User: postgres

☁️  Configurando cliente S3...
   Região: us-east-1
   Bucket: construction-monitoring-bucket
   Endpoint: http://localstack:4566 (LocalStack)
   ForcePathStyle: true
✅ Cliente S3 configurado com sucesso!

📊 [1/3] Verificando conexão com banco de dados...
🔍 Testando conexão com banco de dados...
✅ Conexão com banco de dados verificada!
   Hora do servidor: 2024-11-24 18:30:00
   Versão: PostgreSQL 14.x
   Pool status: 1 conexões, 0 ociosas

🗄️  [2/3] Verificando estrutura do banco de dados...
🔍 Verificando estrutura do banco de dados...
✅ Todas as 4 tabelas necessárias estão criadas:
   - arquivos_bim
   - fotos
   - obras
   - relatorios

📊 Estatísticas das tabelas:
   - arquivos_bim: 0 registros
   - fotos: 0 registros
   - obras: 0 registros
   - relatorios: 0 registros

🌐 [3/3] Iniciando servidor HTTP...

==========================================
✅ SERVIDOR INICIADO COM SUCESSO!
==========================================
⏱️  Tempo de inicialização: 2.34s
🌐 Servidor: http://localhost:3000
❤️  Health check: http://localhost:3000/health
📚 API Base: http://localhost:3000/api
🔧 Ambiente: production
==========================================

📋 Endpoints disponíveis:
   - GET  /health
   - POST /api/projects
   - POST /api/photos/:projectId
   - POST /api/reports/:projectId
   - POST /api/bim/:projectId
   - POST /api/ai/:projectId/analyze-image

✨ Sistema pronto para receber requisições!
```

## ⚠️ Troubleshooting

### Problema: Backend não inicia

```bash
# Ver logs detalhados
docker-compose logs backend

# Verificar se PostgreSQL está saudável
docker-compose ps postgres

# Reiniciar apenas o backend
docker-compose restart backend
```

### Problema: Tabelas não foram criadas

```bash
# Verificar logs do PostgreSQL
docker-compose logs postgres

# Criar tabelas manualmente
docker exec -it construction-postgres psql -U postgres -d construction_monitoring -f /docker-entrypoint-initdb.d/001_create_tables.sql

# Reiniciar backend
docker-compose restart backend
```

### Problema: LocalStack não responde

```bash
# Verificar logs
docker-compose logs localstack

# Recriar bucket manualmente
docker exec -it construction-localstack awslocal s3 mb s3://construction-monitoring-bucket

# Reiniciar LocalStack
docker-compose restart localstack localstack-init
```

### Problema: Porta já em uso

Se alguma porta já estiver em uso, edite `docker-compose.yml`:

```yaml
# Exemplo: mudar porta do backend de 3000 para 3001
ports:
  - "3001:3000"  # HOST:CONTAINER
```

## 📊 Monitoramento

### Usar `docker stats` para ver uso de recursos

```bash
docker stats construction-backend construction-postgres construction-localstack
```

### Ver uso de disco dos volumes

```bash
docker system df -v
```

## 🧹 Limpeza

```bash
# Remover containers parados
docker-compose down

# Remover containers + volumes (apaga dados!)
docker-compose down -v

# Limpar cache do Docker
docker system prune -a
```

## 📝 Variáveis de Ambiente Necessárias

Edite o arquivo `.env` e configure:

```env
# OBRIGATÓRIAS para integração com IA
NGROK_URL=https://seu-ngrok-url.ngrok-free.app
VIRAG_API_KEY=sua_chave_api_aqui

# As outras variáveis já estão no docker-compose.yml
# e não precisam estar no .env local
```

## 🎯 Próximos Passos

1. ✅ Configure o `.env` com NGROK_URL e VIRAG_API_KEY
2. ✅ Execute `docker-compose up -d --build`
3. ✅ Aguarde ~30 segundos para inicialização completa
4. ✅ Teste: `curl http://localhost:3000/health`
5. ✅ Comece a usar a API!

## 📚 Documentação Adicional

- [API Documentation](./API_DOCUMENTATION.md)
- [Docker Setup](./docs/DOCKER_SETUP.md)
- [Environment Variables](./docs/ENVIRONMENT_VARIABLES.md)
