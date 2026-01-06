export type InventoryType = 'raw_material' | 'tool'
export type InventoryStatus = 'pending' | 'completed'

export interface InventoryItem {
  id: string
  type: InventoryType
  item: string
  materialGrade: string
  size: string
  unit: string
  availableStock: number
  minimumStock: number
  lastPurchase?: string
  status: InventoryStatus
  purchaseId?: string // Link to purchase record
  createdAt: string
  updatedAt?: string
}

const RAW_MATERIAL_STORAGE_KEY = 'raw_material_inventory'
const TOOL_STORAGE_KEY = 'tool_inventory'

export function loadInventoryItems(type: InventoryType, includePending: boolean = true): InventoryItem[] {
  try {
    const key = type === 'raw_material' ? RAW_MATERIAL_STORAGE_KEY : TOOL_STORAGE_KEY
    const data = localStorage.getItem(key)
    if (!data) return []
    const items: InventoryItem[] = JSON.parse(data)
    // If includePending is false, filter out pending items
    return includePending ? items : items.filter(item => item.status === 'completed')
  } catch (error) {
    console.error(`Error loading ${type} inventory:`, error)
    return []
  }
}

export function loadPendingItems(type: InventoryType): InventoryItem[] {
  try {
    const key = type === 'raw_material' ? RAW_MATERIAL_STORAGE_KEY : TOOL_STORAGE_KEY
    const data = localStorage.getItem(key)
    if (!data) return []
    const items: InventoryItem[] = JSON.parse(data)
    return items.filter(item => item.status === 'pending')
  } catch (error) {
    console.error(`Error loading pending ${type} inventory:`, error)
    return []
  }
}

export function saveInventoryItem(item: InventoryItem): void {
  try {
    const key = item.type === 'raw_material' ? RAW_MATERIAL_STORAGE_KEY : TOOL_STORAGE_KEY
    const items = loadInventoryItems(item.type)
    const existingIndex = items.findIndex((i) => i.id === item.id)
    
    if (existingIndex >= 0) {
      items[existingIndex] = { ...item, updatedAt: new Date().toISOString() }
    } else {
      items.push(item)
    }
    
    localStorage.setItem(key, JSON.stringify(items))
  } catch (error) {
    console.error(`Error saving ${item.type} inventory:`, error)
    throw error
  }
}

export function deleteInventoryItem(id: string, type: InventoryType): void {
  try {
    const key = type === 'raw_material' ? RAW_MATERIAL_STORAGE_KEY : TOOL_STORAGE_KEY
    const items = loadInventoryItems(type)
    const filtered = items.filter((item) => item.id !== id)
    localStorage.setItem(key, JSON.stringify(filtered))
  } catch (error) {
    console.error(`Error deleting ${type} inventory:`, error)
    throw error
  }
}

export function getInventoryItemById(id: string, type: InventoryType): InventoryItem | null {
  const items = loadInventoryItems(type)
  return items.find((item) => item.id === id) || null
}

// Function to update inventory from purchase
export function updateInventoryFromPurchase(
  itemName: string,
  purchaseType: string,
  date: string,
  purchaseId?: string,
  quantity?: number
): void {
  try {
    // Determine inventory type based on purchase type
    let inventoryType: InventoryType | null = null
    if (purchaseType.includes('RAW MATERIAL')) {
      inventoryType = 'raw_material'
    } else if (purchaseType.includes('TOOLS')) {
      inventoryType = 'tool'
    }

    if (!inventoryType) return

    const items = loadInventoryItems(inventoryType, true) // Include pending items
    
    // Try to find existing completed item by name (exact match)
    const existingCompletedItem = items.find(
      (item) => item.item.toLowerCase() === itemName.toLowerCase() && item.status === 'completed'
    )

    if (existingCompletedItem) {
      // Update existing completed item - add stock
      existingCompletedItem.availableStock = (existingCompletedItem.availableStock || 0) + (quantity || 1)
      existingCompletedItem.lastPurchase = date
      existingCompletedItem.updatedAt = new Date().toISOString()
      saveInventoryItem(existingCompletedItem)
    } else {
      // Create new pending item - needs details to be filled
      const newItem: InventoryItem = {
        id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: inventoryType,
        item: itemName,
        materialGrade: '',
        size: '',
        unit: '',
        availableStock: quantity || 1,
        minimumStock: 0,
        lastPurchase: date,
        status: 'pending',
        purchaseId: purchaseId,
        createdAt: new Date().toISOString(),
      }
      saveInventoryItem(newItem)
    }
  } catch (error) {
    console.error('Error updating inventory from purchase:', error)
  }
}

// Function to check if item is complete (has all required details)
export function isItemComplete(item: InventoryItem): boolean {
  return !!(
    item.item &&
    item.materialGrade &&
    item.status === 'completed'
  )
}

// Function to mark item as completed
export function markItemAsCompleted(item: InventoryItem): InventoryItem {
  return {
    ...item,
    status: 'completed',
    updatedAt: new Date().toISOString(),
  }
}

// Function to reduce inventory stock
export function reduceInventoryStock(itemId: string, quantity: number, type: InventoryType): boolean {
  try {
    const item = getInventoryItemById(itemId, type)
    if (!item) {
      console.error(`Inventory item not found: ${itemId}`)
      return false
    }

    if (item.availableStock < quantity) {
      console.error(`Insufficient stock. Available: ${item.availableStock}, Requested: ${quantity}`)
      return false
    }

    item.availableStock = item.availableStock - quantity
    item.updatedAt = new Date().toISOString()
    saveInventoryItem(item)
    return true
  } catch (error) {
    console.error('Error reducing inventory stock:', error)
    return false
  }
}

