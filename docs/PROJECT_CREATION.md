# Criação de Projeto com Arquivo BIM

## Endpoint

**POST** `/api/projects`

## Formato

A criação de projetos agora requer o envio de dados via `multipart/form-data` incluindo obrigatoriamente o arquivo BIM.

## Campos Obrigatórios

**Dados do Projeto:**
- `nome_obra` (text) - Nome do projeto
- `responsavel_obra` (text) - Nome do engenheiro responsável
- `localizacao` (text) - Endereço da obra
- `previsao_termino` (text) - Data no formato DD-MM-YYYY
- `arquivo` (file) - Arquivo BIM (.ifc, .rvt, .nwd, .nwc, .dwg, .dxf)

**Campos Opcionais:**
- `data_inicio` (text) - Data no formato DD-MM-YYYY (padrão: data atual)
- `observacoes` (text) - Informações adicionais

## Exemplo no Postman

1. Método: `POST`
2. URL: `http://localhost:3000/api/projects`
3. Body: `form-data`

| Key | Type | Value |
|-----|------|-------|
| nome_obra | Text | Edifício Comercial Plaza |
| responsavel_obra | Text | Eng. Carlos Silva |
| localizacao | Text | Av. Paulista, 1500 - São Paulo/SP |
| previsao_termino | Text | 31-12-2025 |
| observacoes | Text | Projeto com 15 andares |
| arquivo | File | [selecione arquivo .ifc] |

## Resposta de Sucesso

\`\`\`json
{
  "message": "Obra criada com sucesso com arquivo BIM",
  "obra": {
    "id": 514792,
    "nome_obra": "Edifício Comercial Plaza",
    "responsavel_obra": "Eng. Carlos Silva",
    "localizacao": "Av. Paulista, 1500 - São Paulo/SP",
    "data_inicio": "20-11-2024",
    "previsao_termino": "31-12-2025",
    "progresso": 0,
    "status": "planejamento",
    "observacoes": "Projeto com 15 andares",
    "created_at": "20-11-2024 15:30:00",
    "updated_at": "20-11-2024 15:30:00"
  },
  "arquivoBim": {
    "id": 1,
    "obra_id": 514792,
    "nome_arquivo": "edificio-modelo.ifc",
    "tipo_arquivo": "application/ifc",
    "tamanho_arquivo": 15728640,
    "url_s3": "http://localhost:4566/construction-monitoring-bucket/bim/1234567890-edificio-modelo.ifc",
    "s3_key": "bim/1234567890-edificio-modelo.ifc",
    "created_at": "20-11-2024 15:30:00"
  }
}
\`\`\`

## Como Funciona

1. O sistema valida todos os campos obrigatórios incluindo o arquivo BIM
2. Inicia uma transação PostgreSQL para garantir atomicidade
3. Cria o registro do projeto no banco de dados
4. Faz upload do arquivo BIM para o S3/LocalStack
5. Salva os metadados do BIM vinculados ao projeto
6. Comita a transação (projeto + BIM salvos juntos)
7. Em caso de erro, faz rollback automático (nenhum dado é salvo)

## Vantagens

- Garante que todo projeto tenha um arquivo BIM desde o início
- Transação atômica previne projetos sem BIM ou BIM sem projeto
- Simplifica o fluxo no frontend (uma única requisição)
- Mantém integridade referencial no banco de dados
