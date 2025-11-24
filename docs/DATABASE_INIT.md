# Inicialização Automática do Banco de Dados

Este projeto está configurado para criar automaticamente todas as tabelas necessárias no banco de dados.

## Como Funciona

### Com Docker (Recomendado)

Quando você executa `docker-compose up` pela primeira vez:

1. **PostgreSQL inicia** e cria o banco de dados `construction_monitoring`
2. **Scripts SQL são executados automaticamente** do diretório `/scripts`
3. **Tabelas são criadas** na ordem correta com todas as foreign keys
4. **Backend verifica** a conexão e existência das tabelas ao iniciar

O PostgreSQL usa o diretório `/docker-entrypoint-initdb.d/` para executar scripts na primeira inicialização.

\`\`\`yaml
# docker-compose.yml
volumes:
  - ./scripts:/docker-entrypoint-initdb.d  # <- Scripts SQL executados automaticamente
\`\`\`

### Sem Docker (Manual)

Se você estiver rodando sem Docker, execute o script SQL manualmente:

\`\`\`bash
# Criar banco de dados
psql -U postgres -c "CREATE DATABASE construction_monitoring;"

# Executar script de criação das tabelas
psql -U postgres -d construction_monitoring -f scripts/001_create_tables.sql
\`\`\`

## Verificação Automática

O backend verifica automaticamente:

1. **Conexão com o banco**: Tenta conectar ao PostgreSQL
2. **Existência das tabelas**: Verifica se todas as 4 tabelas existem
3. **Retry automático**: Se falhar, tenta reconectar a cada 5 segundos

### Logs de Inicialização

\`\`\`
🔄 Iniciando servidor...
✅ Conectado ao banco de dados PostgreSQL
✅ Conexão com banco de dados verificada
✅ Todas as tabelas necessárias estão criadas
🚀 Servidor rodando na porta 3000
\`\`\`

## Tabelas Criadas Automaticamente

O script `001_create_tables.sql` cria:

1. **obras** - Projetos de construção
2. **fotos** - Fotos das obras com análise IA
3. **relatorios** - Relatórios e análises em JSON/PDF
4. **arquivos_bim** - Arquivos BIM (IFC, RVT, etc)

Além disso, cria:
- Função `generate_random_id()` para IDs aleatórios de 6 dígitos
- Índices para performance
- Triggers para `updated_at` automático
- Foreign keys com CASCADE DELETE

## Reinicialização do Banco

### Docker - Resetar banco completamente

\`\`\`bash
# Parar containers
docker-compose down

# Remover volumes (APAGA TODOS OS DADOS!)
docker-compose down -v

# Reiniciar (scripts SQL serão executados novamente)
docker-compose up -d
\`\`\`

### Manual - Recriar tabelas

\`\`\`bash
# Conectar ao banco
psql -U postgres -d construction_monitoring

# Dropar todas as tabelas
DROP TABLE IF EXISTS arquivos_bim CASCADE;
DROP TABLE IF EXISTS relatorios CASCADE;
DROP TABLE IF EXISTS fotos CASCADE;
DROP TABLE IF EXISTS obras CASCADE;
DROP FUNCTION IF EXISTS generate_random_id();
DROP FUNCTION IF EXISTS update_updated_at_column();

# Sair
\q

# Executar script novamente
psql -U postgres -d construction_monitoring -f scripts/001_create_tables.sql
\`\`\`

## Troubleshooting

### Erro: "Tabelas não encontradas"

\`\`\`
⚠️  Tabelas não encontradas: obras, fotos, relatorios, arquivos_bim
\`\`\`

**Solução com Docker:**
\`\`\`bash
docker-compose down -v
docker-compose up -d
\`\`\`

**Solução manual:**
\`\`\`bash
psql -U postgres -d construction_monitoring -f scripts/001_create_tables.sql
\`\`\`

### Erro: "Não foi possível conectar ao banco de dados"

\`\`\`
❌ Falha ao conectar com o banco de dados
\`\`\`

**Verifique:**
1. PostgreSQL está rodando: `docker ps` ou `pg_isready`
2. Credenciais estão corretas no `.env`
3. Porta 5432 está disponível: `netstat -an | grep 5432`

### Backend não inicia

O backend tem retry automático. Se o PostgreSQL demorar para iniciar, aguarde alguns segundos:

\`\`\`
❌ Não foi possível conectar ao banco de dados. Tentando novamente em 5 segundos...
\`\`\`

## Verificação Manual

Para verificar se as tabelas foram criadas:

\`\`\`bash
# Conectar ao banco
docker exec -it construction-postgres psql -U postgres -d construction_monitoring

# Ou sem Docker
psql -U postgres -d construction_monitoring

# Listar tabelas
\dt

# Verificar estrutura de uma tabela
\d obras

# Contar registros
SELECT COUNT(*) FROM obras;

# Sair
\q
\`\`\`

## Scripts Disponíveis

- `scripts/001_create_tables.sql` - Script consolidado com todas as tabelas
- `scripts/init-check.sh` - Script bash para verificação (usado internamente)
