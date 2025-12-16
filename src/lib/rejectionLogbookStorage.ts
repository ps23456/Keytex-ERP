import {
  RejectionLogbookFormData,
} from './rejectionLogbookSchema'

export interface RejectionLogbookEntry extends RejectionLogbookFormData {
  id: string
  createdAt: string
  updatedAt?: string
}

const STORAGE_KEY = 'rejection_logbook_records'

export const loadRejectionLogbooks = (): RejectionLogbookEntry[] => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    return existing ? JSON.parse(existing) : []
  } catch (error) {
    console.error('Failed to load rejection logbook records:', error)
    return []
  }
}

export const getRejectionLogbookById = (id: string): RejectionLogbookEntry | null => {
  const entries = loadRejectionLogbooks()
  return entries.find((entry) => entry.id === id) || null
}

export const saveRejectionLogbook = (data: RejectionLogbookFormData): RejectionLogbookEntry => {
  const record: RejectionLogbookEntry = {
    ...data,
    id: `rl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }

  try {
    const existing = loadRejectionLogbooks()
    existing.unshift(record)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  } catch (error) {
    console.error('Failed to save rejection logbook record:', error)
  }

  return record
}

export const updateRejectionLogbook = (id: string, data: RejectionLogbookFormData): RejectionLogbookEntry[] => {
  try {
    const existing = loadRejectionLogbooks()
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
    console.error('Failed to update rejection logbook record:', error)
    return loadRejectionLogbooks()
  }
}

export const deleteRejectionLogbook = (id: string): RejectionLogbookEntry[] => {
  try {
    const existing = loadRejectionLogbooks()
    const filtered = existing.filter((record) => record.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return filtered
  } catch (error) {
    console.error('Failed to delete rejection logbook record:', error)
    return loadRejectionLogbooks()
  }
}








