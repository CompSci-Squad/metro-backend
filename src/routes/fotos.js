import express from "express"
import { uploadFoto as uploadFotoMiddleware } from "../config/s3.js"
import { uploadFoto, listarFotos, deletarFoto } from "../controllers/fotosController.js"

const router = express.Router()

router.post("/:obraId", uploadFotoMiddleware.single("foto"), uploadFoto)
router.get("/:obraId", listarFotos)
router.delete("/:id", deletarFoto)

export default router
