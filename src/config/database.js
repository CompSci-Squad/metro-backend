import pg from "pg"
import dotenv from "dotenv"

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

pool.on("connect", () => {
  console.log("✅ Conectado ao banco de dados PostgreSQL")
})

pool.on("error", (err) => {
  console.error("❌ Erro inesperado no pool de conexões:", err)
  process.exit(-1)
})

export async function checkDatabaseConnection() {
  try {
    const client = await pool.connect()
    await client.query("SELECT NOW()")
    client.release()
    console.log("✅ Conexão com banco de dados verificada")
    return true
  } catch (error) {
    console.error("❌ Falha ao conectar com o banco de dados:", error.message)
    return false
  }
}

export async function verifyTablesExist() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('obras', 'fotos', 'relatorios', 'arquivos_bim')
    `)

    const existingTables = result.rows.map((row) => row.table_name)
    const requiredTables = ["obras", "fotos", "relatorios", "arquivos_bim"]
    const missingTables = requiredTables.filter((table) => !existingTables.includes(table))

    if (missingTables.length > 0) {
      console.warn(`⚠️  Tabelas não encontradas: ${missingTables.join(", ")}`)
      console.warn(`⚠️  Execute o script: psql -U postgres -d construction_monitoring -f scripts/001_create_tables.sql`)
      return false
    }

    console.log("✅ Todas as tabelas necessárias estão criadas")
    return true
  } catch (error) {
    console.error("❌ Erro ao verificar tabelas:", error.message)
    return false
  }
}

export default pool
