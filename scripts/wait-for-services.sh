#!/bin/bash
# Script robusto para aguardar todos os serviços estarem prontos

set -e

echo "=========================================="
echo "🔄 Aguardando serviços ficarem prontos..."
echo "=========================================="

# Função para aguardar PostgreSQL
wait_for_postgres() {
    echo ""
    echo "📊 [1/2] Aguardando PostgreSQL..."
    echo "   Host: ${DB_HOST}:${DB_PORT}"
    echo "   Database: ${DB_NAME}"
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; then
            echo "   ✅ PostgreSQL está pronto! (tentativa $attempt/$max_attempts)"
            return 0
        fi
        echo "   ⏳ PostgreSQL não está pronto... (tentativa $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "   ❌ Timeout aguardando PostgreSQL após $max_attempts tentativas"
    return 1
}

# Função para aguardar LocalStack S3
wait_for_localstack() {
    echo ""
    echo "☁️  [2/2] Aguardando LocalStack S3..."
    echo "   Endpoint: ${AWS_ENDPOINT}"
    
    local max_attempts=30
    local attempt=1
    
    # Extrair host do endpoint (remover http:// e porta)
    local host=$(echo $AWS_ENDPOINT | sed 's|http://||' | sed 's|:.*||')
    local port=$(echo $AWS_ENDPOINT | sed 's|.*:||')
    
    while [ $attempt -le $max_attempts ]; do
        if curl -sf "${AWS_ENDPOINT}/_localstack/health" > /dev/null 2>&1; then
            echo "   ✅ LocalStack está pronto! (tentativa $attempt/$max_attempts)"
            return 0
        fi
        echo "   ⏳ LocalStack não está pronto... (tentativa $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "   ⚠️  LocalStack não respondeu após $max_attempts tentativas"
    echo "   ⚠️  Continuando mesmo assim (S3 pode estar disponível)"
    return 0  # Não falhar por causa do LocalStack
}

# Função para verificar/criar tabelas
verify_and_create_tables() {
    echo ""
    echo "🗄️  Verificando tabelas do banco de dados..."
    
    local table_count=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('obras', 'fotos', 'relatorios', 'arquivos_bim');" 2>/dev/null | tr -d ' ')
    
    echo "   📊 Tabelas encontradas: $table_count/4"
    
    if [ "$table_count" -eq 4 ]; then
        echo "   ✅ Todas as tabelas necessárias já existem!"
        
        # Listar as tabelas
        echo ""
        echo "   📋 Tabelas disponíveis:"
        PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\dt" 2>/dev/null | grep -E "(obras|fotos|relatorios|arquivos_bim)" | sed 's/^/      /'
        
        return 0
    fi
    
    echo "   ⚠️  Tabelas faltando. Executando script de criação..."
    
    if [ -f "/app/scripts/001_create_tables.sql" ]; then
        if PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "/app/scripts/001_create_tables.sql" 2>&1 | sed 's/^/      /'; then
            echo "   ✅ Tabelas criadas com sucesso!"
            
            # Verificar novamente
            table_count=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('obras', 'fotos', 'relatorios', 'arquivos_bim');" | tr -d ' ')
            echo "   📊 Verificação final: $table_count/4 tabelas"
            
            return 0
        else
            echo "   ❌ Erro ao criar tabelas!"
            return 1
        fi
    else
        echo "   ❌ Script SQL não encontrado: /app/scripts/001_create_tables.sql"
        return 1
    fi
}

# Executar verificações
wait_for_postgres || exit 1
wait_for_localstack
verify_and_create_tables || exit 1

echo ""
echo "=========================================="
echo "✅ Todos os serviços estão prontos!"
echo "🚀 Iniciando aplicação..."
echo "=========================================="
echo ""

exit 0
