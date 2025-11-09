import express from "express"
import { receberDadosIA, enviarDadosIA } from "../controllers/iaController.js"

const router = express.Router()

router.post("/:obraId/receive", receberDadosIA)
router.post("/:obraId/send", enviarDadosIA)

export default router
