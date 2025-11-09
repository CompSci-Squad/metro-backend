import express from "express"
import cors from "cors"
import dotenv from "dotenv"

import obrasRoutes from "./routes/obras.js"
import fotosRoutes from "./routes/fotos.js"
import relatoriosRoutes from "./routes/relatorios.js"
import bimRoutes from "./routes/bim.js"
import iaRoutes from "./routes/ia.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/api/projects", obrasRoutes)
app.use("/api/photos", fotosRoutes)
app.use("/api/reports", relatoriosRoutes)
app.use("/api/bim", bimRoutes)
app.use("/api/ai", iaRoutes)

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "API de Monitoramento de Obras funcionando!" })
})

app.use((err, req, res, next) => {
  console.error("Erro:", err)
  res.status(err.status || 500).json({
    error: err.message || "Erro interno do servidor",
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
  console.log(`📍 Health check: http://localhost:${PORT}/health`)
})

export default app
