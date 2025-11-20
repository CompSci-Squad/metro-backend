# Documentação da API - Sistema de Gerenciamento de Obras

## Índice
1. [Obras](#obras)
   - [Criar Obra](#criar-obra)
   - [Listar Obras](#listar-obras)
   - [Obter Detalhes de uma Obra](#obter-detalhes-de-uma-obra)
   - [Atualizar Obra](#atualizar-obra)
   - [Atualizar Progresso da Obra](#atualizar-progresso-da-obra)

2. [Fotos](#fotos)
   - [Enviar Foto](#enviar-foto)
   - [Listar Fotos](#listar-fotos)

3. [BIM](#bim)
   - [Enviar Arquivo BIM](#enviar-arquivo-bim)
   - [Obter Informações do Arquivo BIM](#obter-informações-do-arquivo-bim)

---

## Obras

### Criar Obra
`POST /api/projects`

**Corpo da Requisição (JSON):**
```json
{
  "nome": "Nome da Obra",
  "endereco": "Endereço da Obra",
  "data_inicio": "2025-01-01",
  "data_prevista_termino": "2025-12-31",
  "orcamento": 1000000.00,
  "descricao": "Descrição detalhada da obra"
}
```

**Resposta de Sucesso (201 Created):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "nome": "Nome da Obra",
  "endereco": "Endereço da Obra",
  "data_inicio": "2025-01-01T00:00:00.000Z",
  "data_prevista_termino": "2025-12-31T00:00:00.000Z",
  "orcamento": 1000000.00,
  "descricao": "Descrição detalhada da obra",
  "status": "ativa",
  "progresso": 0,
  "created_at": "2025-01-01T10:00:00.000Z",
  "updated_at": "2025-01-01T10:00:00.000Z"
}
```

### Listar Obras
`GET /api/projects`

**Parâmetros de Consulta (opcionais):**
- `status` - Filtrar por status (ex: ativa, finalizada, cancelada)
- `page` - Número da página (padrão: 1)
- `limit` - Itens por página (padrão: 10)

**Resposta de Sucesso (200 OK):**
```json
{
  "obras": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "nome": "Nome da Obra",
      "endereco": "Endereço da Obra",
      "data_inicio": "2025-01-01T00:00:00.000Z",
      "data_prevista_termino": "2025-12-31T00:00:00.000Z",
      "orcamento": 1000000.00,
      "status": "ativa",
      "progresso": 0,
      "created_at": "2025-01-01T10:00:00.000Z"
    }
  ],
  "paginacao": {
    "total": 1,
    "pagina": 1,
    "total_paginas": 1,
    "limite": 10
  }
}
```

### Obter Detalhes de uma Obra
`GET /api/projects/:id`

**Parâmetros de Rota:**
- `id` - ID da obra

**Resposta de Sucesso (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "nome": "Nome da Obra",
  "endereco": "Endereço da Obra",
  "data_inicio": "2025-01-01T00:00:00.000Z",
  "data_prevista_termino": "2025-12-31T00:00:00.000Z",
  "orcamento": 1000000.00,
  "descricao": "Descrição detalhada da obra",
  "status": "ativa",
  "progresso": 0,
  "created_at": "2025-01-01T10:00:00.000Z",
  "updated_at": "2025-01-01T10:00:00.000Z"
}
```

### Atualizar Obra
`PUT /api/projects/:id`

**Parâmetros de Rota:**
- `id` - ID da obra a ser atualizada

**Corpo da Requisição (JSON):**
```json
{
  "nome": "Novo Nome da Obra",
  "endereco": "Novo Endereço",
  "data_prevista_termino": "2026-01-31",
  "orcamento": 1200000.00,
  "descricao": "Nova descrição atualizada",
  "status": "em_andamento"
}
```

**Resposta de Sucesso (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "Obra atualizada com sucesso"
}
```

### Atualizar Progresso da Obra
`PATCH /api/projects/:id/progress`

**Parâmetros de Rota:**
- `id` - ID da obra

**Corpo da Requisição (JSON):**
```json
{
  "progresso": 50
}
```

**Resposta de Sucesso (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "progresso": 50,
  "message": "Progresso da obra atualizado com sucesso"
}
```

## Fotos

### Enviar Foto
`POST /api/photos/:obraId`

**Parâmetros de Rota:**
- `obraId` - ID da obra

**Corpo da Requisição (multipart/form-data):**
- `foto` - Arquivo de imagem (obrigatório)
- `descricao` - Descrição da foto (opcional)

**Resposta de Sucesso (201 Created):**
```json
{
  "id": "223e4567-e89b-12d3-a456-426614174001",
  "nome_arquivo": "foto-obra.jpg",
  "tipo_arquivo": "image/jpeg",
  "tamanho_arquivo": 1024,
  "url_s3": "https://bucket.s3.region.amazonaws.com/fotos/223e4567-e89b-12d3-a456-426614174001.jpg",
  "obra_id": "123e4567-e89b-12d3-a456-426614174000",
  "created_at": "2025-01-01T10:00:00.000Z"
}
```

### Listar Fotos
`GET /api/photos/:obraId`

**Parâmetros de Rota:**
- `obraId` - ID da obra

**Resposta de Sucesso (200 OK):**
```json
[
  {
    "id": "223e4567-e89b-12d3-a456-426614174001",
    "nome_arquivo": "foto-obra.jpg",
    "tipo_arquivo": "image/jpeg",
    "tamanho_arquivo": 1024,
    "url_s3": "https://bucket.s3.region.amazonaws.com/fotos/223e4567-e89b-12d3-a456-426614174001.jpg",
    "obra_id": "123e4567-e89b-12d3-a456-426614174000",
    "created_at": "2025-01-01T10:00:00.000Z"
  }
]
```

## BIM

### Enviar Arquivo BIM
`POST /api/bim/:projectId`

**Parâmetros de Rota:**
- `projectId` - ID do projeto/obra

**Corpo da Requisição (multipart/form-data):**
- `arquivo` - Arquivo BIM (obrigatório)

**Resposta de Sucesso (200 OK):**
```json
{
  "message": "Arquivo BIM enviado com sucesso",
  "arquivo": {
    "id": "323e4567-e89b-12d3-a456-426614174002",
    "obra_id": "123e4567-e89b-12d3-a456-426614174000",
    "nome_arquivo": "modelo-bim.rvt",
    "tipo_arquivo": "application/octet-stream",
    "tamanho_arquivo": 5242880,
    "url_s3": "https://bucket.s3.region.amazonaws.com/bim/323e4567-e89b-12d3-a456-426614174002.rvt",
    "created_at": "2025-01-01T10:00:00.000Z",
    "updated_at": "2025-01-01T10:00:00.000Z"
  }
}
```

### Obter Informações do Arquivo BIM
`GET /api/bim/:projectId`

**Parâmetros de Rota:**
- `projectId` - ID do projeto/obra

**Resposta de Sucesso (200 OK):**
```json
{
  "arquivo": {
    "id": "323e4567-e89b-12d3-a456-426614174002",
    "obra_id": "123e4567-e89b-12d3-a456-426614174000",
    "nome_arquivo": "modelo-bim.rvt",
    "tipo_arquivo": "application/octet-stream",
    "tamanho_arquivo": 5242880,
    "url_s3": "https://bucket.s3.region.amazonaws.com/bim/323e4567-e89b-12d3-a456-426614174002.rvt",
    "created_at": "2025-01-01T10:00:00.000Z",
    "updated_at": "2025-01-01T10:00:00.000Z"
  }
}
```

**Resposta quando não há arquivo (404 Not Found):**
```json
{
  "error": "Arquivo BIM não encontrado para este projeto"
}
```

---

### Códigos de Status HTTP
- 200 OK - Requisição bem-sucedida
- 201 Created - Recurso criado com sucesso
- 400 Bad Request - Dados inválidos fornecidos
- 404 Not Found - Recurso não encontrado
- 500 Internal Server Error - Erro interno do servidor

### Autenticação
Todas as rotas (exceto o health check) requerem autenticação via token JWT no cabeçalho da requisição:
```
Authorization: Bearer <seu_token_jwt>
```

### Formato das Datas
Todas as datas são retornadas no formato ISO 8601 (UTC):
```
YYYY-MM-DDTHH:MM:SS.SSSZ
```

### Exemplo de Erro
```json
{
  "error": "Mensagem de erro descritiva"
}
```
