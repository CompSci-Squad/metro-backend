import axios from "axios"

// Buscar análise da API VIRAG-BIM
export async function fetchAnalysisFromVirag(analysisId) {
  const ngrokUrl = process.env.NGROK_URL

  if (!ngrokUrl) {
    throw new Error("NGROK_URL não configurado no .env")
  }

  const apiUrl = `${ngrokUrl}/bim/analysis/${analysisId}`
  console.log(`[v0] Buscando análise da IA: ${apiUrl}`)

  try {
    const response = await axios.get(apiUrl, {
      timeout: 10000, // 10 segundos de timeout
    })

    console.log(`[v0] Análise recebida com sucesso para ID ${analysisId}`)
    return response.data
  } catch (error) {
    if (error.response) {
      console.error(`[v0] Erro ao buscar análise ${analysisId}:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: apiUrl,
      })
      throw new Error(`API retornou erro ${error.response.status}: ${JSON.stringify(error.response.data)}`)
    } else if (error.request) {
      console.error(`[v0] Sem resposta da API para análise ${analysisId}:`, error.message)
      throw new Error("API VIRAG-BIM não respondeu. Verifique se o ngrok está ativo.")
    } else {
      console.error(`[v0] Erro ao configurar requisição:`, error.message)
      throw new Error(`Erro na requisição: ${error.message}`)
    }
  }
}

// Gerar label amigável baseado no element_type
function generateElementLabel(elementType) {
  const labelMap = {
    Column: "Colunas metálicas",
    Beam: "Vigas metálicas",
    Roof: "Cobertura metálica",
    Wall: "Paredes",
    Door: "Portas",
    Window: "Janelas",
    Floor: "Pisos",
    Slab: "Lajes",
    Stair: "Escadas",
    Railing: "Guarda-corpos",
    CurtainWall: "Fachada cortina",
  }

  return labelMap[elementType] || elementType
}

// Calcular label de confiança
function getConfidenceLabel(confidence) {
  if (confidence < 0.6) return "Baixa"
  if (confidence < 0.8) return "Média"
  return "Alta"
}

// Montar modelo intermediário de relatório
export function buildReportModel(analysis) {
  const hasComparison = analysis.comparison && analysis.comparison.attribute_values
  const comparisonData = hasComparison ? analysis.comparison.attribute_values : null

  // Mapear elementos detectados
  const detectedElements = (analysis.detected_elements || []).map((elem) => ({
    elementType: elem.element_type,
    label: generateElementLabel(elem.element_type),
    countVisible: elem.count_visible,
    status: elem.status,
    confidence: elem.confidence,
    confidencePercent: (elem.confidence * 100).toFixed(1),
    confidenceLabel: getConfidenceLabel(elem.confidence),
    description: elem.description,
  }))

  // Montar comparação de progresso
  let progressComparison = null
  if (comparisonData) {
    progressComparison = {
      hasPrevious: true,
      previousAnalysisId: analysis.previous_analysis_id,
      previousTimestamp: comparisonData.previous_timestamp,
      progressChange: comparisonData.progress_change || 0,
      progressChangePercent: ((comparisonData.progress_change || 0)).toFixed(2),
      progressSummary: comparisonData.summary,
    }
  }

  // Montar comparação de elementos
  const elementsAdded =
    comparisonData && comparisonData.elements_added
      ? comparisonData.elements_added.map((elem) => ({
          elementType: elem.element_type,
          label: generateElementLabel(elem.element_type),
          changeType: elem.change_type,
          countPrevious: elem.count_previous,
          countCurrent: elem.count_current,
          countChange: elem.count_change,
          description: elem.description,
        }))
      : []

  // Gerar insights baseados nos dados
  const insights = []
  if (analysis.overall_progress < 30) {
    insights.push("A obra está em estágio inicial de construção.")
  } else if (analysis.overall_progress < 70) {
    insights.push("A obra está em andamento, com progresso intermediário.")
  } else {
    insights.push("A obra está em estágio avançado de execução.")
  }

  if (analysis.alerts && analysis.alerts.length > 0) {
    insights.push(`${analysis.alerts.length} alerta(s) identificado(s) que requerem atenção.`)
  }

  if (comparisonData && comparisonData.progress_change > 0) {
    insights.push(
      `Houve evolução positiva de ${(comparisonData.progress_change).toFixed(2)}% em relação à análise anterior.`,
    )
  }

  return {
    projectId: analysis.project_id,
    analysisId: analysis.analysis_id,
    sequenceNumber: analysis.sequence_number,
    analyzedAt: analysis.analyzed_at,
    imageDescription: analysis.image_description || "Sem descrição",
    overview: {
      title: `Relatório de Progresso - Análise #${analysis.sequence_number}`,
      summary: analysis.summary,
    },
    progress: {
      overallProgress: analysis.overall_progress,
      overallProgressPercent: (analysis.overall_progress).toFixed(2),
      comparison: progressComparison,
    },
    elements: {
      detected: detectedElements,
      comparison: {
        elementsAdded,
        elementsRemoved: comparisonData?.elements_removed || [],
        elementsChanged: comparisonData?.elements_changed || [],
      },
    },
    insights,
  }
}

// Gerar HTML do relatório
export function generateReportHtml(reportModel, projectData) {
  const {
    projectId,
    analysisId,
    sequenceNumber,
    analyzedAt,
    imageDescription,
    overview,
    progress,
    elements,
    insights,
  } = reportModel

  const analyzedDate = new Date(analyzedAt).toLocaleString("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${overview.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-top: 20px;
      font-size: 14px;
    }
    .info-item {
      background: rgba(255,255,255,0.1);
      padding: 10px;
      border-radius: 5px;
    }
    .info-label {
      font-weight: bold;
      display: block;
      margin-bottom: 5px;
    }
    .section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      border-left: 4px solid #667eea;
    }
    .section h2 {
      color: #667eea;
      font-size: 22px;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e9ecef;
    }
    .progress-box {
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 15px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .progress-value {
      font-size: 48px;
      font-weight: bold;
      color: #667eea;
    }
    .progress-label {
      color: #6c757d;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    th {
      background: #667eea;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e9ecef;
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:hover {
      background: #f8f9fa;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-success { background: #d4edda; color: #155724; }
    .badge-warning { background: #fff3cd; color: #856404; }
    .badge-danger { background: #f8d7da; color: #721c24; }
    .badge-info { background: #d1ecf1; color: #0c5460; }
    .insights-list {
      list-style: none;
      padding: 0;
    }
    .insights-list li {
      background: white;
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 8px;
      border-left: 3px solid #667eea;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 15px 0;
    }
    .comparison-card {
      background: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .comparison-card .value {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
    }
    .comparison-card .label {
      color: #6c757d;
      font-size: 12px;
      margin-top: 5px;
    }
    .footer {
      text-align: center;
      color: #6c757d;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e9ecef;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${overview.title}</h1>
    <div class="header-info">
      <div class="info-item">
        <span class="info-label">Projeto:</span>
        ${projectData.nome_obra}
      </div>
      <div class="info-item">
        <span class="info-label">Localização:</span>
        ${projectData.localizacao}
      </div>
      <div class="info-item">
        <span class="info-label">ID da Análise:</span>
        ${analysisId}
      </div>
      <div class="info-item">
        <span class="info-label">Análise Nº:</span>
        ${sequenceNumber}
      </div>
      <div class="info-item">
        <span class="info-label">Data da Análise:</span>
        ${analyzedDate}
      </div>
      <div class="info-item">
        <span class="info-label">Descrição da Imagem:</span>
        ${imageDescription}
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Resumo Geral da Análise</h2>
    <p>${overview.summary}</p>
  </div>

  <div class="section">
    <h2>Progresso Global</h2>
    <div class="progress-box">
      <div class="progress-value">${progress.overallProgressPercent}%</div>
      <div class="progress-label">Progresso Geral da Obra</div>
    </div>
    
    ${
      progress.comparison
        ? `
      <div class="comparison-grid">
        <div class="comparison-card">
          <div class="value">${progress.comparison.progressChangePercent}%</div>
          <div class="label">Variação desde análise anterior</div>
        </div>
        <div class="comparison-card">
          <div class="value">#${sequenceNumber - 1}</div>
          <div class="label">Análise anterior</div>
        </div>
        <div class="comparison-card">
          <div class="value">${new Date(progress.comparison.previousTimestamp).toLocaleDateString("pt-BR")}</div>
          <div class="label">Data anterior</div>
        </div>
      </div>
      <p style="background: white; padding: 15px; border-radius: 8px; margin-top: 15px;">
        <strong>Resumo da evolução:</strong> ${progress.comparison.progressSummary}
      </p>
    `
        : '<p style="color: #6c757d;">Esta é a primeira análise do projeto.</p>'
    }
  </div>

  <div class="section">
    <h2>Elementos Estruturais Detectados</h2>
    <table>
      <thead>
        <tr>
          <th>Elemento</th>
          <th>Tipo</th>
          <th>Quantidade Visível</th>
          <th>Status</th>
          <th>Confiança</th>
          <th>Observações</th>
        </tr>
      </thead>
      <tbody>
        ${elements.detected
          .map(
            (elem) => `
          <tr>
            <td><strong>${elem.label}</strong></td>
            <td><span class="badge badge-info">${elem.elementType}</span></td>
            <td>${elem.countVisible}</td>
            <td><span class="badge ${elem.status === "completed" ? "badge-success" : "badge-warning"}">${elem.status}</span></td>
            <td>
              ${elem.confidencePercent}%
              <span class="badge ${elem.confidenceLabel === "Alta" ? "badge-success" : elem.confidenceLabel === "Média" ? "badge-warning" : "badge-danger"}">
                ${elem.confidenceLabel}
              </span>
            </td>
            <td>${elem.description}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  </div>

  ${
    elements.comparison.elementsAdded.length > 0
      ? `
    <div class="section">
      <h2>Evolução de Elementos</h2>
      <table>
        <thead>
          <tr>
            <th>Elemento</th>
            <th>Tipo</th>
            <th>Qtd. Anterior</th>
            <th>Qtd. Atual</th>
            <th>Variação</th>
            <th>Comentário</th>
          </tr>
        </thead>
        <tbody>
          ${elements.comparison.elementsAdded
            .map(
              (elem) => `
            <tr>
              <td><strong>${elem.label}</strong></td>
              <td><span class="badge badge-info">${elem.elementType}</span></td>
              <td>${elem.countPrevious}</td>
              <td>${elem.countCurrent}</td>
              <td><span class="badge ${elem.countChange > 0 ? "badge-success" : "badge-danger"}">
                ${elem.countChange > 0 ? "+" : ""}${elem.countChange}
              </span></td>
              <td>${elem.description}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `
      : ""
  }

  <div class="section">
    <h2>Comentários e Insights</h2>
    <ul class="insights-list">
      ${insights.map((insight) => `<li>${insight}</li>`).join("")}
    </ul>
  </div>

  <div class="footer">
    <p>Relatório gerado automaticamente pelo Sistema de Monitoramento de Obras</p>
    <p>Análise realizada pela IA VIRAG-BIM</p>
  </div>
</body>
</html>
  `

  return html
}
