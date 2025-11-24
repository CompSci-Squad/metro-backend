import pg from "pg"
import dotenv from "dotenv"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const { Pool } = pg

// Log de configuração do banco (sem senha)
console.log("📊 Configuração do banco de dados:")
console.log(`   Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`)
console.log(`   Database: ${process.env.DB_NAME}`)
console.log(`   User: ${process.env.DB_USER}`)

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

pool.on("connect", (client) => {
  console.log(`✅ Nova conexão estabelecida com PostgreSQL (Total: ${pool.totalCount})`)
})

pool.on("error", (err) => {
  console.error("❌ Erro inesperado no pool de conexões:")
  console.error(`   Mensagem: ${err.message}`)
  console.error(`   Código: ${err.code}`)
  if (err.stack) {
    console.error(`   Stack: ${err.stack.split('\n')[0]}`)
  }
  process.exit(-1)
})

export async function checkDatabaseConnection() {
  try {
    console.log("🔍 Testando conexão com banco de dados...")
    const client = await pool.connect()
    const result = await client.query("SELECT NOW() as current_time, version() as pg_version")
    const dbTime = result.rows[0].current_time
    const pgVersion = result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1]
    client.release()
    console.log(`✅ Conexão com banco de dados verificada!`)
    console.log(`   Hora do servidor: ${dbTime}`)
    console.log(`   Versão: ${pgVersion}`)
    console.log(`   Pool status: ${pool.totalCount} conexões, ${pool.idleCount} ociosas`)
    return true
  } catch (error) {
    console.error("❌ Falha ao conectar com o banco de dados:")
    console.error(`   Erro: ${error.message}`)
    console.error(`   Código: ${error.code || 'N/A'}`)
    return false
  }
}

// Função para criar tabelas automaticamente
export async function createTablesAutomatically() {
  try {
    console.log("🔨 Criando tabelas automaticamente...")
    
    // Caminho para o script SQL
    const sqlFilePath = join(__dirname, '../../scripts/001_create_tables.sql')
    
    console.log(`   📄 Lendo script: ${sqlFilePath}`)
    
    // Ler o arquivo SQL
    let sqlScript
    try {
      sqlScript = readFileSync(sqlFilePath, 'utf8')
    } catch (readError) {
      console.error(`   ❌ Não foi possível ler o arquivo SQL: ${readError.message}`)
      return false
    }
    
    console.log(`   ✅ Script SQL carregado (${sqlScript.length} caracteres)`)
    console.log(`   🔄 Executando comandos SQL...`)
    
    // Executar o script SQL
    await pool.query(sqlScript)
    
    console.log("   ✅ Tabelas criadas com sucesso!")
    
    // Verificar se as tabelas foram criadas
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('obras', 'fotos', 'relatorios', 'arquivos_bim')
      ORDER BY table_name
    `)
    
    const createdTables = tablesResult.rows.map((row) => row.table_name)
    console.log(`   ✅ ${createdTables.length} tabelas confirmadas:`)
    createdTables.forEach(table => console.log(`      - ${table}`))
    
    return true
  } catch (error) {
    console.error("❌ Erro ao criar tabelas automaticamente:")
    console.error(`   Mensagem: ${error.message}`)
    console.error(`   Código: ${error.code || 'N/A'}`)
    if (error.stack) {
      console.error(`   Stack (primeiras linhas): ${error.stack.split('\n').slice(0, 3).join('\n   ')}`)
    }
    return false
  }
}

export async function verifyTablesExist() {
  try {
    console.log("🔍 Verificando estrutura do banco de dados...")
    
    // Verificar tabelas
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('obras', 'fotos', 'relatorios', 'arquivos_bim')
      ORDER BY table_name
    `)

    const existingTables = tablesResult.rows.map((row) => row.table_name)
    const requiredTables = ["arquivos_bim", "fotos", "obras", "relatorios"]
    const missingTables = requiredTables.filter((table) => !existingTables.includes(table))

    if (missingTables.length > 0) {
      console.error(`❌ Tabelas não encontradas: ${missingTables.join(", ")}`)
      console.error(`   Tabelas existentes: ${existingTables.length > 0 ? existingTables.join(", ") : "nenhuma"}`)
      return false
    }

    console.log(`✅ Todas as ${existingTables.length} tabelas necessárias estão criadas:`)
    existingTables.forEach(table => console.log(`   - ${table}`));
    
    // Contar registros em cada tabela
    console.log("\n📊 Estatísticas das tabelas:")
    for (const table of existingTables) {
      try {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`)
        console.log(`   - ${table}: ${countResult.rows[0].count} registros`)
      } catch (err) {
        console.warn(`   - ${table}: erro ao contar (${err.message})`)
      }
    }
    
    return true
  } catch (error) {
    console.error("❌ Erro ao verificar tabelas:")
    console.error(`   Mensagem: ${error.message}`)
    console.error(`   Código: ${error.code || 'N/A'}`)
    return false
  }
}

// Função combinada: verifica e cria se necessário
export async function ensureTablesExist() {
  console.log("")
  console.log("🗄️  [2/3] Verificando estrutura do banco de dados...")
  
  // Primeiro tenta verificar
  const tablesExist = await verifyTablesExist()
  
  if (!tablesExist) {
    console.log("")
    console.log("⚙️  Tabelas não encontradas. Criando automaticamente...")
    const created = await createTablesAutomatically()
    
    if (!created) {
      console.error("")
      console.error("❌ Falha ao criar tabelas automaticamente!")
      return false
    }
    
    console.log("")
    console.log("✅ Tabelas criadas! Verificando novamente...")
    
    // Verificar novamente após criar
    return await verifyTablesExist()
  }
  
  return true
}

export default pool
