import pool from "../config/database.js"
import { formatDatesInObject } from "../utils/dateFormatter.js"


export const criarRelatorio = async (req, res) => {
  try {
    const { obraId } = req.params
    const { data_foto, conteudo_json } = req.body

    if (!data_foto || !conteudo_json) {
      return res.status(400).json({ error: "Data da foto e conteúdo JSON são obrigatórios" })
    }

    
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
