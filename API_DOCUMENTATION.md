# Documentação Completa da API

## Base URL
\`\`\`
http://localhost:3000/api
\`\`\`

## 1. Obras (Projects)

### 1.1 Criar Obra COM PROCESSAMENTO AUTOMÁTICO DE BIM
**Endpoint:** `POST /projects`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `nome_obra`: string (obrigatório) - Nome do projeto/obra
- `responsavel_obra`: string (obrigatório) - Nome do responsável técnico
- `localizacao`: string (obrigatório) - Endereço da obra
- `previsao_termino`: string (obrigatório) - Data prevista (DD-MM-YYYY)
- `observacoes`: string (opcional) - Observações adicionais
- `data_inicio`: string (opcional) - Data de início (DD-MM-YYYY, usa data atual se omitido)
- `arquivo`: File (obrigatório) - Arquivo BIM (.ifc, .rvt, .nwd, .nwc, .dwg, .dxf) - máx 100MB

**Processamento Automático:**
Ao criar o projeto, o sistema automaticamente:
1. Salva projeto e arquivo BIM no banco/S3 (transação atômica)
2. Baixa arquivo BIM do S3
3. Envia para API VIRAG-BIM (POST /bim/upload-ifc)
4. Cria relatório automático "Processamento BIM Inicial" com resultados da IA

**Resposta (201):**
\`\`\`json
{
  "message": "Obra criada com sucesso com arquivo BIM",
  "obra": {
    "id": 123456,
    "nome_obra": "Edifício Comercial Central Plaza",
    "responsavel_obra": "Eng. João Silva",
    "localizacao": "Av. Paulista, 1500 - São Paulo/SP",
    "data_inicio": "20-11-2024",
    "previsao_termino": "31-12-2025",
    "progresso": 0,
    "status": "planejamento",
    "observacoes": "Projeto com 15 andares"
  },
  "arquivoBim": {
    "id": 1,
    "nome_arquivo": "modelo.ifc",
    "tipo_arquivo": "application/ifc",
    "tamanho_arquivo": 5242880,
    "url_s3": "http://localhost:4566/construction-monitoring-bucket/bim/123456/modelo.ifc",
    "s3_key": "bim/123456/modelo.ifc"
  }
}
\`\`\`

**Consultar Resultados do Processamento:**
\`\`\`
GET /api/reports/{projectId} - Lista todos os relatórios
GET /api/reports/details/{relatorioId} - Detalhes completos com dados da IA
\`\`\`

**Nota:** Se a API VIRAG-BIM falhar, o projeto é criado normalmente mas sem relatório de processamento.

### 1.2 Editar Obra
**Endpoint:** `PUT /projects/:id`

**Body:**
\`\`\`json
{
  "nome_obra": "string (opcional)",
  "localizacao": "string (opcional)"
}
\`\`\`

... existing code ...

### 1.3 Listar Obras Ativas
**Endpoint:** `GET /projects`

... existing code ...

### 1.4 Obter Detalhes da Obra
**Endpoint:** `GET /projects/:id`

... existing code ...

### 1.5 Deletar Obra
**Endpoint:** `DELETE /projects/:id`

### 1.6 Atualizar Progresso
**Endpoint:** `PATCH /projects/:id/progress`

**Body:**
\`\`\`json
{
  "progresso": 75.5,
  "status": "em_andamento" // ou "planejamento", "concluido", "pausado"
}
\`\`\`

## 2. Fotos

### 2.1 Upload de Foto
**Endpoint:** `POST /photos/:projectId`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `foto`: arquivo de imagem (obrigatório)
- `nome_foto`: string (obrigatório)
- `descricao_foto`: string (opcional)
- `data_foto`: DD-MM-YYYY (opcional, usa data atual se omitido)

... existing code ...

### 2.2 Listar Fotos
**Endpoint:** `GET /photos/:projectId`

### 2.3 Deletar Foto
**Endpoint:** `DELETE /photos/:id`

## 3. Relatórios

### 3.1 Criar Relatório
**Endpoint:** `POST /reports/:projectId`

**Body:**
\`\`\`json
{
  "titulo": "string (obrigatório)",
  "conteudo": {
    "qualquer_estrutura": "JSON livre"
  }
}
\`\`\`

... existing code ...

### 3.2 Listar Relatórios
**Endpoint:** `GET /reports/:projectId`

### 3.3 Obter Relatório Específico
**Endpoint:** `GET /reports/details/:id`

### 3.4 Deletar Relatório
**Endpoint:** `DELETE /reports/:id`

## 4. Arquivos BIM

### 4.1 Upload de Arquivo BIM (Substitui Existente)
**Endpoint:** `POST /bim/:projectId`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `arquivo`: arquivo BIM (.ifc, .rvt, .nwd, .nwc, .dwg, .dxf) - máx 100MB

**Nota:** Deleta o arquivo BIM anterior antes de salvar o novo (um projeto = um BIM)

... existing code ...

### 4.2 Obter Metadados do BIM
**Endpoint:** `GET /bim/:projectId`

### 4.3 Gerar URL de Download
**Endpoint:** `GET /bim/download/:projectId`

**Resposta (200):**
\`\`\`json
{
  "downloadUrl": "http://localhost:4566/construction-monitoring-bucket/bim/123456/modelo.ifc?...",
  "expiresIn": "3600 segundos"
}
\`\`\`

### 4.4 Deletar Arquivo BIM
**Endpoint:** `DELETE /bim/:projectId`

## 5. Integração com IA VIRAG-BIM

### 5.1 Analisar Imagem Individual
**Endpoint:** `POST /ai/:projectId/analyze-image`

**Body:**
\`\`\`json
{
  "imageUrl": "http://localhost:4566/.../foto.jpg",
  "analysisType": "progress" // ou "quality", "safety"
}
\`\`\`

### 5.2 Analisar Múltiplas Imagens
**Endpoint:** `POST /ai/:projectId/analyze-batch`

**Body:**
\`\`\`json
{
  "imageUrls": ["url1", "url2", "url3"],
  "analysisType": "quality"
}
\`\`\`

### 5.3 Buscar Imagens Similares
**Endpoint:** `POST /ai/:projectId/search-similar`

**Body:**
\`\`\`json
{
  "referenceImageUrl": "http://localhost:4566/.../referencia.jpg",
  "threshold": 0.8
}
\`\`\`

### 5.4 Comparar com BIM
**Endpoint:** `POST /ai/:projectId/compare-bim`

**Body:**
\`\`\`json
{
  "imageUrl": "http://localhost:4566/.../foto-atual.jpg",
  "bimFileUrl": "http://localhost:4566/.../modelo.ifc"
}
\`\`\`

### 5.5 Verificar Status da API
**Endpoint:** `GET /ai/health`

**Resposta (200):**
\`\`\`json
{
  "status": "online",
  "apiStatus": "healthy",
  "timestamp": "20-11-2024 15:30:00"
}
\`\`\`

### 5.6 Receber Dados da IA (Legado)
**Endpoint:** `POST /ai/:projectId/receive`

... existing code ...

### 5.7 Enviar Dados para IA (Legado)
**Endpoint:** `POST /ai/:projectId/send`

... existing code ...

## Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `404` - Recurso não encontrado
- `409` - Conflito (ex: ID duplicado)
- `500` - Erro interno do servidor

## Notas Importantes

1. Todos os endpoints retornam JSON
2. **Formato de datas:** DD-MM-YYYY (entrada e saída)
3. **IDs de projeto:** Inteiros aleatórios de 6 dígitos gerados automaticamente
4. Arquivos são armazenados no LocalStack S3 (dev) ou AWS S3 (prod)
5. Limites de upload: 10MB para fotos, 100MB para arquivos BIM
6. O campo `progresso` aceita valores de 0 a 100
7. O campo `status` aceita: "planejamento", "em_andamento", "concluido", "pausado"
8. **Processamento automático:** Arquivo BIM é enviado para VIRAG-BIM na criação do projeto
9. **Transações:** Criação de projeto usa transação PostgreSQL (rollback se BIM falhar)
10. **CASCADE DELETE:** Deletar projeto remove automaticamente fotos, relatórios e BIM vinculados

## Variáveis de Ambiente Necessárias

\`\`\`env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/construction_monitoring

# AWS S3 / LocalStack
AWS_REGION=us-east-1
AWS_BUCKET_NAME=construction-monitoring-bucket
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT=http://localhost:4566

# VIRAG-BIM API
VIRAG_API_URL=https://api-virag-bim.com
VIRAG_API_KEY=sua_chave_api_aqui
