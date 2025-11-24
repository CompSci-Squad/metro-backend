# Sistema de Monitoramento de Canteiros de Obras - Backend

Backend para sistema automatizado de monitoramento de canteiros de obras, integrando visão computacional, modelagem BIM e aprendizado de máquina.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **PostgreSQL** - Banco de dados SQL
- **AWS S3** - Armazenamento de fotos e arquivos BIM
- **Multer** - Upload de arquivos
- **Multer-S3** - Integração com S3
- **Puppeteer** - Geração de relatórios em PDF
- **LocalStack** - Emulador AWS S3 para desenvolvimento

## 📋 Pré-requisitos

### Desenvolvimento Local
- Node.js 18+
- PostgreSQL 14+
- Conta AWS com bucket S3 configurado (ou LocalStack para desenvolvimento)

### Docker (Recomendado)
- Docker Desktop (Windows/Mac) ou Docker Engine + Docker Compose (Linux)
- Mínimo 4GB RAM disponível

## 🐳 Instalação com Docker (Recomendado)

1. Clone o repositório:
\`\`\`bash
git clone https://github.com/seu-usuario/construction-monitoring.git
cd construction-monitoring
\`\`\`

2. Configure as variáveis de ambiente obrigatórias:
\`\`\`bash
cp .env.example .env
\`\`\`

Edite o arquivo `.env` e configure:
\`\`\`env
NGROK_URL=https://your-ngrok-url.ngrok-free.app
VIRAG_API_KEY=your_virag_api_key_here
\`\`\`

3. Inicie todos os serviços com Docker Compose:
\`\`\`bash
docker-compose up -d
\`\`\`

4. Verifique se está funcionando:
\`\`\`bash
curl http://localhost:3000/health
\`\`\`

**Pronto!** O sistema está rodando com:
- Backend API em http://localhost:3000
- PostgreSQL em localhost:5432
- LocalStack S3 em http://localhost:4566

**Documentação completa do Docker:** [docs/DOCKER_SETUP.md](docs/DOCKER_SETUP.md)

## 🔧 Instalação Manual (Sem Docker)

1. Clone o repositório e instale as dependências:
\`\`\`bash
npm install
\`\`\`

2. Configure as variáveis de ambiente:
\`\`\`bash
cp .env.example .env
\`\`\`

Edite o arquivo `.env` com suas credenciais.

3. Execute o script SQL para criar as tabelas:
\`\`\`bash
# Conecte ao PostgreSQL e execute:
psql -U seu_usuario -d construction_monitoring -f scripts/001_create_tables.sql
\`\`\`

4. Inicie o servidor:
\`\`\`bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm start
\`\`\`

## 📚 Endpoints da API

### Obras

- `POST /api/obras` - Criar nova obra
- `PUT /api/obras/:id` - Editar obra (nome e localização)
- `GET /api/obras` - Listar todas as obras ativas
- `GET /api/obras/:id` - Obter detalhes de uma obra
- `DELETE /api/obras/:id` - Deletar obra
- `PATCH /api/obras/:id/progresso` - Atualizar progresso e status

### Fotos

- `POST /api/fotos/:obraId` - Upload de foto (multipart/form-data)
- `GET /api/fotos/:obraId` - Listar fotos de uma obra
- `DELETE /api/fotos/:id` - Deletar foto

### Relatórios

- `POST /api/relatorios/:obraId` - Criar relatório
- `GET /api/relatorios/:obraId` - Listar relatórios de uma obra
- `GET /api/relatorios/detalhes/:id` - Obter relatório específico
- `DELETE /api/relatorios/:id` - Deletar relatório

### Arquivos BIM

- `POST /api/bim/:obraId` - Upload de arquivo BIM (multipart/form-data)
- `GET /api/bim/:obraId` - Listar arquivos BIM de uma obra
- `DELETE /api/bim/:id` - Deletar arquivo BIM

### Integração com IA

- `POST /api/ia/:obraId/receber` - Receber dados processados pela IA
- `POST /api/ia/:obraId/enviar` - Enviar dados para processamento pela IA

## 📝 Exemplos de Uso

### Criar uma obra:
\`\`\`bash
curl -X POST http://localhost:3000/api/obras \
  -H "Content-Type: application/json" \
  -d '{
    "id": "obra-001",
    "nome_obra": "Edifício Central",
    "responsavel_obra": "João Silva",
    "localizacao": "Rua Principal, 123",
    "data_inicio": "2025-01-15",
    "previsao_termino": "2025-12-31",
    "observacoes": "Projeto residencial de alto padrão"
  }'
\`\`\`

### Upload de foto:
\`\`\`bash
curl -X POST http://localhost:3000/api/fotos/obra-001 \
  -F "foto=@caminho/para/foto.jpg" \
  -F "nome_foto=Fundação Concluída" \
  -F "descricao_foto=Foto da fundação após concretagem" \
  -F "data_foto=2025-02-01"
\`\`\`

### Criar relatório:
\`\`\`bash
curl -X POST http://localhost:3000/api/relatorios/obra-001 \
  -H "Content-Type: application/json" \
  -d '{
    "data_foto": "2025-02-01",
    "conteudo_json": {
      "analise": "Progresso conforme planejado",
      "problemas": [],
      "recomendacoes": ["Continuar monitoramento"]
    }
  }'
\`\`\`

## 🗄️ Estrutura do Banco de Dados

- **obras** - Informações das obras
- **fotos** - Fotos das obras armazenadas no S3
- **relatorios** - Relatórios em formato JSON
- **arquivos_bim** - Arquivos BIM armazenados no S3

## 🔐 Segurança

- Arquivos armazenados no S3 com ACL privada
- Validação de tipos de arquivo
- Limites de tamanho: 10MB para fotos, 100MB para arquivos BIM
- Validação de campos obrigatórios

## 📦 Estrutura do Projeto

\`\`\`
src/
├── config/
│   ├── database.js    # Configuração PostgreSQL
│   └── s3.js          # Configuração AWS S3
├── controllers/
│   ├── obrasController.js
│   ├── fotosController.js
│   ├── relatoriosController.js
│   ├── bimController.js
│   └── iaController.js
├── routes/
│   ├── obras.js
│   ├── fotos.js
│   ├── relatorios.js
│   ├── bim.js
│   └── ia.js
└── server.js          # Arquivo principal
\`\`\`

## 🤝 Integração com IA

Os endpoints de IA estão preparados para receber e enviar dados. Você precisará implementar a lógica específica de comunicação com seu serviço de IA quando estiver pronto.

## 📄 Licença

Projeto acadêmico - Universidade
