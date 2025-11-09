import pool from "../config/database.js"
import { parseDateToDB, formatDatesInObject } from "../utils/dateFormatter.js"


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
      req.file.location,
    ]

    const result = await pool.query(query, values)

    res.status(201).json({
      message: "Foto enviada com sucesso",
      foto: formatDatesInObject(result.rows[0]),
    })
  } catch (error) {
    console.error("Erro ao fazer upload da foto:", error)
    res.status(500).json({ error: "Erro ao fazer upload da foto" })
  }
}

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
    res.json({
      message: "Foto deletada com sucesso",
      foto: formatDatesInObject(result.rows[0]),
    })
  } catch (error) {
    console.error("Erro ao deletar foto:", error)
    res.status(500).json({ error: "Erro ao deletar foto" })
  }
}
