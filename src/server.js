import express from "express"
import cors from "cors"
import dotenv from "dotenv"

// Importar rotas
import obrasRoutes from "./routes/obras.js"
import fotosRoutes from "./routes/fotos.js"
import relatoriosRoutes from "./routes/relatorios.js"
import bimRoutes from "./routes/bim.js"
import iaRoutes from "./routes/ia.js"

import { checkDatabaseConnection, verifyTablesExist } from "./config/database.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middlewares
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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
  console.log("🔄 Iniciando servidor...")

  // Check database connection
  const dbConnected = await checkDatabaseConnection()
  if (!dbConnected) {
    console.error("❌ Não foi possível conectar ao banco de dados. Tentando novamente em 5 segundos...")
    setTimeout(startServer, 5000)
    return
  }

  // Verify tables exist
  const tablesExist = await verifyTablesExist()
  if (!tablesExist) {
    console.warn("⚠️  Banco de dados não está completamente configurado.")
    console.warn("⚠️  No Docker, isso será resolvido automaticamente na primeira inicialização.")
  }

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`)
    console.log(`📍 Health check: http://localhost:${PORT}/health`)
    console.log(`📁 Documentação: http://localhost:${PORT}/api`)
  })
}

startServer()

export default app
