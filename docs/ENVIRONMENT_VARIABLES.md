# Variáveis de Ambiente

Este documento descreve todas as variáveis de ambiente necessárias para o sistema.

## Configuração Obrigatória

### Database Configuration

\`\`\`env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=construction_monitoring
DB_USER=postgres
DB_PASSWORD=your_password
\`\`\`

### AWS S3 Configuration

Para desenvolvimento local com LocalStack:
\`\`\`env
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=us-east-1
S3_BUCKET_NAME=construction-monitoring-bucket
\`\`\`

Para produção (AWS real):
\`\`\`env
AWS_ACCESS_KEY_ID=your_real_access_key
AWS_SECRET_ACCESS_KEY=your_real_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=construction-monitoring-bucket
\`\`\`

### VIRAG-BIM API Configuration

**Obrigatório para integração com IA:**

\`\`\`env
VIRAG_API_URL=https://api-virag-bim.com
VIRAG_API_KEY=your_virag_api_key_here
\`\`\`

Sem estas variáveis configuradas, o sistema funcionará normalmente mas não enviará arquivos BIM e fotos para processamento pela IA.

### Server Configuration

\`\`\`env
PORT=3000
\`\`\`

## Como Configurar

1. Copie o arquivo `.env.example` para `.env`:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

2. Edite o arquivo `.env` e preencha os valores corretos

3. **NUNCA** commite o arquivo `.env` no Git (já está no .gitignore)

4. Reinicie o servidor após alterar variáveis de ambiente:
   \`\`\`bash
   npm run dev
   \`\`\`

## Validação

O sistema valida automaticamente as variáveis VIRAG ao iniciar e exibe avisos no console se estiverem faltando.
