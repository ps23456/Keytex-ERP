import { useState, useMemo, useEffect } from 'react'
import MainLayout from '../layouts/MainLayout'
import SlideOver from '../components/SlideOver'
import InventoryForm, { InventoryFormData } from '../components/InventoryForm'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { Card } from '../components/ui/card'
import { Plus, Edit, Trash2, Search, Filter, Package, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  InventoryType,
  InventoryItem,
  loadInventoryItems,
  loadPendingItems,
  saveInventoryItem,
  deleteInventoryItem,
  markItemAsCompleted,
} from '../lib/inventoryStorage'
import { useMasters } from '../hooks/useMasters'

export default function InventoryManagement() {
  const [activeTab, setActiveTab] = useState<InventoryType>('raw_material')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<InventoryItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [materialGradeFilter, setMaterialGradeFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [pendingItems, setPendingItems] = useState<InventoryItem[]>([])
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [hasShownLowStockAlert, setHasShownLowStockAlert] = useState(false)

  // Load purchase records to get client names
  const { records: purchaseRecords } = useMasters('purchase')

  // Create a map of purchaseId to clientName
  const purchaseClientMap = useMemo(() => {
    const map = new Map<string, string>()
    purchaseRecords?.forEach((record: any) => {
      const purchaseId = record.id || record.purchase_id
      if (purchaseId && record.clientName) {
        map.set(String(purchaseId), record.clientName)
      }
    })
    return map
  }, [purchaseRecords])

  // Load inventory items when tab changes
  useEffect(() => {
    // Load only completed items for main display
    const items = loadInventoryItems(activeTab, false) // false = exclude pending
    setInventoryItems(items)
    // Load pending items separately
    const pending = loadPendingItems(activeTab)
    setPendingItems(pending)
    // Reset low stock alert flag when tab changes
    setHasShownLowStockAlert(false)
  }, [activeTab])

  const formatDate = (date: string | undefined) => {
    if (!date) return '-'
    try {
      const d = new Date(date)
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return date
    }
  }

  // Get unique material grades for filter
  const materialGrades = useMemo(() => {
    const grades = new Set<string>()
    inventoryItems.forEach((item) => {
      if (item.materialGrade) {
        grades.add(item.materialGrade)
      }
    })
    return Array.from(grades).sort()
  }, [inventoryItems])

  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      // Material grade filter
      if (materialGradeFilter !== 'all' && item.materialGrade !== materialGradeFilter) {
        return false
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesSearch = (
          (item.item || '').toLowerCase().includes(search) ||
          (item.materialGrade || '').toLowerCase().includes(search) ||
          (item.size || '').toLowerCase().includes(search) ||
          (item.unit || '').toLowerCase().includes(search)
        )
        if (!matchesSearch) return false
      }

      return true
    })
  }, [inventoryItems, materialGradeFilter, searchTerm])

  const handleAdd = () => {
    setEditingRecord(null)
    setIsFormOpen(true)
  }

  const handleEdit = (record: InventoryItem) => {
    setEditingRecord(record)
    setIsFormOpen(true)
  }

  const handleDelete = (record: InventoryItem) => {
    if (window.confirm(`Are you sure you want to delete ${record.item}?`)) {
      try {
        deleteInventoryItem(record.id, record.type)
        // Reload both completed and pending items
        const items = loadInventoryItems(activeTab, false) // Only completed
        setInventoryItems(items)
        const pending = loadPendingItems(activeTab)
        setPendingItems(pending)
        setSuccessMessage('Inventory item deleted successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
      } catch (error) {
        alert('Failed to delete inventory item')
      }
    }
  }

  const handleFormSubmit = async (data: InventoryFormData) => {
    try {
      const isEditingPending = editingRecord?.status === 'pending'
      
      const item: InventoryItem = {
        id: editingRecord?.id || `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: activeTab,
        item: data.item,
        materialGrade: data.materialGrade,
        size: data.size || '',
        unit: data.unit || '',
        availableStock: parseFloat(data.availableStock) || 0,
        minimumStock: parseFloat(data.minimumStock || '0') || 0,
        lastPurchase: data.lastPurchase || undefined,
        status: 'completed', // Mark as completed when all details are filled
        purchaseId: editingRecord?.purchaseId,
        createdAt: editingRecord?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      saveInventoryItem(item)
      
      // Reload both completed and pending items
      const items = loadInventoryItems(activeTab, false) // Only completed
      setInventoryItems(items)
      const pending = loadPendingItems(activeTab)
      setPendingItems(pending)
      
      // Check if saved item is now below minimum stock and show alert
      if (item.minimumStock > 0 && item.availableStock <= item.minimumStock) {
        const alertMessage = `⚠️ Low Stock Alert!\n\nItem "${item.item}" is now below minimum stock level.\nAvailable: ${item.availableStock}\nMinimum: ${item.minimumStock}\n\nPlease restock this item.`
        alert(alertMessage)
      }
      
      setSuccessMessage(
        isEditingPending 
          ? 'Inventory item completed and added to inventory!' 
          : editingRecord 
            ? 'Inventory item updated successfully!' 
            : 'Inventory item added successfully!'
      )
      setTimeout(() => setSuccessMessage(null), 3000)
      setIsFormOpen(false)
      setEditingRecord(null)
    } catch (error) {
      alert('Failed to save inventory item')
    }
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingRecord(null)
  }

  // Check for low stock items
  const lowStockItems = useMemo(() => {
    return filteredItems.filter((item) => {
      return item.minimumStock > 0 && item.availableStock <= item.minimumStock
    })
  }, [filteredItems])

  // Show alert when low stock items are detected on page load/tab change
  useEffect(() => {
    if (lowStockItems.length > 0 && !hasShownLowStockAlert && inventoryItems.length > 0) {
      const itemDetails = lowStockItems.map(item => `${item.item} (Available: ${item.availableStock}, Minimum: ${item.minimumStock})`).join('\n')
      const alertMessage = `⚠️ Low Stock Alert!\n\n${lowStockItems.length} item(s) are below minimum stock level:\n\n${itemDetails}\n\nPlease restock these items.`
      alert(alertMessage)
      setHasShownLowStockAlert(true)
    } else if (lowStockItems.length === 0) {
      // Reset alert flag when no low stock items
      setHasShownLowStockAlert(false)
    }
  }, [lowStockItems, hasShownLowStockAlert, inventoryItems.length])

  return (
    <MainLayout>
      <div className="space-y-6">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Manage raw material and tool inventory</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('raw_material')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'raw_material'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Raw Material Inventory
              </button>
              <button
                onClick={() => setActiveTab('tool')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'tool'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tool Inventory
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {activeTab === 'raw_material' ? 'Raw Material Inventory List' : 'Tool Inventory List'}
                </h2>
                <p className="text-gray-600">View and manage inventory items</p>
              </div>
              <Button onClick={handleAdd} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Inventory</span>
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by item, material grade, size..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </Button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <Card className="mb-6 p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFilters(false)}
                    className="h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Material Grade</label>
                    <Select value={materialGradeFilter} onValueChange={setMaterialGradeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Material Grades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Material Grades</SelectItem>
                        {materialGrades.map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            )}

            {/* Pending Items Section */}
            {pendingItems.length > 0 && (
              <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-orange-900">
                      Pending Items ({pendingItems.length})
                    </h3>
                  </div>
                  <p className="text-sm text-orange-700">
                    Complete these items to add them to inventory
                  </p>
                </div>
                <div className="rounded-md border border-orange-200 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-orange-50">
                        <TableHead>Item</TableHead>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Available Stock</TableHead>
                        <TableHead>Last Purchase</TableHead>
                        <TableHead className="w-32">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingItems.map((item) => {
                        const clientName = item.purchaseId ? purchaseClientMap.get(String(item.purchaseId)) : undefined
                        return (
                        <TableRow key={item.id} className="bg-orange-50/50">
                          <TableCell className="font-medium">{item.item}</TableCell>
                          <TableCell>{clientName || '-'}</TableCell>
                          <TableCell>{item.availableStock}</TableCell>
                          <TableCell>{formatDate(item.lastPurchase)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              className="flex items-center space-x-1"
                            >
                              <Edit className="h-3 w-3" />
                              <span>Complete</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Low Stock Warning */}
            {lowStockItems.length > 0 && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span className="font-semibold">
                    Warning: {lowStockItems.length} item(s) are at or below minimum stock level
                  </span>
                </div>
              </div>
            )}

            {/* Table */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No inventory items found</p>
                <Button onClick={handleAdd} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">SR NO</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Material Grade</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Available Stock</TableHead>
                      <TableHead className="text-right">Minimum Stock</TableHead>
                      <TableHead>Last Purchase</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item, index) => {
                      const isLowStock = item.minimumStock > 0 && item.availableStock <= item.minimumStock
                      const clientName = item.purchaseId ? purchaseClientMap.get(String(item.purchaseId)) : undefined
                      return (
                        <TableRow 
                          key={item.id}
                          className={isLowStock ? 'bg-yellow-50' : ''}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{item.item}</TableCell>
                          <TableCell>{clientName || '-'}</TableCell>
                          <TableCell>{item.materialGrade}</TableCell>
                          <TableCell>{item.size || '-'}</TableCell>
                          <TableCell>{item.unit || '-'}</TableCell>
                          <TableCell className={`text-right font-semibold ${isLowStock ? 'text-red-600' : ''}`}>
                            {item.availableStock}
                          </TableCell>
                          <TableCell className="text-right">{item.minimumStock || '-'}</TableCell>
                          <TableCell>{formatDate(item.lastPurchase)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(item)}
                                className="h-8 w-8"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(item)}
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <SlideOver
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          title={
            editingRecord?.status === 'pending'
              ? 'Complete Inventory Item'
              : editingRecord
              ? 'Edit Inventory Item'
              : 'Add New Inventory Item'
          }
          description={
            editingRecord?.status === 'pending'
              ? 'Fill in all the details to complete this inventory item and add it to inventory'
              : editingRecord
              ? 'Update the inventory item details'
              : 'Fill in the details to add a new inventory item'
          }
        >
          <InventoryForm
            type={activeTab}
            initialData={editingRecord ? {
              item: editingRecord.item,
              materialGrade: editingRecord.materialGrade,
              size: editingRecord.size,
              unit: editingRecord.unit,
              availableStock: editingRecord.availableStock.toString(),
              minimumStock: editingRecord.minimumStock.toString(),
              lastPurchase: editingRecord.lastPurchase,
            } : undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={false}
          />
        </SlideOver>
      </div>
    </MainLayout>
  )
}

