import { ProductionLogFormData } from '../components/ProductionLogbookForm'

export interface ProductionLogEntry extends ProductionLogFormData {
  id: string
  createdAt: string
  updatedAt?: string
}

const STORAGE_KEY = 'production_logbook_records'

export const loadProductionLogs = (): ProductionLogEntry[] => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    return existing ? JSON.parse(existing) : []
  } catch (error) {
    console.error('Failed to load production logs:', error)
    return []
  }
}

export const getProductionLogById = (id: string): ProductionLogEntry | null => {
  const entries = loadProductionLogs()
  return entries.find((entry) => entry.id === id) || null
}

export const saveProductionLog = (data: ProductionLogFormData): ProductionLogEntry => {
  const record: ProductionLogEntry = {
    ...data,
    id: `plog_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }

  try {
    const existing = loadProductionLogs()
    existing.unshift(record)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  } catch (error) {
    console.error('Failed to save production log:', error)
  }

  return record
}

export const updateProductionLog = (id: string, data: ProductionLogFormData): ProductionLogEntry[] => {
  try {
    const existing = loadProductionLogs()
    const updated = existing.map((record) =>
      record.id === id
        ? {
            ...record,
            ...data,
            id,
            createdAt: record.createdAt,
            updatedAt: new Date().toISOString(),
          }
        : record
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (error) {
    console.error('Failed to update production log:', error)
    return loadProductionLogs()
  }
}

export const deleteProductionLog = (id: string): ProductionLogEntry[] => {
  try {
    const existing = loadProductionLogs()
    const filtered = existing.filter((record) => record.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return filtered
  } catch (error) {
    console.error('Failed to delete production log:', error)
    return loadProductionLogs()
  }
}

