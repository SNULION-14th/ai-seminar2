export const toDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const fromDateKey = (key: string) => {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export const addDays = (date: Date, amount: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export const uid = () => crypto.randomUUID()

export const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
