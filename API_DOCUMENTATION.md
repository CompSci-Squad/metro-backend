# Documentação Completa da API

## Base URL
\`\`\`
http://localhost:3000/api
\`\`\`

## 1. Obras

### 1.1 Criar Obra
**Endpoint:** `POST /obras`

**Body:**
\`\`\`json
{
  "id": "string (obrigatório)",
  "nome_obra": "string (obrigatório)",
  "responsavel_obra": "string (obrigatório)",
  "localizacao": "string (obrigatório)",
  "data_inicio": "YYYY-MM-DD (obrigatório)",
  "previsao_termino": "YYYY-MM-DD (obrigatório)",
  "observacoes": "string (opcional)"
}
\`\`\`

**Resposta (201):**
\`\`\`json
{
  "message": "Obra criada com sucesso",
  "obra": {
    "id": "obra-001",
    "nome_obra": "Edifício Central",
    "responsavel_obra": "João Silva",
    "localizacao": "Rua Principal, 123",
    "data_inicio": "2025-01-15",
    "previsao_termino": "2025-12-31",
    "observacoes": "Projeto residencial",
    "status": "em andamento",
    "progresso": 0.00,
    "created_at": "2025-01-10T10:00:00.000Z",
    "updated_at": "2025-01-10T10:00:00.000Z"
  }
}
\`\`\`

### 1.2 Editar Obra
**Endpoint:** `PUT /obras/:id`

**Body:**
\`\`\`json
{
  "nome_obra": "string (opcional)",
  "localizacao": "string (opcional)"
}
\`\`\`

### 1.3 Listar Obras Ativas
**Endpoint:** `GET /obras`

**Resposta (200):**
\`\`\`json
{
  "obras": [
    {
      "nome_projeto": "Edifício Central",
      "progresso": 45.50,
      "status": "em andamento",
      "nome_engenheiro_responsavel": "João Silva"
    }
  ]
}
\`\`\`

### 1.4 Obter Detalhes da Obra
**Endpoint:** `GET /obras/:id`

**Resposta (200):**
\`\`\`json
{
  "obra": { /* dados da obra */ },
  "fotos": [ /* array de fotos */ ],
  "relatorios": [ /* array de relatórios */ ],
  "arquivos_bim": [ /* array de arquivos BIM */ ]
}
\`\`\`

### 1.5 Deletar Obra
**Endpoint:** `DELETE /obras/:id`

### 1.6 Atualizar Progresso
**Endpoint:** `PATCH /obras/:id/progresso`

**Body:**
\`\`\`json
{
  "progresso": 75.5,
  "status": "em andamento" // ou "finalizado"
}
\`\`\`

## 2. Fotos

### 2.1 Upload de Foto
**Endpoint:** `POST /fotos/:obraId`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `foto`: arquivo de imagem (obrigatório)
- `nome_foto`: string (obrigatório)
- `descricao_foto`: string (opcional)
- `data_foto`: YYYY-MM-DD (obrigatório)

**Resposta (201):**
\`\`\`json
{
  "message": "Foto enviada com sucesso",
  "foto": {
    "id": 1,
    "obra_id": "obra-001",
    "nome_foto": "Fundação Concluída",
    "descricao_foto": "Foto da fundação",
    "data_foto": "2025-02-01",
    "url_s3": "https://bucket.s3.amazonaws.com/fotos/obra-001/123456-foto.jpg",
    "created_at": "2025-02-01T10:00:00.000Z"
  }
}
\`\`\`

### 2.2 Listar Fotos
**Endpoint:** `GET /fotos/:obraId`

### 2.3 Deletar Foto
**Endpoint:** `DELETE /fotos/:id`

## 3. Relatórios

### 3.1 Criar Relatório
**Endpoint:** `POST /relatorios/:obraId`

**Body:**
\`\`\`json
{
  "data_foto": "2025-02-01",
  "conteudo_json": {
    "analise": "Progresso conforme planejado",
    "problemas": [],
    "recomendacoes": ["Continuar monitoramento"],
    "metricas": {
      "progresso_estimado": 45.5,
      "areas_concluidas": ["fundação", "estrutura"]
    }
  }
}
\`\`\`

**Resposta (201):**
\`\`\`json
{
  "message": "Relatório criado com sucesso",
  "relatorio": {
    "id": 1,
    "obra_id": "obra-001",
    "nome_relatorio": "Relatório-Edifício Central-2025-02-01",
    "conteudo_json": { /* objeto JSON */ },
    "created_at": "2025-02-01T10:00:00.000Z"
  }
}
\`\`\`

### 3.2 Listar Relatórios
**Endpoint:** `GET /relatorios/:obraId`

### 3.3 Obter Relatório Específico
**Endpoint:** `GET /relatorios/detalhes/:id`

### 3.4 Deletar Relatório
**Endpoint:** `DELETE /relatorios/:id`

## 4. Arquivos BIM

### 4.1 Upload de Arquivo BIM
**Endpoint:** `POST /bim/:obraId`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `arquivo`: arquivo BIM (.ifc, .rvt, .nwd, .nwc, .dwg, .dxf)

**Resposta (201):**
\`\`\`json
{
  "message": "Arquivo BIM enviado com sucesso",
  "arquivo": {
    "id": 1,
    "obra_id": "obra-001",
    "nome_arquivo": "projeto.ifc",
    "tipo_arquivo": "application/octet-stream",
    "tamanho_arquivo": 5242880,
    "url_s3": "https://bucket.s3.amazonaws.com/bim/obra-001/123456-projeto.ifc",
    "created_at": "2025-02-01T10:00:00.000Z"
  }
}
\`\`\`

### 4.2 Listar Arquivos BIM
**Endpoint:** `GET /bim/:obraId`

### 4.3 Deletar Arquivo BIM
**Endpoint:** `DELETE /bim/:id`

## 5. Integração com IA

### 5.1 Receber Dados da IA
**Endpoint:** `POST /ia/:obraId/receber`

**Body:** (estrutura flexível, depende da implementação da IA)
\`\`\`json
{
  "progresso": 45.5,
  "analise": { /* dados da análise */ },
  "alertas": [ /* array de alertas */ ]
}
\`\`\`

### 5.2 Enviar Dados para IA
**Endpoint:** `POST /ia/:obraId/enviar`

**Body:**
\`\`\`json
{
  "fotoId": 1,
  "tipo_analise": "completa" // ou "rapida", "detalhada", etc.
}
\`\`\`

**Resposta (200):**
\`\`\`json
{
  "message": "Dados preparados para envio à IA",
  "dados": {
    "obra": { /* dados da obra */ },
    "foto": { /* dados da foto */ },
    "arquivo_bim": { /* dados do BIM */ },
    "tipo_analise": "completa"
  }
}
\`\`\`

## Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `404` - Recurso não encontrado
- `409` - Conflito (ex: ID duplicado)
- `500` - Erro interno do servidor

## Notas Importantes

1. Todos os endpoints retornam JSON
2. Datas devem estar no formato ISO (YYYY-MM-DD)
3. Arquivos são armazenados no S3 com ACL privada
4. Limites de upload: 10MB para fotos, 100MB para arquivos BIM
5. O campo `progresso` aceita valores de 0.00 a 100.00
6. O campo `status` aceita: "em andamento" ou "finalizado"
