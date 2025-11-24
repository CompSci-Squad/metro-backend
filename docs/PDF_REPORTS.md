# Sistema de Relatórios em PDF

## Visão Geral

O sistema gera automaticamente relatórios em PDF baseados nas análises da IA VIRAG-BIM. Cada foto enviada gera uma análise e um relatório correspondente.

## Fluxo Completo

### 1. Upload de Foto
Quando uma foto é enviada via `POST /api/photos/:obraId`:
1. Foto é salva no S3 (LocalStack)
2. Foto é enviada para análise na API VIRAG-BIM
3. API retorna `analysis_id` único
4. Sistema cria registro na tabela `relatorios` com o `analysis_id`
5. PDF **NÃO** é gerado neste momento (lazy generation)

### 2. Listagem de Relatórios
**GET /api/reports**
- Lista todos os relatórios disponíveis
- Retorna: analysis_id, nome do relatório, data, progresso, projeto

### 3. Geração do PDF (Lazy Loading)
**GET /api/reports/analysis/:analysisId**
- Verifica se PDF já existe no S3
  - **Se existe**: retorna URL de download imediatamente
  - **Se não existe**: gera o PDF

#### Processo de Geração:
1. Busca análise completa da API VIRAG-BIM: `GET /bim/analysis/:analysisId`
2. Monta modelo intermediário do relatório com:
   - Resumo da análise
   - Progresso global
   - Elementos detectados (dinâmico)
   - Comparação com análise anterior (se houver)
   - Insights automáticos
3. Gera HTML formatado com CSS
4. Converte HTML para PDF usando Puppeteer
5. Faz upload do PDF para S3: `reports/{analysisId}.pdf`
6. Retorna URL de download (válida por 1 hora)

## Estrutura da Tabela `relatorios`

\`\`\`sql
- id (SERIAL)
- obra_id (INTEGER) - FK para obras
- analysis_id (VARCHAR) - ID único da análise (UNIQUE)
- nome_relatorio (VARCHAR) - "Relatório de Progresso - DD/MM/YYYY"
- conteudo_json (JSONB) - Modelo intermediário do relatório
- pdf_s3_key (TEXT) - Chave S3 do PDF gerado
- analyzed_at (TIMESTAMP) - Data/hora da análise
- overall_progress (DECIMAL) - Progresso no momento da análise
- sequence_number (INTEGER) - Número sequencial da foto
- created_at (TIMESTAMP)
\`\`\`

## Modelo Intermediário de Relatório

\`\`\`json
{
  "projectId": "479065",
  "analysisId": "01KAT5ZEQE23QY6T97FVGJTJ93",
  "sequenceNumber": 1,
  "analyzedAt": "2025-11-24T05:39:33.854863+00:00",
  "imageDescription": "Foto Inicial Construção",
  "overview": {
    "title": "Relatório de Progresso - Análise #1",
    "summary": "Resumo da análise da IA..."
  },
  "progress": {
    "overallProgress": 0.4,
    "overallProgressPercent": "40.00",
    "comparison": {
      "hasPrevious": false
    }
  },
  "elements": {
    "detected": [
      {
        "elementType": "Column",
        "label": "Colunas metálicas",
        "countVisible": 20,
        "status": "completed",
        "confidence": 0.7,
        "confidencePercent": "70.0",
        "confidenceLabel": "Média",
        "description": "Colunas metálicas verticais..."
      }
    ],
    "comparison": {
      "elementsAdded": [],
      "elementsRemoved": [],
      "elementsChanged": []
    }
  },
  "insights": [
    "A obra está em estágio inicial de construção.",
    "Elementos estruturais principais visíveis."
  ]
}
\`\`\`

## Conteúdo do PDF

O PDF gerado contém:

### 1. Cabeçalho
- Nome do projeto
- Localização
- ID da análise
- Número da análise
- Data/hora da análise
- Descrição da imagem

### 2. Resumo Geral
- Descrição textual da análise da IA

### 3. Progresso Global
- Percentual de progresso atual
- Comparação com análise anterior (se houver):
  - Progresso anterior
  - Variação em pontos percentuais
  - Resumo da evolução

### 4. Elementos Estruturais Detectados
Tabela dinâmica com:
- Nome do elemento (label amigável)
- Tipo (element_type)
- Quantidade visível
- Status
- Confiança (% + label: Alta/Média/Baixa)
- Observações

### 5. Evolução de Elementos (se houver comparação)
Tabela com:
- Elemento
- Tipo
- Quantidade anterior
- Quantidade atual
- Variação (+/-)
- Comentário

### 6. Comentários e Insights
Lista de insights gerados automaticamente

## APIs

### Listar Todos os Relatórios
\`\`\`
GET /api/reports

Response:
{
  "total": 5,
  "relatorios": [
    {
      "id": 1,
      "analysisId": "01KAT5ZEQE23QY6T97FVGJTJ93",
      "nomeRelatorio": "Relatório de Progresso - 24/11/2024",
      "analyzedAt": "2024-11-24 05:39:33",
      "overallProgress": "40.00",
      "sequenceNumber": 1,
      "nomeObra": "Edifício Comercial Plaza",
      "localizacao": "Av. Paulista, 1500 - São Paulo/SP",
      "obraId": 479065
    }
  ]
}
\`\`\`

### Obter Relatório Individual
\`\`\`
GET /api/reports/analysis/:analysisId

Response:
{
  "id": 1,
  "analysisId": "01KAT5ZEQE23QY6T97FVGJTJ93",
  "nomeRelatorio": "Relatório de Progresso - 24/11/2024",
  "analyzedAt": "2024-11-24T05:39:33.854863+00:00",
  "overallProgress": "40.00",
  "sequenceNumber": 1,
  "nomeObra": "Edifício Comercial Plaza",
  "localizacao": "Av. Paulista, 1500 - São Paulo/SP",
  "downloadUrl": "https://localhost:4566/...",
  "pdfExists": true
}
\`\`\`

## Configuração

Certifique-se de que as seguintes variáveis estão no `.env`:

\`\`\`env
NGROK_URL=https://seu-ngrok-url.ngrok.io
S3_BUCKET_NAME=construction-monitoring-bucket
AWS_ENDPOINT=http://localhost:4566
\`\`\`

## Executar Script SQL

Execute o script de atualização da tabela:
\`\`\`bash
psql -U postgres -d construction_monitoring -f scripts/002_update_relatorios_table.sql
\`\`\`

## Instalar Puppeteer

\`\`\`bash
npm install
\`\`\`

Puppeteer faz download automático do Chrome/Chromium necessário.

## Notas Importantes

1. **Lazy Loading**: PDFs são gerados apenas quando solicitados pela primeira vez
2. **Cache**: Uma vez gerado, o PDF é reutilizado em requisições futuras
3. **Elementos Dinâmicos**: Não há hardcode de tipos de elementos (Column, Beam, etc)
4. **Análise 1:1**: Cada relatório corresponde a exatamente uma análise (analysis_id único)
5. **URL Temporária**: URL de download é válida por 1 hora
