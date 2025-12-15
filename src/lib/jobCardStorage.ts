import { JobCardFormData } from '../components/JobCardForm'

const STORAGE_KEY = 'job_card_records'

export interface SavedJobCard extends JobCardFormData {
  id: string
  createdAt: string
  updatedAt?: string
  customerName?: string
  contactPerson?: string
  contactPhone?: string
  partName?: string
  material?: string
  quantity?: string
}

export const loadJobCards = (): SavedJobCard[] => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    return existing ? JSON.parse(existing) : []
  } catch (error) {
    console.error('Failed to load job cards:', error)
    return []
  }
}

export const getJobCardById = (id: string): SavedJobCard | null => {
  const records = loadJobCards()
  return records.find((record) => record.id === id) || null
}

export const saveJobCard = (data: JobCardFormData): SavedJobCard => {
  const record: SavedJobCard = {
    ...data,
    id: `jobCard_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }

  try {
    const existing = loadJobCards()
    existing.unshift(record)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  } catch (error) {
    console.error('Failed to persist job card:', error)
  }

  return record
}

export const updateJobCard = (id: string, data: JobCardFormData): SavedJobCard[] => {
  try {
    const existing = loadJobCards()
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
    console.error('Failed to update job card:', error)
    return loadJobCards()
  }
}

export const deleteJobCard = (id: string): SavedJobCard[] => {
  try {
    const existing = loadJobCards()
    const filtered = existing.filter((record) => record.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return filtered
  } catch (error) {
    console.error('Failed to delete job card:', error)
    return loadJobCards()
  }
}

export const markQuotationInProduction = (quotationId: string) => {
  if (!quotationId) return
  try {
    const key = 'master_data_quotation'
    const existing = localStorage.getItem(key)
    if (!existing) return
    const parsed = JSON.parse(existing)
    let changed = false
    const updated = parsed.map((record: any) => {
      const recordId = record.id || record.quotation_id || record.quotationId
      if (String(recordId) === String(quotationId)) {
        changed = true
        return {
          ...record,
          status: 'In Production',
          updatedAt: new Date().toISOString(),
        }
      }
      return record
    })
    if (changed) {
      localStorage.setItem(key, JSON.stringify(updated))
    }
  } catch (error) {
    console.error('Failed to update quotation status:', error)
  }
}

