import axios from "axios"
import FormData from "form-data"

const VIRAG_API_URL = process.env.NGROK_URL
const VIRAG_API_KEY = process.env.VIRAG_API_KEY

// Validar variáveis de ambiente obrigatórias
if (!VIRAG_API_URL || !VIRAG_API_KEY) {
  console.warn("[v0] ATENÇÃO: NGROK_URL ou VIRAG_API_KEY não configurados no .env")
  console.warn("[v0] A integração com a IA VIRAG-BIM não funcionará corretamente")
}

// Criar instância do axios configurada
const viragApi = axios.create({
  baseURL: VIRAG_API_URL,
  headers: {
    Authorization: `Bearer ${VIRAG_API_KEY}`,
  },
  timeout: 120000, // 2 minutos para uploads grandes
})

// Upload e processamento de arquivo IFC/BIM
export const uploadBimToVirag = async (fileBuffer, fileName, projectData) => {
  try {
    console.log("[v0] Enviando arquivo BIM para API VIRAG-BIM...")

    const formData = new FormData()
    formData.append("file", fileBuffer, fileName)
    formData.append("project_id", projectData.project_id.toString())
    formData.append("project_name", projectData.nome_obra)

    if (projectData.localizacao) {
      formData.append("location", projectData.localizacao)
    }

    if (projectData.observacoes) {
      formData.append("description", projectData.observacoes)
    }

    const response = await viragApi.post("/bim/upload-ifc", formData, {
      headers: {
        ...formData.getHeaders(),
      },
    })

    console.log("[v0] Arquivo BIM processado com sucesso pela IA")
    console.log("[v0] Resposta VIRAG:", response.data)

    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    console.error("[v0] Erro ao enviar arquivo BIM para VIRAG:", error.message)

    if (error.response) {
      console.error("[v0] Resposta de erro VIRAG:", error.response.data)
      return {
        success: false,
        error: error.response.data,
        status: error.response.status,
      }
    }

    return {
      success: false,
      error: error.message,
    }
  }
}

// Analisar imagem individual
export const analyzeImage = async (imageUrl, analysisType = "progress") => {
  try {
    const response = await viragApi.post("/api/v1/analyze-image", {
      imageUrl,
      analysisType,
    })

    return {
      success: true,
      jobId: response.data.jobId,
      data: response.data,
    }
  } catch (error) {
    console.error("Erro ao analisar imagem:", error.message)
    return {
      success: false,
      error: error.response?.data || error.message,
    }
  }
}

// Analisar múltiplas imagens
export const analyzeBatch = async (imageUrls, analysisType = "progress") => {
  try {
    const response = await viragApi.post("/api/v1/analyze-batch", {
      imageUrls,
      analysisType,
    })

    return {
      success: true,
      jobId: response.data.jobId,
      data: response.data,
    }
  } catch (error) {
    console.error("Erro ao analisar lote:", error.message)
    return {
      success: false,
      error: error.response?.data || error.message,
    }
  }
}

// Buscar imagens similares
export const searchSimilar = async (referenceImageUrl, threshold = 0.8) => {
  try {
    const response = await viragApi.post("/api/v1/search-similar", {
      referenceImageUrl,
      threshold,
    })

    return {
      success: true,
      jobId: response.data.jobId,
      data: response.data,
    }
  } catch (error) {
    console.error("Erro ao buscar similares:", error.message)
    return {
      success: false,
      error: error.response?.data || error.message,
    }
  }
}

// Comparar com BIM
export const compareBim = async (imageUrl, bimFileUrl) => {
  try {
    const response = await viragApi.post("/api/v1/compare-bim", {
      imageUrl,
      bimFileUrl,
    })

    return {
      success: true,
      jobId: response.data.jobId,
      data: response.data,
    }
  } catch (error) {
    console.error("Erro ao comparar com BIM:", error.message)
    return {
      success: false,
      error: error.response?.data || error.message,
    }
  }
}

// Verificar status da API
export const checkHealth = async () => {
  try {
    const response = await viragApi.get("/api/v1/health")
    return {
      success: true,
      status: response.data.status,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}

// Analisar foto enviada para obra
export const analyzePhotoForProject = async (
  fileBuffer,
  fileName,
  projectId,
  imageDescription = null,
  context = null,
) => {
  try {
    console.log("[v0] Enviando foto para análise da IA VIRAG-BIM...")

    const formData = new FormData()
    formData.append("file", fileBuffer, fileName)
    formData.append("project_id", projectId.toString())

    if (imageDescription) {
      formData.append("image_description", imageDescription)
    }

    if (context) {
      formData.append("context", context)
    }

    const response = await viragApi.post("/bim/analyze", formData, {
      headers: {
        ...formData.getHeaders(),
      },
    })

    console.log("[v0] Foto analisada com sucesso pela IA")
    console.log("[v0] Análise ID:", response.data.analysis_id)

    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    console.error("[v0] Erro ao analisar foto na VIRAG:", error.message)

    if (error.response) {
      console.error("[v0] Resposta de erro VIRAG:", error.response.data)
      return {
        success: false,
        error: error.response.data,
        status: error.response.status,
      }
    }

    return {
      success: false,
      error: error.message,
    }
  }
}

// Buscar análise por ID
export const fetchAnalysisFromVirag = async (analysisId) => {
  try {
    console.log(`[v0] Buscando análise ${analysisId} na API VIRAG-BIM...`)

    const response = await viragApi.get(`/bim/analysis/${analysisId}`)

    console.log("[v0] Análise obtida com sucesso da IA")

    return response.data
  } catch (error) {
    console.error("[v0] Erro ao buscar análise da VIRAG:", error.message)

    if (error.response) {
      console.error("[v0] Resposta de erro VIRAG:", error.response.data)
      throw new Error(`Falha ao buscar análise da IA: ${error.response.data.message || error.response.statusText}`)
    }

    throw new Error(`Falha ao buscar análise da IA: ${error.message}`)
  }
}
