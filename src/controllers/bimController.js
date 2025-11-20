import pool from "../config/database.js"
import { generatePresignedUrl } from "../config/s3.js"
import { formatDatesInObject } from "../utils/dateFormatter.js"

export const uploadBIM = async (req, res) => {
  try {
    const { projectId } = req.params

    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo foi enviado" })
    }

    const projectCheck = await pool.query("SELECT id FROM obras WHERE id = $1", [projectId])
    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: "Projeto não encontrado" })
    }

    const existingBIM = await pool.query("SELECT * FROM arquivos_bim WHERE obra_id = $1", [projectId])

    const s3Key = req.file.key // multer-s3 fornece a chave diretamente

    let result

    if (existingBIM.rows.length > 0) {
      const updateQuery = `
        UPDATE arquivos_bim 
        SET nome_arquivo = $1, tipo_arquivo = $2, tamanho_arquivo = $3, url_s3 = $4, s3_key = $5, updated_at = CURRENT_TIMESTAMP
        WHERE obra_id = $6
        RETURNING *
      `
      const values = [req.file.originalname, req.file.mimetype, req.file.size, req.file.location, s3Key, projectId]
      result = await pool.query(updateQuery, values)

      res.json({
        message: "Arquivo BIM atualizado com sucesso",
        arquivo: formatDatesInObject(result.rows[0]),
      })
    } else {
      const insertQuery = `
        INSERT INTO arquivos_bim (obra_id, nome_arquivo, tipo_arquivo, tamanho_arquivo, url_s3, s3_key)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `
      const values = [projectId, req.file.originalname, req.file.mimetype, req.file.size, req.file.location, s3Key]
      result = await pool.query(insertQuery, values)

      res.status(201).json({
        message: "Arquivo BIM enviado com sucesso",
        arquivo: formatDatesInObject(result.rows[0]),
      })
    }
  } catch (error) {
    console.error("Erro ao fazer upload do arquivo BIM:", error)
    res.status(500).json({ error: "Erro ao fazer upload do arquivo BIM" })
  }
}

export const obterArquivoBIM = async (req, res) => {
  try {
    const { projectId } = req.params

    const query = "SELECT * FROM arquivos_bim WHERE obra_id = $1"
    const result = await pool.query(query, [projectId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Arquivo BIM não encontrado para este projeto" })
    }

    res.json({
      arquivo: formatDatesInObject(result.rows[0]),
    })
  } catch (error) {
    console.error("Erro ao obter arquivo BIM:", error)
    res.status(500).json({ error: "Erro ao obter arquivo BIM" })
  }
}

export const deletarArquivoBIM = async (req, res) => {
  try {
    const { projectId } = req.params

    const result = await pool.query("DELETE FROM arquivos_bim WHERE obra_id = $1 RETURNING *", [projectId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Arquivo BIM não encontrado" })
    }

    res.json({
      message: "Arquivo BIM deletado com sucesso",
      arquivo: formatDatesInObject(result.rows[0]),
    })
  } catch (error) {
    console.error("Erro ao deletar arquivo BIM:", error)
    res.status(500).json({ error: "Erro ao deletar arquivo BIM" })
  }
}

export const downloadArquivoBIM = async (req, res) => {
  try {
    const { projectId } = req.params

    const result = await pool.query("SELECT * FROM arquivos_bim WHERE obra_id = $1", [projectId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Arquivo BIM não encontrado" })
    }

    const arquivo = result.rows[0]

    const s3Key = arquivo.s3_key || arquivo.url_s3.split(`${process.env.S3_BUCKET_NAME}/`)[1]

    if (!s3Key) {
      throw new Error("Não foi possível obter a chave do arquivo S3")
    }

    console.log("[v0] Gerando URL pré-assinada para a chave:", s3Key)

    const downloadUrl = await generatePresignedUrl(s3Key, arquivo.nome_arquivo)

    res.json({
      message: "URL de download gerada com sucesso",
      downloadUrl: downloadUrl,
      expiresIn: "1 hora",
      arquivo: {
        id: arquivo.id,
        nome: arquivo.nome_arquivo,
        tipo: arquivo.tipo_arquivo,
        tamanho: arquivo.tamanho_arquivo,
      },
    })
  } catch (error) {
    console.error("Erro ao gerar URL de download:", error)
    res.status(500).json({ error: "Erro ao gerar URL de download" })
  }
}
