import pool from "../config/database.js"
import { formatDatesInObject } from "../utils/dateFormatter.js"
import { fetchAnalysisFromVirag, buildReportModel, generateReportHtml } from "../services/reportService.js"
import { generatePdfBufferFromHtml } from "../services/pdfService.js"
import { s3Client } from "../config/s3.js"
import { PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3"
import { generatePresignedUrl } from "../config/s3.js"

export const criarRelatorio = async (req, res) => {
  try {
    const { obraId } = req.params
    const { data_foto, conteudo_json } = req.body

    if (!data_foto || !conteudo_json) {
      return res.status(400).json({ error: "Data da foto e conteúdo JSON são obrigatórios" })
    }

    // Buscar nome da obra
    const obraQuery = "SELECT nome_obra FROM obras WHERE id = $1"
    const obraResult = await pool.query(obraQuery, [obraId])

    if (obraResult.rows.length === 0) {
      return res.status(404).json({ error: "Obra não encontrada" })
    }

    const nomeObra = obraResult.rows[0].nome_obra
    const nomeRelatorio = `Relatório-${nomeObra}-${data_foto}`

    const query = `
      INSERT INTO relatorios (obra_id, nome_relatorio, conteudo_json)
      VALUES ($1, $2, $3)
      RETURNING *
    `

    const values = [obraId, nomeRelatorio, JSON.stringify(conteudo_json)]
    const result = await pool.query(query, values)

    res.status(201).json({
      message: "Relatório criado com sucesso",
      relatorio: result.rows[0],
    })
  } catch (error) {
    console.error("Erro ao criar relatório:", error)
    res.status(500).json({ error: "Erro ao criar relatório" })
  }
}

export const listarTodosRelatorios = async (req, res) => {
  try {
    const query = `
      SELECT 
        r.id,
        r.analysis_id,
        r.nome_relatorio,
        r.analyzed_at,
        r.overall_progress,
        r.sequence_number,
        r.created_at,
        o.nome_obra,
        o.localizacao,
        o.id as obra_id
      FROM relatorios r
      JOIN obras o ON r.obra_id = o.id
      ORDER BY r.analyzed_at DESC
    `

    const result = await pool.query(query)

    const relatorios = result.rows.map((rel) => ({
      id: rel.id,
      analysisId: rel.analysis_id,
      nomeRelatorio: rel.nome_relatorio,
      analyzedAt: rel.analyzed_at,
      overallProgress: rel.overall_progress ? (rel.overall_progress * 100).toFixed(2) : "0.00",
      sequenceNumber: rel.sequence_number,
      nomeObra: rel.nome_obra,
      localizacao: rel.localizacao,
      obraId: rel.obra_id,
      createdAt: rel.created_at,
    }))

    res.json({
      total: relatorios.length,
      relatorios: relatorios.map((r) => formatDatesInObject(r)),
    })
  } catch (error) {
    console.error("Erro ao listar todos os relatórios:", error)
    res.status(500).json({ error: "Erro ao listar relatórios" })
  }
}

export const obterRelatorioPorAnalysisId = async (req, res) => {
  try {
    const { analysisId } = req.params

    console.log(`[v0] Buscando relatório para analysis_id: ${analysisId}`)

    // Verificar se já existe relatório no banco
    const checkQuery = `
      SELECT 
        r.*,
        o.nome_obra,
        o.localizacao
      FROM relatorios r
      JOIN obras o ON r.obra_id = o.id
      WHERE r.analysis_id = $1
    `
    const checkResult = await pool.query(checkQuery, [analysisId])

    let reportData

    if (checkResult.rows.length > 0) {
      console.log(`[v0] Relatório encontrado no banco de dados`)
      reportData = checkResult.rows[0]
    } else {
      console.log(`[v0] Relatório não encontrado, gerando novo...`)

      // Buscar análise da API VIRAG
      const analysis = await fetchAnalysisFromVirag(analysisId)

      console.log(`[v0] Análise obtida da API VIRAG`)

      // Buscar dados do projeto
      const projectQuery = "SELECT * FROM obras WHERE id = $1"
      const projectResult = await pool.query(projectQuery, [analysis.project_id])

      if (projectResult.rows.length === 0) {
        return res.status(404).json({ error: "Projeto não encontrado" })
      }

      const projectData = projectResult.rows[0]

      // Montar modelo de relatório
      const reportModel = buildReportModel(analysis)

      // Gerar nome do relatório
      const analyzedDate = new Date(analysis.analyzed_at)
      const formattedDate = analyzedDate.toLocaleDateString("pt-BR").replace(/\//g, "/")
      const nomeRelatorio = `Relatório de Progresso - ${formattedDate}`

      // Salvar relatório no banco
      const insertQuery = `
        INSERT INTO relatorios (
          obra_id,
          analysis_id,
          nome_relatorio,
          conteudo_json,
          analyzed_at,
          overall_progress,
          sequence_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `

      const insertValues = [
        analysis.project_id,
        analysisId,
        nomeRelatorio,
        JSON.stringify(reportModel),
        analysis.analyzed_at,
        analysis.overall_progress,
        analysis.sequence_number,
      ]

      const insertResult = await pool.query(insertQuery, insertValues)
      reportData = insertResult.rows[0]
      reportData.nome_obra = projectData.nome_obra
      reportData.localizacao = projectData.localizacao

      console.log(`[v0] Relatório salvo no banco de dados`)
    }

    // Verificar se PDF já existe no S3
    const pdfKey = `reports/${analysisId}.pdf`

    try {
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: pdfKey,
      })

      await s3Client.send(headCommand)
      console.log(`[v0] PDF já existe no S3`)

      // PDF existe, apenas gerar URL de download
      const downloadUrl = await generatePresignedUrl(pdfKey)

      return res.json({
        id: reportData.id,
        analysisId: reportData.analysis_id,
        nomeRelatorio: reportData.nome_relatorio,
        analyzedAt: reportData.analyzed_at,
        overallProgress: reportData.overall_progress ? (reportData.overall_progress * 100).toFixed(2) : "0.00",
        sequenceNumber: reportData.sequence_number,
        nomeObra: reportData.nome_obra,
        localizacao: reportData.localizacao,
        downloadUrl,
        pdfExists: true,
      })
    } catch (headError) {
      // PDF não existe, precisa gerar
      console.log(`[v0] PDF não existe no S3, gerando...`)

      // Buscar análise novamente se necessário
      const analysis = await fetchAnalysisFromVirag(analysisId)

      // Buscar dados do projeto
      const projectQuery = "SELECT * FROM obras WHERE id = $1"
      const projectResult = await pool.query(projectQuery, [analysis.project_id])
      const projectData = projectResult.rows[0]

      // Montar modelo e gerar HTML
      const reportModel = buildReportModel(analysis)
      const html = generateReportHtml(reportModel, projectData)

      console.log(`[v0] HTML gerado, convertendo para PDF...`)

      // Gerar PDF
      const pdfBuffer = await generatePdfBufferFromHtml(html)

      console.log(`[v0] PDF gerado, fazendo upload para S3...`)

      // Upload para S3
      const putCommand = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: pdfKey,
        Body: pdfBuffer,
        ContentType: "application/pdf",
        ContentDisposition: `attachment; filename="${reportData.nome_relatorio}.pdf"`,
      })

      await s3Client.send(putCommand)

      // Atualizar banco com pdf_s3_key
      await pool.query("UPDATE relatorios SET pdf_s3_key = $1 WHERE analysis_id = $2", [pdfKey, analysisId])

      console.log(`[v0] PDF enviado para S3 com sucesso`)

      // Gerar URL de download
      const downloadUrl = await generatePresignedUrl(pdfKey)

      return res.json({
        id: reportData.id,
        analysisId: reportData.analysis_id,
        nomeRelatorio: reportData.nome_relatorio,
        analyzedAt: reportData.analyzed_at,
        overallProgress: reportData.overall_progress ? (reportData.overall_progress * 100).toFixed(2) : "0.00",
        sequenceNumber: reportData.sequence_number,
        nomeObra: reportData.nome_obra,
        localizacao: reportData.localizacao,
        downloadUrl,
        pdfExists: false,
        generated: true,
      })
    }
  } catch (error) {
    console.error("[v0] Erro ao obter relatório:", error)
    res.status(500).json({
      error: "Erro ao obter relatório",
      details: error.message,
    })
  }
}

// Listar relatórios de uma obra
export const listarRelatorios = async (req, res) => {
  try {
    const { obraId } = req.params

    const query = "SELECT * FROM relatorios WHERE obra_id = $1 ORDER BY created_at DESC"
    const result = await pool.query(query, [obraId])

    const relatoriosFormatados = result.rows.map((rel) => formatDatesInObject(rel))

    res.json({
      relatorios: relatoriosFormatados,
    })
  } catch (error) {
    console.error("Erro ao listar relatórios:", error)
    res.status(500).json({ error: "Erro ao listar relatórios" })
  }
}

// Obter relatório específico
export const obterRelatorio = async (req, res) => {
  try {
    const { id } = req.params

    const query = "SELECT * FROM relatorios WHERE id = $1"
    const result = await pool.query(query, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Relatório não encontrado" })
    }

    res.json({
      relatorio: formatDatesInObject(result.rows[0]),
    })
  } catch (error) {
    console.error("Erro ao obter relatório:", error)
    res.status(500).json({ error: "Erro ao obter relatório" })
  }
}

// Deletar relatório
export const deletarRelatorio = async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query("DELETE FROM relatorios WHERE id = $1 RETURNING *", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Relatório não encontrado" })
    }

    res.json({
      message: "Relatório deletado com sucesso",
      relatorio: formatDatesInObject(result.rows[0]),
    })
  } catch (error) {
    console.error("Erro ao deletar relatório:", error)
    res.status(500).json({ error: "Erro ao deletar relatório" })
  }
}
