import express from "express"
import { uploadFoto as uploadFotoMiddleware } from "../config/s3.js"
import { uploadFoto, listarFotos, deletarFoto, visualizarFoto } from "../controllers/fotosController.js"

const router = express.Router()

router.post("/:obraId", uploadFotoMiddleware.single("foto"), uploadFoto)
router.get("/view/:id", visualizarFoto)
router.get("/:obraId", listarFotos)
router.delete("/:id", deletarFoto)

export default router
