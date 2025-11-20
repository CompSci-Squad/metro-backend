import pool from "../config/database.js"
import { parseDateToDB, formatDatesInObject } from "../utils/dateFormatter.js"

// Criar nova obra
export const criarObra = async (req, res) => {
  const client = await pool.connect()

  try {
    console.log("[v0] Recebendo requisição para criar obra com arquivo BIM")
    console.log("[v0] Body recebido:", req.body)
    console.log("[v0] Arquivo recebido:", req.file)

    const { nome_obra, responsavel_obra, localizacao, previsao_termino, observacoes, data_inicio } = req.body

    // Validação básica
    if (!nome_obra || !responsavel_obra || !localizacao || !previsao_termino) {
      console.log("[v0] Validação falhou - campos obrigatórios faltando")
      return res.status(400).json({
        error: "Campos obrigatórios faltando",
        required: ["nome_obra", "responsavel_obra", "localizacao", "previsao_termino"],
      })
    }

    if (!req.file) {
      console.log("[v0] Validação falhou - arquivo BIM obrigatório")
      return res.status(400).json({
        error: "Arquivo BIM é obrigatório",
      })
    }

    console.log("[v0] Convertendo datas...")
    const dataInicioDB = parseDateToDB(data_inicio)
    const previsaoTerminoDB = parseDateToDB(previsao_termino)
    console.log("[v0] Data início convertida:", dataInicioDB)
    console.log("[v0] Previsão término convertida:", previsaoTerminoDB)

    await client.query("BEGIN")

    const obraQuery = `
      INSERT INTO obras (nome_obra, responsavel_obra, localizacao, data_inicio, previsao_termino, observacoes)
      VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5, $6)
      RETURNING *
    `

    const obraValues = [
      nome_obra,
      responsavel_obra,
      localizacao,
      dataInicioDB || null,
      previsaoTerminoDB,
      observacoes || null,
    ]

    console.log("[v0] Criando obra no banco...")
    const obraResult = await client.query(obraQuery, obraValues)
    const obra = obraResult.rows[0]
    console.log("[v0] Obra criada com ID:", obra.id)

    const bimQuery = `
      INSERT INTO arquivos_bim (obra_id, nome_arquivo, tipo_arquivo, tamanho_arquivo, url_s3, s3_key)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `

    const bimValues = [
      obra.id,
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      req.file.location,
      req.file.key,
    ]

    console.log("[v0] Salvando metadados do arquivo BIM...")
    const bimResult = await client.query(bimQuery, bimValues)
    console.log("[v0] Arquivo BIM vinculado à obra")

    await client.query("COMMIT")

    const obraFormatada = formatDatesInObject(obra)
    const bimFormatado = formatDatesInObject(bimResult.rows[0])

    res.status(201).json({
      message: "Obra criada com sucesso com arquivo BIM",
      obra: obraFormatada,
      arquivoBim: bimFormatado,
    })
  } catch (error) {
    await client.query("ROLLBACK")
    console.error("[v0] Erro ao criar obra:", error)
    console.error("[v0] Stack trace:", error.stack)
    res.status(500).json({ error: "Erro ao criar obra", details: error.message })
  } finally {
    client.release()
  }
}

// Editar obra existente
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

// Listar obras ativas
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

// Obter detalhes de uma obra específica
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

// Deletar obra
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

// Atualizar progresso da obra
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
