export interface CLITTask {
  step: string // Cleaning, Lubrication, Inspection, Tightening
  task: string
  frequency: string // Daily, Weekly, Monthly
  methodImage?: string // Base64 image or URL
  shift: 'Day' | 'Night'
  dayTracking: Record<number, boolean> // Days 1-31
}

export interface CLITSheetFormData {
  month: string // Format: YYYY-MM
  machineName: string
  tasks: CLITTask[]
  operatorSignature?: string
  supervisorSignature?: string
  hodSignature?: string
}

export interface CLITSheetEntry extends CLITSheetFormData {
  id: string
  createdAt: string
  updatedAt?: string
}

const STORAGE_KEY = 'clit_sheet_records'

export const loadCLITSheets = (): CLITSheetEntry[] => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    return existing ? JSON.parse(existing) : []
  } catch (error) {
    console.error('Failed to load CLIT sheets:', error)
    return []
  }
}

export const getCLITSheetById = (id: string): CLITSheetEntry | null => {
  const entries = loadCLITSheets()
  return entries.find((entry) => entry.id === id) || null
}

export const saveCLITSheet = (data: CLITSheetFormData): CLITSheetEntry => {
  const record: CLITSheetEntry = {
    ...data,
    id: `clit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }

  try {
    const existing = loadCLITSheets()
    existing.unshift(record)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  } catch (error) {
    console.error('Failed to save CLIT sheet:', error)
  }

  return record
}

export const updateCLITSheet = (id: string, data: CLITSheetFormData): CLITSheetEntry[] => {
  try {
    const existing = loadCLITSheets()
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
    console.error('Failed to update CLIT sheet:', error)
    return loadCLITSheets()
  }
}

export const deleteCLITSheet = (id: string): CLITSheetEntry[] => {
  try {
    const existing = loadCLITSheets()
    const filtered = existing.filter((record) => record.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return filtered
  } catch (error) {
    console.error('Failed to delete CLIT sheet:', error)
    return loadCLITSheets()
  }
}

