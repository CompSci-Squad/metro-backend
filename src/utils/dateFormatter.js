// Converte data do formato DD-MM-YYYY para YYYY-MM-DD (formato do banco)
export const parseDateToDB = (dateString) => {
  if (!dateString) return null

  // Se já está no formato correto do banco (YYYY-MM-DD), retorna como está
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString
  }

  // Converte DD-MM-YYYY para YYYY-MM-DD
  const [day, month, year] = dateString.split("-")
  return `${year}-${month}-${day}`
}

// Converte data do formato YYYY-MM-DD (banco) para DD-MM-YYYY
export const formatDateFromDB = (dateString) => {
  if (!dateString) return null

  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()

  return `${day}-${month}-${year}`
}

// Formata timestamp completo para DD-MM-YYYY HH:mm:ss
export const formatTimestampFromDB = (timestamp) => {
  if (!timestamp) return null

  const date = new Date(timestamp)
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`
}

// Formata objeto com datas
export const formatDatesInObject = (obj) => {
  const formatted = { ...obj }

  // Campos de data simples
  if (formatted.data_inicio) formatted.data_inicio = formatDateFromDB(formatted.data_inicio)
  if (formatted.previsao_termino) formatted.previsao_termino = formatDateFromDB(formatted.previsao_termino)
  if (formatted.data_foto) formatted.data_foto = formatDateFromDB(formatted.data_foto)

  // Campos de timestamp
  if (formatted.created_at) formatted.created_at = formatTimestampFromDB(formatted.created_at)
  if (formatted.updated_at) formatted.updated_at = formatTimestampFromDB(formatted.updated_at)

  return formatted
}
