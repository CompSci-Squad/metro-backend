#!/bin/bash
# Script de teste rápido - Execute este arquivo para testar tudo!

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   🚀 TESTE RÁPIDO - METRO BACKEND     ║"
echo "╔════════════════════════════════════════╗"
echo ""

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando!"
    echo "   Inicie o Docker Desktop e tente novamente."
    exit 1
fi

echo "✅ Docker está rodando"
echo ""

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado!"
    echo ""
    echo "📝 Criando .env a partir do exemplo..."
    cp .env.example .env
    echo "✅ Arquivo .env criado!"
    echo ""
    echo "⚠️  AÇÃO NECESSÁRIA:"
    echo "   Edite o arquivo .env e configure:"
    echo "   - NGROK_URL=https://seu-ngrok-url.ngrok-free.app"
    echo "   - VIRAG_API_KEY=sua_chave_api"
    echo ""
    read -p "Pressione ENTER depois de configurar o .env..."
fi

echo "✅ Arquivo .env encontrado"
echo ""

# Parar containers existentes
echo "🛑 Parando containers existentes (se houver)..."
docker-compose down > /dev/null 2>&1
echo "✅ Containers parados"
echo ""

# Construir e iniciar
echo "🏗️  Construindo e iniciando containers..."
echo "   (Isso pode levar alguns minutos na primeira vez)"
echo ""
docker-compose up -d --build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Erro ao iniciar containers!"
    echo "   Verifique os logs: docker-compose logs"
    exit 1
fi

echo ""
echo "✅ Containers iniciados!"
echo ""

# Aguardar inicialização
echo "⏳ Aguardando inicialização completa..."
echo "   PostgreSQL, LocalStack e Backend podem levar até 60 segundos"
echo ""

for i in {1..12}; do
    echo -n "   ${i}0 segundos... "
    sleep 5
    
    # Testar health endpoint
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ Backend está respondendo!"
        break
    fi
    
    if [ $i -eq 12 ]; then
        echo "ainda aguardando..."
    else
        echo "ainda iniciando..."
    fi
done

echo ""
echo "🧪 Executando testes de validação..."
echo ""

# Executar script de teste
if [ -f scripts/test-docker.sh ]; then
    bash scripts/test-docker.sh
else
    echo "⚠️  Script de teste não encontrado, fazendo verificação básica..."
    
    # Teste básico
    if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ Backend respondendo"
    else
        echo "❌ Backend não está respondendo"
    fi
fi

echo ""
echo "╔════════════════════════════════════════╗"
echo "║        🎉 TESTE CONCLUÍDO!            ║"
echo "╔════════════════════════════════════════╗"
echo ""
echo "📋 Próximos passos:"
echo "   1. Ver logs: docker-compose logs -f backend"
echo "   2. Testar API: curl http://localhost:3000/health"
echo "   3. Ver documentação: cat API_DOCUMENTATION.md"
echo ""
echo "🔧 Comandos úteis:"
echo "   - Ver status: docker-compose ps"
echo "   - Parar tudo: docker-compose down"
echo "   - Reiniciar: docker-compose restart backend"
echo ""
echo "📚 Documentação completa em:"
echo "   - CONFIGURACAO_COMPLETA.md"
echo "   - DOCKER_QUICKSTART.md"
echo ""
