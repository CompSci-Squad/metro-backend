import { S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import multer from "multer"
import multerS3 from "multer-s3"
import dotenv from "dotenv"

dotenv.config()

const s3Config = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
}


if (process.env.AWS_ENDPOINT) {
  s3Config.endpoint = process.env.AWS_ENDPOINT
  s3Config.forcePathStyle = true 
}

const s3Client = new S3Client(s3Config)


export const uploadFoto = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    acl: "private",
    key: (req, file, cb) => {
      const projectId = req.params.projectId || "unknown"
      const timestamp = Date.now()
      const fileName = `fotos/${projectId}/${timestamp}-${file.originalname}`
      cb(null, fileName)
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Apenas imagens são permitidas!"), false)
    }
  },
})


export const uploadBIM = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME,
    acl: "private",
    key: (req, file, cb) => {
      const projectId = req.params.projectId || "unknown"
      const timestamp = Date.now()
      const fileName = `bim/${projectId}/${timestamp}-${file.originalname}`
      cb(null, fileName)
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".ifc", ".rvt", ".nwd", ".nwc", ".dwg", ".dxf"]
    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf("."))
    if (allowedExtensions.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error("Tipo de arquivo BIM não suportado!"), false)
    }
  },
})


export async function generatePresignedUrl(key) {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  })

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 })
}

export { s3Client }
