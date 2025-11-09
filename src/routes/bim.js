import express from "express"
import { uploadBIM as uploadBIMMiddleware } from "../config/s3.js"
import { uploadBIM, obterArquivoBIM, deletarArquivoBIM, downloadArquivoBIM } from "../controllers/bimController.js"

const router = express.Router()

router.post("/:projectId", uploadBIMMiddleware.single("arquivo"), uploadBIM)
router.get("/:projectId", obterArquivoBIM)
router.get("/download/:projectId", downloadArquivoBIM)
router.delete("/:projectId", deletarArquivoBIM)

export default router
