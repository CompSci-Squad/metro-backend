import { S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import multer from "multer"
import multerS3 from "multer-s3"
import dotenv from "dotenv"

dotenv.config()

console.log("☁️  Configurando cliente S3...")
console.log(`   Região: ${process.env.AWS_REGION}`)
console.log(`   Bucket: ${process.env.S3_BUCKET_NAME}`)

const s3Config = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
}

// Se AWS_ENDPOINT estiver definido (LocalStack), adiciona à configuração
if (process.env.AWS_ENDPOINT) {
  console.log(`   Endpoint: ${process.env.AWS_ENDPOINT} (LocalStack)`)
  console.log(`   ForcePathStyle: true`)
  s3Config.endpoint = process.env.AWS_ENDPOINT
  s3Config.forcePathStyle = true // Necessário para LocalStack
} else {
  console.log(`   Endpoint: AWS padrão (produção)`)
}

const s3Client = new S3Client(s3Config)
console.log("✅ Cliente S3 configurado com sucesso!")

// Upload de fotos
export const uploadFoto = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    acl: "private",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    contentDisposition: "inline",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname })
    },
    key: (req, file, cb) => {
      const projectId = req.params.projectId || "unknown"
      const timestamp = Date.now()
      const fileName = `fotos/${projectId}/${timestamp}-${file.originalname}`
      console.log(`📷 Upload de foto: ${fileName} (${(file.size / 1024).toFixed(2)} KB)`)
      cb(null, fileName)
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB para fotos grandes
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      console.log(`✅ Tipo de arquivo aceito: ${file.mimetype}`)
      cb(null, true)
    } else {
      console.error(`❌ Tipo de arquivo rejeitado: ${file.mimetype}`)
      cb(new Error("Apenas imagens são permitidas!"), false)
    }
  },
})

// Upload de arquivos BIM
export const uploadBIM = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    acl: "private",
    key: (req, file, cb) => {
      const timestamp = Date.now()
      const fileName = `bim/${timestamp}-${file.originalname}`
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
      console.log(`🏛️  Upload de arquivo BIM: ${fileName} (${sizeMB} MB)`)
      cb(null, fileName)
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5GB para arquivos BIM grandes
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".ifc", ".rvt", ".nwd", ".nwc", ".dwg", ".dxf"]
    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf("."))
    if (allowedExtensions.includes(ext)) {
      console.log(`✅ Extensão BIM aceita: ${ext}`)
      cb(null, true)
    } else {
      console.error(`❌ Extensão BIM rejeitada: ${ext}`)
      cb(new Error("Tipo de arquivo BIM não suportado!"), false)
    }
  },
})

// Função para gerar URL pré-assinada
export async function generatePresignedUrl(key) {
  try {
    console.log(`🔗 Gerando URL pré-assinada para: ${key}`)
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    })

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
    console.log(`✅ URL gerada com sucesso (expira em 1h)`)
    return url
  } catch (error) {
    console.error(`❌ Erro ao gerar URL pré-assinada: ${error.message}`)
    throw error
  }
}

export { s3Client }
