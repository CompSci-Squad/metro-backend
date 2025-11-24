# Análise Automática de Fotos

## Visão Geral

Toda foto enviada para um projeto é automaticamente enviada para análise pela API VIRAG-BIM. A análise é executada em background (não bloqueante) para não atrasar a resposta do upload.

## Fluxo de Análise Automática

1. **Upload da Foto**
   - Usuário envia foto via POST `/api/photos/:obraId`
   - Backend salva foto no S3 e metadados no PostgreSQL
   - Resposta imediata é retornada ao usuário

2. **Processamento em Background**
   - Backend baixa imagem do S3
   - Envia para API VIRAG-BIM (POST `/bim/analyze`)
   - Campos enviados:
     - `file`: Buffer da imagem
     - `project_id`: ID do projeto
     - `image_description`: Nome da foto
     - `context`: Descrição da foto (se fornecida)

3. **Resultado da Análise**
   - API VIRAG retorna:
     - `analysis_id`: ID único da análise
     - `status`: Status do processamento
     - `result`: Objeto com elementos detectados, progresso, alertas, comparações
   - Backend cria relatório automático com os resultados

4. **Relatório Automático**
   - Título: "Análise Automática - [nome da foto]"
   - Conteúdo JSONB contém:
     - `tipo`: "analise_foto_automatica"
     - `foto_id`: ID da foto analisada
     - `analysis_id`: ID retornado pela VIRAG
     - `status`: completed/processing/failed
     - `resultado`: Dados completos da análise
     - `timestamp`: Data/hora da análise

## Estrutura do Resultado da Análise

\`\`\`json
{
  "analysis_id": "01NVY2456DEF",
  "status": "completed",
  "result": {
    "detected_elements": [
      {
        "element_id": "2029-$t4X7Z8M0mJFQ1ON",
        "element_type": "IfcColumn",
        "confidence": 0.89,
        "status": "completed",
        "description": "Pilar de concreto detectado com alta confiança"
      }
    ],
    "overall_progress": 67.5,
    "summary": "Resumo textual da análise...",
    "alerts": [
      {
        "firewall": "Parede Norte não identificada no imagem"
      }
    ],
    "comparison": {
      "previous_analysis_id": "01NVXZ8P0M3C",
      "previous_timestamp": "2024-11-05T14:30:00Z",
      "progress_change": 12.5,
      "elements_added": [],
      "elements_removed": []
    },
    "summary": "Progresso de 12.5% desde a última análise.",
    "analyzed_at": "2024-11-07T20:00:00Z",
    "processing_time": 12.34
  }
}
\`\`\`

## Consultar Resultados

Para ver os resultados da análise automática:

**GET** `/api/reports/:obraId`
- Lista todos os relatórios do projeto
- Relatórios automáticos têm título começando com "Análise Automática"

**GET** `/api/reports/details/:id`
- Obtém detalhes completos do relatório
- Campo `conteudo` contém o JSON completo da análise

## Tratamento de Erros

Se a análise falhar:
- Upload da foto é bem-sucedido normalmente
- Erro é logado no console do servidor
- Nenhum relatório é criado
- Foto permanece disponível para re-análise manual

## Configuração

Variáveis de ambiente necessárias:

\`\`\`env
VIRAG_API_URL=https://api-virag-bim.com
VIRAG_API_KEY=sua_chave_api_aqui
\`\`\`

## Notas Técnicas

- Análise executa via `setImmediate()` para não bloquear a resposta HTTP
- Imagem é baixada do S3 e enviada como buffer para a API
- Relatórios são salvos em formato JSONB no PostgreSQL
- Processo é tolerante a falhas - erros na análise não afetam o upload
