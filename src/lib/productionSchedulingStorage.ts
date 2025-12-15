import {
  ProductionSchedulingFormData,
  calculateSchedulingMetrics,
} from './productionSchedulingSchema'

export interface ProductionSchedulingEntry extends ProductionSchedulingFormData {
  id: string
  createdAt: string
  updatedAt?: string
  balanceQty: number
  totalSettingTimeHour: number
  totalCycleTimeMinutes: number
  timePerPieceHour: number
  targetTimeHour: number
}

const STORAGE_KEY = 'production_scheduling_records'

export const loadProductionSchedules = (): ProductionSchedulingEntry[] => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    return existing ? JSON.parse(existing) : []
  } catch (error) {
    console.error('Failed to load production scheduling sheets:', error)
    return []
  }
}

export const getProductionScheduleById = (id: string): ProductionSchedulingEntry | null => {
  const entries = loadProductionSchedules()
  return entries.find((entry) => entry.id === id) || null
}

export const saveProductionSchedule = (data: ProductionSchedulingFormData): ProductionSchedulingEntry => {
  const metrics = calculateSchedulingMetrics(data)
  const record: ProductionSchedulingEntry = {
    ...data,
    ...metrics,
    id: `psheet_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }

  try {
    const existing = loadProductionSchedules()
    existing.unshift(record)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  } catch (error) {
    console.error('Failed to save production scheduling sheet:', error)
  }

  return record
}

export const updateProductionSchedule = (
  id: string,
  data: ProductionSchedulingFormData
): ProductionSchedulingEntry[] => {
  try {
    const existing = loadProductionSchedules()
    const metrics = calculateSchedulingMetrics(data)

    const updated = existing.map((record) =>
      record.id === id
        ? {
            ...record,
            ...data,
            ...metrics,
            id,
            createdAt: record.createdAt,
            updatedAt: new Date().toISOString(),
          }
        : record
    )

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (error) {
    console.error('Failed to update production scheduling sheet:', error)
    return loadProductionSchedules()
  }
}

export const deleteProductionSchedule = (id: string): ProductionSchedulingEntry[] => {
  try {
    const existing = loadProductionSchedules()
    const filtered = existing.filter((record) => record.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return filtered
  } catch (error) {
    console.error('Failed to delete production scheduling sheet:', error)
    return loadProductionSchedules()
  }
}


