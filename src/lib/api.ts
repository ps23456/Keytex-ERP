export interface MasterRecord {
  [key: string]: any
}

// Helper to get or initialize data from localStorage
const getMasterData = (masterKey: string): MasterRecord[] => {
  const key = `master_data_${masterKey}`
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
}

// Helper to save data to localStorage
const saveMasterData = (masterKey: string, data: MasterRecord[]): void => {
  const key = `master_data_${masterKey}`
  localStorage.setItem(key, JSON.stringify(data))
}

export const masterApi = {
  // Generic CRUD operations using localStorage
  getAll: async (masterKey: string): Promise<MasterRecord[]> => {
    console.log(`🔍 Mock API: Fetching all records for ${masterKey}`)
    const data = getMasterData(masterKey)
    console.log(`✅ Mock API: Successfully fetched ${masterKey} data:`, data)
    return data
  },

  getById: async (masterKey: string, id: string): Promise<MasterRecord> => {
    const data = getMasterData(masterKey)
    const record = data.find((r: MasterRecord) => {
      // Try common ID field names
      return r.id === id || r[`${masterKey}_id`] === id || r[`${masterKey}Id`] === id
    })
    if (!record) {
      throw new Error(`Record not found with id: ${id}`)
    }
    return record
  },

  create: async (masterKey: string, data: MasterRecord): Promise<MasterRecord> => {
    console.log(`🔄 Mock API: Creating ${masterKey} record:`, data)
    const records = getMasterData(masterKey)
    
    // Generate a unique ID if not provided
    const idField = `${masterKey}_id`
    if (!data[idField] && !data.id) {
      data[idField] = `${masterKey}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    records.push(data)
    saveMasterData(masterKey, records)
    console.log(`✅ Mock API: Successfully created ${masterKey} record:`, data)
    return data
  },

  update: async (masterKey: string, id: string, data: MasterRecord): Promise<MasterRecord> => {
    console.log(`🔄 Mock API: Updating ${masterKey} record:`, { id, data })
    const records = getMasterData(masterKey)
    const idField = `${masterKey}_id`
    
    const index = records.findIndex((r: MasterRecord) => {
      return r.id === id || r[idField] === id || r[`${masterKey}Id`] === id
    })
    
    if (index === -1) {
      throw new Error(`Record not found with id: ${id}`)
    }
    
    records[index] = { ...records[index], ...data }
    saveMasterData(masterKey, records)
    
    const updated = records[index]
    console.log(`✅ Mock API: Successfully updated ${masterKey} record:`, updated)
    return updated
  },

  delete: async (masterKey: string, id: string): Promise<void> => {
    console.log(`🔄 Mock API: Deleting ${masterKey} record:`, { id })
    const records = getMasterData(masterKey)
    const idField = `${masterKey}_id`
    
    const filtered = records.filter((r: MasterRecord) => {
      return r.id !== id && r[idField] !== id && r[`${masterKey}Id`] !== id
    })
    
    if (filtered.length === records.length) {
      throw new Error(`Record not found with id: ${id}`)
    }
    
    saveMasterData(masterKey, filtered)
    console.log(`✅ Mock API: Successfully deleted ${masterKey} record:`, id)
  },

  // Get options for relation fields
  getOptions: async (relationKey: string): Promise<MasterRecord[]> => {
    try {
      return getMasterData(relationKey)
    } catch (error) {
      console.error(`❌ Mock API: Error fetching ${relationKey} options:`, error)
      return []
    }
  }
}