import express from "express"
import {
  criarRelatorio,
  listarRelatorios,
  obterRelatorio,
  deletarRelatorio,
  listarTodosRelatorios,
  obterRelatorioPorAnalysisId,
} from "../controllers/relatoriosController.js"

const router = express.Router()

router.get("/", listarTodosRelatorios)

router.get("/analysis/:analysisId", obterRelatorioPorAnalysisId)

// Rotas existentes
router.post("/:obraId", criarRelatorio)
router.get("/:obraId", listarRelatorios)
router.get("/details/:id", obterRelatorio)
router.delete("/:id", deletarRelatorio)

export default router
