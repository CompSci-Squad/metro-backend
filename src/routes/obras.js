import express from "express"
import {
  criarObra,
  editarObra,
  listarObrasAtivas,
  obterObraDetalhes,
  deletarObra,
  atualizarProgresso,
} from "../controllers/obrasController.js"
import { uploadBIM } from "../config/s3.js"

const router = express.Router()

router.post("/", uploadBIM.single("arquivo"), criarObra)
router.put("/:id", editarObra)
router.get("/", listarObrasAtivas)
router.get("/:id", obterObraDetalhes)
router.delete("/:id", deletarObra)
router.patch("/:id/progress", atualizarProgresso)

export default router
