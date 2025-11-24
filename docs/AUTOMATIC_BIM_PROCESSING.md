# Processamento Automático de Arquivos BIM

Quando um projeto é criado, o sistema automaticamente envia o arquivo BIM para a API VIRAG-BIM para processamento.

## Fluxo Automático

1. **Usuario cria projeto** com arquivo BIM obrigatório via POST /api/projects
2. **Backend salva projeto** no PostgreSQL com transação
3. **Backend salva arquivo BIM** no S3/LocalStack
4. **Backend baixa arquivo BIM** do S3 em memória
5. **Backend envia para VIRAG-BIM** via POST /bim/upload-ifc com:
   - Arquivo IFC/BIM (buffer)
   - Nome do projeto
   - Localização da obra
   - Descrição/observações
6. **API VIRAG-BIM processa** e retorna:
   - project_id (ID do projeto na IA)
   - total_elements (total de elementos BIM detectados)
   - processing_time (tempo de processamento)
   - s3_key (chave do arquivo processado)
   - message (mensagem de status)
7. **Backend cria relatório automático** "Processamento BIM Inicial" com resultados
8. **Usuario recebe** projeto criado com arquivo BIM vinculado

## Response Esperado

\`\`\`json
{
  "message": "Obra criada com sucesso com arquivo BIM",
  "obra": {
    "id": 123456,
    "nome_obra": "Edifício Central",
    "responsavel_obra": "Eng. João Silva",
    "localizacao": "São Paulo/SP",
    "data_inicio": "20-11-2024",
    "previsao_termino": "31-12-2025",
    "progresso": 0,
    "status": "planejamento"
  },
  "arquivoBim": {
    "id": 1,
    "nome_arquivo": "modelo.ifc",
    "tipo_arquivo": "application/ifc",
    "tamanho_arquivo": 5242880,
    "url_s3": "http://localhost:4566/construction-monitoring-bucket/bim/123456/modelo.ifc"
  }
}
\`\`\`

## Consultar Resultados da IA

Após a criação, consulte o relatório automático gerado:

\`\`\`
GET /api/reports/123456
\`\`\`

Response:
\`\`\`json
{
  "relatorios": [
    {
      "id": 1,
      "titulo": "Processamento BIM Inicial",
      "created_at": "20-11-2024 14:30:00"
    }
  ]
}
\`\`\`

Detalhes completos do processamento:

\`\`\`
GET /api/reports/details/1
\`\`\`

Response:
\`\`\`json
{
  "id": 1,
  "titulo": "Processamento BIM Inicial",
  "conteudo": {
    "virag_project_id": "BIMXYZ123ABC",
    "total_elements": 834,
    "processing_time": 18.45,
    "s3_key": "bim-projects/BIMXYZ123ABC/model.ifc",
    "message": "IFC processado com sucesso",
    "processed_at": "2024-11-20T14:30:15.123Z"
  },
  "created_at": "20-11-2024 14:30:00"
}
\`\`\`

## Comportamento em Caso de Falha

Se a API VIRAG-BIM falhar ou estiver offline:

- O projeto é criado normalmente
- O arquivo BIM é salvo no S3
- Erro é logado no console do servidor
- Nenhum relatório de processamento é criado
- **A criação do projeto NÃO é interrompida**

Isso garante que o sistema continue funcionando mesmo se a IA estiver indisponível.

## Logs do Servidor

Durante o processamento, você verá logs detalhados:

\`\`\`
[v0] Recebendo requisição para criar obra com arquivo BIM
[v0] Criando obra no banco...
[v0] Obra criada com ID: 123456
[v0] Salvando metadados do arquivo BIM...
[v0] Arquivo BIM vinculado à obra
[v0] Baixando arquivo BIM do S3 para enviar à IA...
[v0] Enviando arquivo BIM para API VIRAG-BIM...
[v0] Arquivo BIM processado com sucesso pela IA
[v0] Resposta VIRAG: { project_id: 'BIMXYZ123ABC', total_elements: 834, ... }
[v0] Relatório de processamento BIM criado
\`\`\`

## Configuração Necessária

Certifique-se de que as variáveis de ambiente estão configuradas:

\`\`\`env
VIRAG_API_URL=https://api-virag-bim.com
VIRAG_API_KEY=sua_chave_api_aqui
\`\`\`

Se não configurado, o processamento automático será ignorado silenciosamente.
