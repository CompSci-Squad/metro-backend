#!/bin/bash
# Script para testar a instalação Docker completa

set -e

echo ""
echo "=========================================="
echo "🧪 TESTE DE INSTALAÇÃO DOCKER"
echo "=========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para teste com feedback visual
test_service() {
    local test_name=$1
    local test_command=$2
    
    echo -n "🔍 Testando: $test_name ... "
    
    if eval $test_command > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FALHOU${NC}"
        return 1
    fi
}

# Contador de falhas
FAILURES=0

echo "1️⃣  Verificando containers..."
echo ""

# Teste 1: Containers rodando
if docker-compose ps | grep -q "construction-backend.*Up"; then
    echo -e "${GREEN}✅${NC} Backend container está rodando"
else
    echo -e "${RED}❌${NC} Backend container não está rodando"
    FAILURES=$((FAILURES + 1))
fi

if docker-compose ps | grep -q "construction-postgres.*Up"; then
    echo -e "${GREEN}✅${NC} PostgreSQL container está rodando"
else
    echo -e "${RED}❌${NC} PostgreSQL container não está rodando"
    FAILURES=$((FAILURES + 1))
fi

if docker-compose ps | grep -q "construction-localstack.*Up"; then
    echo -e "${GREEN}✅${NC} LocalStack container está rodando"
else
    echo -e "${RED}❌${NC} LocalStack container não está rodando"
    FAILURES=$((FAILURES + 1))
fi

echo ""
echo "2️⃣  Verificando healthchecks..."
echo ""

# Teste 2: Healthchecks
sleep 5  # Aguardar healthchecks rodarem

if docker inspect construction-postgres | grep -q '"Status": "healthy"'; then
    echo -e "${GREEN}✅${NC} PostgreSQL está saudável"
else
    echo -e "${YELLOW}⚠️${NC}  PostgreSQL ainda não está saudável (pode estar iniciando)"
fi

if docker inspect construction-localstack | grep -q '"Status": "healthy"'; then
    echo -e "${GREEN}✅${NC} LocalStack está saudável"
else
    echo -e "${YELLOW}⚠️${NC}  LocalStack ainda não está saudável (pode estar iniciando)"
fi

if docker inspect construction-backend | grep -q '"Status": "healthy"' 2>/dev/null; then
    echo -e "${GREEN}✅${NC} Backend está saudável"
else
    echo -e "${YELLOW}⚠️${NC}  Backend ainda não está saudável (pode estar iniciando)"
fi

echo ""
echo "3️⃣  Testando conectividade..."
echo ""

# Teste 3: Health endpoint do backend
echo -n "🌐 Testando endpoint /health ... "
if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
    RESPONSE=$(curl -s http://localhost:3000/health)
    echo "   Resposta: $RESPONSE"
else
    echo -e "${RED}❌ FALHOU${NC}"
    echo -e "${YELLOW}   Aguarde mais alguns segundos e tente novamente${NC}"
    FAILURES=$((FAILURES + 1))
fi

# Teste 4: LocalStack S3 health
echo -n "☁️  Testando LocalStack ... "
if curl -sf http://localhost:4566/_localstack/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FALHOU${NC}"
    FAILURES=$((FAILURES + 1))
fi

# Teste 5: PostgreSQL connection
echo -n "📊 Testando PostgreSQL ... "
if docker exec construction-postgres psql -U postgres -d construction_monitoring -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FALHOU${NC}"
    FAILURES=$((FAILURES + 1))
fi

echo ""
echo "4️⃣  Verificando estrutura do banco..."
echo ""

# Teste 6: Tabelas criadas
TABLE_COUNT=$(docker exec construction-postgres psql -U postgres -d construction_monitoring -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('obras', 'fotos', 'relatorios', 'arquivos_bim');" 2>/dev/null | tr -d ' ')

if [ "$TABLE_COUNT" = "4" ]; then
    echo -e "${GREEN}✅${NC} Todas as 4 tabelas estão criadas:"
    docker exec construction-postgres psql -U postgres -d construction_monitoring -c "\dt" 2>/dev/null | grep -E "(obras|fotos|relatorios|arquivos_bim)" | sed 's/^/   /'
else
    echo -e "${RED}❌${NC} Apenas $TABLE_COUNT de 4 tabelas encontradas"
    FAILURES=$((FAILURES + 1))
fi

echo ""
echo "5️⃣  Verificando bucket S3..."
echo ""

# Teste 7: Bucket S3 criado
if docker exec construction-localstack awslocal s3 ls | grep -q "construction-monitoring-bucket"; then
    echo -e "${GREEN}✅${NC} Bucket S3 criado: construction-monitoring-bucket"
else
    echo -e "${RED}❌${NC} Bucket S3 não encontrado"
    FAILURES=$((FAILURES + 1))
fi

echo ""
echo "=========================================="

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✅ TODOS OS TESTES PASSARAM!${NC}"
    echo "=========================================="
    echo ""
    echo "🎉 Sistema está 100% operacional!"
    echo ""
    echo "📋 Próximos passos:"
    echo "   1. Testar criação de projeto: curl -X POST http://localhost:3000/api/projects ..."
    echo "   2. Ver documentação: cat API_DOCUMENTATION.md"
    echo "   3. Ver logs: docker-compose logs -f backend"
    echo ""
    exit 0
else
    echo -e "${RED}❌ $FAILURES TESTE(S) FALHARAM${NC}"
    echo "=========================================="
    echo ""
    echo "🔧 Sugestões:"
    echo "   1. Aguarde mais tempo para inicialização completa (30-60s)"
    echo "   2. Verifique os logs: docker-compose logs backend"
    echo "   3. Reinicie os serviços: docker-compose restart"
    echo "   4. Consulte: cat DOCKER_QUICKSTART.md"
    echo ""
    exit 1
fi
