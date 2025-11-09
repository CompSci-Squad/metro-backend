import express from "express"
import {
  criarRelatorio,
  listarRelatorios,
  obterRelatorio,
  deletarRelatorio,
} from "../controllers/relatoriosController.js"

const router = express.Router()

router.post("/:obraId", criarRelatorio)
router.get("/:obraId", listarRelatorios)
router.get("/details/:id", obterRelatorio) 
router.delete("/:id", deletarRelatorio)

export default router
