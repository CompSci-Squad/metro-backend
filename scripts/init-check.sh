#!/bin/bash
# Script para verificar se o banco de dados está pronto e as tabelas foram criadas

echo "🔄 Verificando conexão com PostgreSQL..."

# Aguardar PostgreSQL estar pronto
until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q'; do
  echo "⏳ PostgreSQL ainda não está pronto - aguardando..."
  sleep 2
done

echo "✅ PostgreSQL está pronto!"

# Verificar se as tabelas existem
TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('obras', 'fotos', 'relatorios', 'arquivos_bim');")

if [ "$TABLE_COUNT" -eq 4 ]; then
  echo "✅ Todas as tabelas estão criadas!"
else
  echo "⚠️  Apenas $TABLE_COUNT de 4 tabelas encontradas."
  echo "🔄 As tabelas serão criadas automaticamente pelo PostgreSQL init scripts."
fi

echo "🎉 Inicialização completa!"
