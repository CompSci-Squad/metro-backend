import express from "express"
import cors from "cors"
import dotenv from "dotenv"

// Importar rotas
import obrasRoutes from "./routes/obras.js"
import fotosRoutes from "./routes/fotos.js"
import relatoriosRoutes from "./routes/relatorios.js"
import bimRoutes from "./routes/bim.js"
import iaRoutes from "./routes/ia.js"

import { checkDatabaseConnection, ensureTablesExist } from "./config/database.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middlewares
app.use(cors())
app.use(express.json({ limit: '50mb' })) // Aumentar limite para JSONs grandes
app.use(express.urlencoded({ extended: true, limit: '50mb' })) // Aumentar limite para form data

// Rotas
app.use("/api/projects", obrasRoutes)
app.use("/api/photos", fotosRoutes)
app.use("/api/reports", relatoriosRoutes)
app.use("/api/bim", bimRoutes)
app.use("/api/ai", iaRoutes)

// Rota de health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "API de Monitoramento de Obras funcionando!" })
})

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error("Erro:", err)
  res.status(err.status || 500).json({
    error: err.message || "Erro interno do servidor",
  })
})

async function startServer() {
  console.log("")
  console.log("==========================================")
  console.log("🚀 INICIANDO SERVIDOR METRO BACKEND")
  console.log("==========================================")
  console.log("")
  
  const startTime = Date.now()
  let retryCount = 0
  const maxRetries = 10

  // Check database connection with retry
  console.log("📊 [1/3] Verificando conexão com banco de dados...")
  let dbConnected = false
  while (!dbConnected && retryCount < maxRetries) {
    dbConnected = await checkDatabaseConnection()
    if (!dbConnected) {
      retryCount++
      console.error(`❌ Tentativa ${retryCount}/${maxRetries} falhou. Aguardando 5 segundos...`)
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }

  if (!dbConnected) {
    console.error("")
    console.error("==========================================")
    console.error("❌ FALHA CRÍTICA: Banco de dados inacessível")
    console.error("==========================================")
    process.exit(1)
  }

  // Ensure tables exist (cria automaticamente se não existirem)
  const tablesReady = await ensureTablesExist()
  if (!tablesReady) {
    console.error("")
    console.error("==========================================")
    console.error("❌ FALHA CRÍTICA: Não foi possível preparar o banco de dados")
    console.error("==========================================")
    console.error("Verifique os logs acima para mais detalhes.")
    process.exit(1)
  }

  console.log("")
  
  // Start server
  console.log("🌐 [3/3] Iniciando servidor HTTP...")
  app.listen(PORT, () => {
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log("")
    console.log("==========================================")
    console.log("✅ SERVIDOR INICIADO COM SUCESSO!")
    console.log("==========================================")
    console.log(`⏱️  Tempo de inicialização: ${elapsedTime}s`)
    console.log(`🌐 Servidor: http://localhost:${PORT}`)
    console.log(`❤️  Health check: http://localhost:${PORT}/health`)
    console.log(`📚 API Base: http://localhost:${PORT}/api`)
    console.log(`🔧 Ambiente: ${process.env.NODE_ENV}`)
    console.log("==========================================")
    console.log("")
    console.log("📋 Endpoints disponíveis:")
    console.log("   - GET  /health")
    console.log("   - POST /api/projects")
    console.log("   - POST /api/photos/:projectId")
    console.log("   - POST /api/reports/:projectId")
    console.log("   - POST /api/bim/:projectId")
    console.log("   - POST /api/ai/:projectId/analyze-image")
    console.log("")
    console.log("✨ Sistema pronto para receber requisições!")
    console.log("")
  })
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  process.exit(1)
})

startServer()

export default app
