import express from "express"
import {
  criarObra,
  editarObra,
  listarObrasAtivas,
  obterObraDetalhes,
  deletarObra,
  atualizarProgresso,
} from "../controllers/obrasController.js"

const router = express.Router()

router.post("/", criarObra)
router.put("/:id", editarObra)
router.get("/", listarObrasAtivas)
router.get("/:id", obterObraDetalhes)
router.delete("/:id", deletarObra)
router.patch("/:id/progress", atualizarProgresso) 

export default router
