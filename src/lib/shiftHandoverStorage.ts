import {
  ShiftHandoverFormData,
} from './shiftHandoverSchema'

export interface ShiftHandoverEntry extends ShiftHandoverFormData {
  id: string
  createdAt: string
  updatedAt?: string
}

const STORAGE_KEY = 'shift_handover_records'

export const loadShiftHandovers = (): ShiftHandoverEntry[] => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    return existing ? JSON.parse(existing) : []
  } catch (error) {
    console.error('Failed to load shift handover sheets:', error)
    return []
  }
}

export const getShiftHandoverById = (id: string): ShiftHandoverEntry | null => {
  const entries = loadShiftHandovers()
  return entries.find((entry) => entry.id === id) || null
}

export const saveShiftHandover = (data: ShiftHandoverFormData): ShiftHandoverEntry => {
  const record: ShiftHandoverEntry = {
    ...data,
    id: `sh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }

  try {
    const existing = loadShiftHandovers()
    existing.unshift(record)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  } catch (error) {
    console.error('Failed to save shift handover sheet:', error)
  }

  return record
}

export const updateShiftHandover = (id: string, data: ShiftHandoverFormData): ShiftHandoverEntry[] => {
  try {
    const existing = loadShiftHandovers()
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
    console.error('Failed to update shift handover sheet:', error)
    return loadShiftHandovers()
  }
}

export const deleteShiftHandover = (id: string): ShiftHandoverEntry[] => {
  try {
    const existing = loadShiftHandovers()
    const filtered = existing.filter((record) => record.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return filtered
  } catch (error) {
    console.error('Failed to delete shift handover sheet:', error)
    return loadShiftHandovers()
  }
}







