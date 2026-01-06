export interface SubcontractingItem {
  id: string
  particular: string
  quantity: number
  rate: string
}

export interface SubcontractingRecord {
  id: string
  date: string
  challanNo: string
  to: string
  mr: string
  items: SubcontractingItem[]
  receivedBy?: string
  mobileNo?: string
  authorisedSignature?: string
  createdAt: string
  updatedAt?: string
}

const STORAGE_KEY = 'subcontracting_records'

export function loadSubcontractingRecords(): SubcontractingRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading subcontracting records:', error)
    return []
  }
}

export function saveSubcontractingRecord(record: SubcontractingRecord): void {
  try {
    const records = loadSubcontractingRecords()
    const existingIndex = records.findIndex((r) => r.id === record.id)
    
    if (existingIndex >= 0) {
      records[existingIndex] = { ...record, updatedAt: new Date().toISOString() }
    } else {
      records.push(record)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch (error) {
    console.error('Error saving subcontracting record:', error)
    throw error
  }
}

export function deleteSubcontractingRecord(id: string): void {
  try {
    const records = loadSubcontractingRecords()
    const filtered = records.filter((record) => record.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Error deleting subcontracting record:', error)
    throw error
  }
}

export function getSubcontractingRecordById(id: string): SubcontractingRecord | null {
  const records = loadSubcontractingRecords()
  return records.find((record) => record.id === id) || null
}

