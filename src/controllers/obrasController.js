import pool from "../config/database.js"
import { parseDateToDB, formatDatesInObject } from "../utils/dateFormatter.js"


export const criarObra = async (req, res) => {
  try {
    const { nome_obra, responsavel_obra, localizacao, previsao_termino, observacoes, data_inicio } = req.body

    
    if (!nome_obra || !responsavel_obra || !localizacao || !previsao_termino) {
      return res.status(400).json({
        error: "Campos obrigatórios faltando",
        required: ["nome_obra", "responsavel_obra", "localizacao", "previsao_termino"],
      })
    }

    const dataInicioDB = parseDateToDB(data_inicio)
    const previsaoTerminoDB = parseDateToDB(previsao_termino)

    const query = `
      INSERT INTO obras (nome_obra, responsavel_obra, localizacao, data_inicio, previsao_termino, observacoes)
      VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5, $6)
      RETURNING *
    `

    const values = [
      nome_obra,
      responsavel_obra,
      localizacao,
      dataInicioDB || null,
      previsaoTerminoDB,
      observacoes || null,
    ]
    const result = await pool.query(query, values)

    const obraFormatada = formatDatesInObject(result.rows[0])

    res.status(201).json({
      message: "Obra criada com sucesso",
      obra: obraFormatada,
    })
  } catch (error) {
    console.error("Erro ao criar obra:", error)
    res.status(500).json({ error: "Erro ao criar obra" })
  }
}


export const editarObra = async (req, res) => {
  try {
    const { id } = req.params
    const { nome_obra, localizacao } = req.body

    if (!nome_obra && !localizacao) {
      return res.status(400).json({ error: "Nenhum campo para atualizar foi fornecido" })
    }

    const updates = []
    const values = []
    let paramCount = 1

    if (nome_obra) {
      updates.push(`nome_obra = $${paramCount}`)
      values.push(nome_obra)
      paramCount++
    }

    if (localizacao) {
      updates.push(`localizacao = $${paramCount}`)
      values.push(localizacao)
      paramCount++
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    const query = `
      UPDATE obras
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Obra não encontrada" })
    }

    res.json({
      message: "Obra atualizada com sucesso",
      obra: formatDatesInObject(result.rows[0]),
    })
  } catch (error) {
    console.error("Erro ao editar obra:", error)
    res.status(500).json({ error: "Erro ao editar obra" })
  }
}


export const listarObrasAtivas = async (req, res) => {
  try {
    const query = `
      SELECT *
      FROM obras
      ORDER BY created_at DESC
    `

    const result = await pool.query(query)

    const obrasFormatadas = result.rows.map((obra) => formatDatesInObject(obra))

    res.json({
      obras: obrasFormatadas,
    })
  } catch (error) {
    console.error("Erro ao listar obras:", error)
    res.status(500).json({ error: "Erro ao listar obras" })
  }
}


export const obterObraDetalhes = async (req, res) => {
  try {
    const { id } = req.params

    const obraQuery = "SELECT * FROM obras WHERE id = $1"
    const obraResult = await pool.query(obraQuery, [id])

    if (obraResult.rows.length === 0) {
      return res.status(404).json({ error: "Obra não encontrada" })
    }

    const fotosQuery = "SELECT * FROM fotos WHERE obra_id = $1 ORDER BY data_foto DESC"
    const fotosResult = await pool.query(fotosQuery, [id])

    const relatoriosQuery = "SELECT * FROM relatorios WHERE obra_id = $1 ORDER BY created_at DESC"
    const relatoriosResult = await pool.query(relatoriosQuery, [id])

    const bimQuery = "SELECT * FROM arquivos_bim WHERE obra_id = $1 ORDER BY created_at DESC"
    const bimResult = await pool.query(bimQuery, [id])

    res.json({
      obra: formatDatesInObject(obraResult.rows[0]),
      fotos: fotosResult.rows.map((foto) => formatDatesInObject(foto)),
      relatorios: relatoriosResult.rows.map((rel) => formatDatesInObject(rel)),
      arquivos_bim: bimResult.rows.map((bim) => formatDatesInObject(bim)),
    })
  } catch (error) {
    console.error("Erro ao obter detalhes da obra:", error)
    res.status(500).json({ error: "Erro ao obter detalhes da obra" })
  }
}


export const deletarObra = async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query("DELETE FROM obras WHERE id = $1 RETURNING *", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Obra não encontrada" })
    }

    res.json({
      message: "Obra deletada com sucesso",
      obra: formatDatesInObject(result.rows[0]),
    })
  } catch (error) {
    console.error("Erro ao deletar obra:", error)
    res.status(500).json({ error: "Erro ao deletar obra" })
  }
}


export const atualizarProgresso = async (req, res) => {
  try {
    const { id } = req.params
    const { progresso, status } = req.body

    const updates = []
    const values = []
    let paramCount = 1

    if (progresso !== undefined) {
      updates.push(`progresso = $${paramCount}`)
      values.push(progresso)
      paramCount++
    }

    if (status) {
      updates.push(`status = $${paramCount}`)
      values.push(status)
      paramCount++
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Nenhum campo para atualizar" })
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(id)

    const query = `
      UPDATE obras
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Obra não encontrada" })
    }

    res.json({
      message: "Progresso atualizado com sucesso",
      obra: formatDatesInObject(result.rows[0]),
    })
  } catch (error) {
    console.error("Erro ao atualizar progresso:", error)
    res.status(500).json({ error: "Erro ao atualizar progresso" })
  }
}
