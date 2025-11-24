import pool from "../config/database.js"
import { parseDateToDB, formatDatesInObject } from "../utils/dateFormatter.js"
import { analyzePhotoForProject } from "../services/viragService.js"
import axios from "axios"

// Upload de foto
export const uploadFoto = async (req, res) => {
  try {
    const { obraId } = req.params
    const { nome_foto, descricao_foto, data_foto } = req.body

    if (!req.file) {
      return res.status(400).json({ error: "Nenhuma foto foi enviada" })
    }

    if (!nome_foto) {
      return res.status(400).json({ error: "Nome da foto é obrigatório" })
    }

    const dataFotoDB = data_foto ? parseDateToDB(data_foto) : new Date().toISOString().split("T")[0]

    const query = `
      INSERT INTO fotos (obra_id, nome_foto, descricao_foto, data_foto, url_s3)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `

    const values = [
      obraId,
      nome_foto,
      descricao_foto || null,
      dataFotoDB,
      req.file.location, // URL do S3
    ]

    const result = await pool.query(query, values)
    const fotoSalva = result.rows[0]

    let analysisResult = null
    let relatorioId = null

    try {
      console.log("[v0] Iniciando análise automática da foto ID:", fotoSalva.id)

      // Baixar a imagem do S3
      const imageResponse = await axios.get(req.file.location, {
        responseType: "arraybuffer",
      })
      const imageBuffer = Buffer.from(imageResponse.data)

      // Enviar para análise e aguardar resposta
      analysisResult = await analyzePhotoForProject(
        imageBuffer,
        req.file.originalname,
        obraId,
        nome_foto,
        descricao_foto,
      )

      if (analysisResult.success && analysisResult.data.analysis_id) {
        const analysisData = analysisResult.data

        // Buscar dados da obra para criar nome do relatório
        const obraQuery = "SELECT nome_obra FROM obras WHERE id = $1"
        const obraResult = await pool.query(obraQuery, [obraId])

        const analyzedDate = new Date()
        const formattedDate = analyzedDate.toLocaleDateString("pt-BR").replace(/\//g, "/")
        const nomeRelatorio = `Relatório de Progresso - ${formattedDate}`

        const relatorioQuery = `
          INSERT INTO relatorios (
            obra_id, 
            analysis_id, 
            nome_relatorio, 
            conteudo_json,
            analyzed_at,
            overall_progress,
            sequence_number
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `

        const relatorioValues = [
          obraId,
          analysisData.analysis_id,
          nomeRelatorio,
          JSON.stringify({
            tipo: "analise_foto_automatica",
            foto_id: fotoSalva.id,
            nome_foto: nome_foto,
            descricao_foto: descricao_foto,
            status: analysisData.status || "completed",
          }),
          new Date().toISOString(),
          analysisData.overall_progress || 0,
          analysisData.sequence_number || 1,
        ]

        const relatorioResult = await pool.query(relatorioQuery, relatorioValues)
        relatorioId = relatorioResult.rows[0].id
        console.log("[v0] Relatório salvo com analysis_id:", analysisData.analysis_id)
      } else {
        console.error("[v0] Falha na análise automática:", analysisResult.error)
      }
    } catch (error) {
      console.error("[v0] Erro ao processar análise automática:", error.message)
    }

    res.status(201).json({
      message: "Foto enviada e análise concluída",
      foto: formatDatesInObject(fotoSalva),
      analise: analysisResult?.success
        ? {
            analysis_id: analysisResult.data.analysis_id,
            relatorio_id: relatorioId,
            status: analysisResult.data.status,
            message: "Relatório salvo. Use GET /api/reports/analysis/{analysis_id} para gerar o PDF.",
          }
        : null,
      erro_analise: analysisResult?.success === false ? analysisResult.error : null,
    })
  } catch (error) {
    console.error("Erro ao fazer upload da foto:", error)
    res.status(500).json({ error: "Erro ao fazer upload da foto" })
  }
}

// Listar fotos de uma obra
export const listarFotos = async (req, res) => {
  try {
    const { obraId } = req.params

    const query = "SELECT * FROM fotos WHERE obra_id = $1 ORDER BY data_foto DESC"
    const result = await pool.query(query, [obraId])

    const fotosFormatadas = result.rows.map((foto) => formatDatesInObject(foto))

    res.json({
      fotos: fotosFormatadas,
    })
  } catch (error) {
    console.error("Erro ao listar fotos:", error)
    res.status(500).json({ error: "Erro ao listar fotos" })
  }
}

// Deletar foto
export const deletarFoto = async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query("DELETE FROM fotos WHERE id = $1 RETURNING *", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Foto não encontrada" })
    }

    // Aqui você pode adicionar lógica para deletar do S3 também
    // const s3Key = result.rows[0].url_s3.split('.com/')[1];
    // await s3.deleteObject({ Bucket: process.env.S3_BUCKET_NAME, Key: s3Key }).promise();

    res.json({
      message: "Foto deletada com sucesso",
      foto: formatDatesInObject(result.rows[0]),
    })
  } catch (error) {
    console.error("Erro ao deletar foto:", error)
    res.status(500).json({ error: "Erro ao deletar foto" })
  }
}

export const visualizarFoto = async (req, res) => {
  try {
    const { id } = req.params

    const query = "SELECT * FROM fotos WHERE id = $1"
    const result = await pool.query(query, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Foto não encontrada" })
    }

    const foto = result.rows[0]

    res.json({
      id: foto.id,
      nome_foto: foto.nome_foto,
      descricao_foto: foto.descricao_foto,
      url: foto.url_s3,
      data_foto: formatDatesInObject(foto).data_foto,
      obra_id: foto.obra_id,
    })
  } catch (error) {
    console.error("Erro ao visualizar foto:", error)
    res.status(500).json({ error: "Erro ao visualizar foto" })
  }
}
