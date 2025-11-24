import pool from "../config/database.js"

// Endpoint para receber dados da IA
export const receberDadosIA = async (req, res) => {
  try {
    const { obraId } = req.params
    const dadosIA = req.body

    // Aqui você pode processar os dados recebidos da IA
    // Por exemplo, atualizar progresso, criar relatórios, etc.

    console.log("Dados recebidos da IA:", dadosIA)

    // Exemplo: atualizar progresso baseado na análise da IA
    if (dadosIA.progresso !== undefined) {
      await pool.query("UPDATE obras SET progresso = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [
        dadosIA.progresso,
        obraId,
      ])
    }

    res.json({
      message: "Dados da IA recebidos e processados com sucesso",
      dados: dadosIA,
    })
  } catch (error) {
    console.error("Erro ao receber dados da IA:", error)
    res.status(500).json({ error: "Erro ao processar dados da IA" })
  }
}

// Endpoint para enviar dados para a IA
export const enviarDadosIA = async (req, res) => {
  try {
    const { obraId } = req.params
    const { fotoId, tipo_analise } = req.body

    // Buscar dados da foto
    const fotoQuery = "SELECT * FROM fotos WHERE id = $1 AND obra_id = $2"
    const fotoResult = await pool.query(fotoQuery, [fotoId, obraId])

    if (fotoResult.rows.length === 0) {
      return res.status(404).json({ error: "Foto não encontrada" })
    }

    // Buscar dados da obra
    const obraQuery = "SELECT * FROM obras WHERE id = $1"
    const obraResult = await pool.query(obraQuery, [obraId])

    // Buscar arquivo BIM mais recente (se necessário)
    const bimQuery = "SELECT * FROM arquivos_bim WHERE obra_id = $1 ORDER BY created_at DESC LIMIT 1"
    const bimResult = await pool.query(bimQuery, [obraId])

    const dadosParaIA = {
      obra: obraResult.rows[0],
      foto: fotoResult.rows[0],
      arquivo_bim: bimResult.rows[0] || null,
      tipo_analise: tipo_analise || "completa",
    }

    // Aqui você enviaria os dados para o serviço de IA
    // Por enquanto, apenas retornamos os dados que seriam enviados
    console.log("Dados preparados para envio à IA:", dadosParaIA)

    res.json({
      message: "Dados preparados para envio à IA",
      dados: dadosParaIA,
    })
  } catch (error) {
    console.error("Erro ao preparar dados para IA:", error)
    res.status(500).json({ error: "Erro ao preparar dados para IA" })
  }
}
