
export const parseDateToDB = (dateString) => {
  if (!dateString) return null


  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString
  }

  const [day, month, year] = dateString.split("-")
  return `${year}-${month}-${day}`
}

export const formatDateFromDB = (dateString) => {
  if (!dateString) return null

  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()

  return `${day}-${month}-${year}`
}

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

export const formatDatesInObject = (obj) => {
  const formatted = { ...obj }

  if (formatted.data_inicio) formatted.data_inicio = formatDateFromDB(formatted.data_inicio)
  if (formatted.previsao_termino) formatted.previsao_termino = formatDateFromDB(formatted.previsao_termino)
  if (formatted.data_foto) formatted.data_foto = formatDateFromDB(formatted.data_foto)

  if (formatted.created_at) formatted.created_at = formatTimestampFromDB(formatted.created_at)
  if (formatted.updated_at) formatted.updated_at = formatTimestampFromDB(formatted.updated_at)

  return formatted
}
