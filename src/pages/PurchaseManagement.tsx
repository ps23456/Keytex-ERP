import { useState, useMemo } from 'react'
import MainLayout from '../layouts/MainLayout'
import { useMasters } from '../hooks/useMasters'
import SlideOver from '../components/SlideOver'
import PurchaseForm, { PurchaseFormData } from '../components/PurchaseForm'
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
import { Plus, Edit, Trash2, Search, ShoppingCart } from 'lucide-react'
import { updateInventoryFromPurchase } from '../lib/inventoryStorage'

const PURCHASE_TYPES = [
  'TOOLS PURCHASE A/C',
  'RAW MATERIAL PURCHASE A/C',
  'SERVICES PURCHASE A/C',
  'MACHINERY PURCHASE A/C',
  'OTHER PURCHASE A/C',
]

export default function PurchaseManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [purchaseTypeFilter, setPurchaseTypeFilter] = useState<string>('all')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    records,
    isLoading,
    createRecord,
    updateRecord,
    deleteRecord,
    isCreating,
    isUpdating,
  } = useMasters('purchase')

  const formatDate = (date: any) => {
    if (!date) return '-'
    try {
      const d = new Date(date)
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return date
    }
  }

  const formatCurrency = (value: any) => {
    if (!value) return '0.00'
    const num = parseFloat(value)
    return isNaN(num) ? '0.00' : num.toFixed(2)
  }

  const getPurchaseTypeColor = (type: string) => {
    const typeLower = type?.toLowerCase() || ''
    if (typeLower.includes('tools')) return 'bg-blue-100 text-blue-800'
    if (typeLower.includes('raw material')) return 'bg-emerald-100 text-emerald-800'
    if (typeLower.includes('services')) return 'bg-purple-100 text-purple-800'
    if (typeLower.includes('machinery')) return 'bg-orange-100 text-orange-800'
    return 'bg-gray-100 text-gray-800'
  }

  const filteredRecords = useMemo(() => {
    return (records || []).filter((record: any) => {
      // Purchase type filter
      if (purchaseTypeFilter !== 'all' && record.purchaseType !== purchaseTypeFilter) {
        return false
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesSearch = (
          (record.itemName || '').toLowerCase().includes(search) ||
          (record.purchaseType || '').toLowerCase().includes(search) ||
          (record.reasonForPurchase || '').toLowerCase().includes(search) ||
          (record.clientName || '').toLowerCase().includes(search) ||
          (record.billingAddress || '').toLowerCase().includes(search) ||
          formatDate(record.date).includes(search)
        )
        if (!matchesSearch) return false
      }

      return true
    })
  }, [records, purchaseTypeFilter, searchTerm])

  // Calculate totals grouped by purchase type
  const purchaseTypeTotals = useMemo(() => {
    const totals: Record<string, { amount: number; sgst: number; cgst: number; igst: number; total: number }> = {}
    
    filteredRecords.forEach((record: any) => {
      const type = record.purchaseType || 'OTHER PURCHASE A/C'
      if (!totals[type]) {
        totals[type] = { amount: 0, sgst: 0, cgst: 0, igst: 0, total: 0 }
      }
      totals[type].amount += parseFloat(record.amount || '0') || 0
      totals[type].sgst += parseFloat(record.sgstAmount || '0') || 0
      totals[type].cgst += parseFloat(record.cgstAmount || '0') || 0
      totals[type].igst += parseFloat(record.igstAmount || '0') || 0
      totals[type].total += parseFloat(record.total || '0') || 0
    })

    return totals
  }, [filteredRecords])

  const handleAdd = () => {
    setEditingRecord(null)
    setIsFormOpen(true)
  }

  const handleEdit = (record: any) => {
    setEditingRecord(record)
    setIsFormOpen(true)
  }

  const handleDelete = async (record: any) => {
    if (window.confirm('Are you sure you want to delete this purchase entry?')) {
      try {
        const recordId = record.id || record.purchase_id
        await deleteRecord(String(recordId))
        setSuccessMessage('Purchase entry deleted successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
      } catch (error) {
        alert('Failed to delete purchase entry')
      }
    }
  }

  const handleFormSubmit = async (data: PurchaseFormData & { total: number }) => {
    try {
      const submitData = {
        ...data,
        createdAt: new Date().toISOString(),
      }
      if (editingRecord) {
        const recordId = editingRecord.id || editingRecord.purchase_id
        await updateRecord({ id: String(recordId), data: submitData })
        setSuccessMessage('Purchase updated successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        const createdRecord = await createRecord(submitData)
        setSuccessMessage('Purchase created successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
        
        // Update inventory if it's a raw material or tool purchase
        if (data.purchaseType && (data.purchaseType.includes('RAW MATERIAL') || data.purchaseType.includes('TOOLS'))) {
          const purchaseId = createdRecord.id || createdRecord.purchase_id || String(createdRecord.purchase_id)
          updateInventoryFromPurchase(
            data.itemName,
            data.purchaseType,
            data.date,
            purchaseId
          )
        }
      }
      setIsFormOpen(false)
      setEditingRecord(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to save purchase: ${errorMessage}`)
    }
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingRecord(null)
  }

  // Group records by purchase type for display
  const groupedRecords = useMemo(() => {
    const groups: Record<string, any[]> = {}
    filteredRecords.forEach((record: any) => {
      const type = record.purchaseType || 'OTHER PURCHASE A/C'
      if (!groups[type]) {
        groups[type] = []
      }
      groups[type].push(record)
    })
    return groups
  }, [filteredRecords])

  return (
    <MainLayout>
      <div className="space-y-6">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Purchase Management</h1>
          <p className="text-gray-600 mt-1">Manage purchase entries and transactions</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Purchase Register</h2>
                <p className="text-gray-600">View and manage all purchase entries</p>
              </div>
              <Button onClick={handleAdd} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>New Purchase</span>
              </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by item name, purchase type, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={purchaseTypeFilter} onValueChange={setPurchaseTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by purchase type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Purchase Types</SelectItem>
                    {PURCHASE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading purchases...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No purchase entries found</p>
                <Button onClick={handleAdd} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Purchase
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedRecords).map(([purchaseType, typeRecords]) => (
                  <div key={purchaseType} className="space-y-4">
                    {/* Purchase Type Header */}
                    <div className="flex items-center justify-between pb-2 border-b-2 border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">{purchaseType}</h3>
                      {purchaseTypeTotals[purchaseType] && (
                        <div className="text-sm text-gray-600">
                          Total: ₹{purchaseTypeTotals[purchaseType].total.toFixed(2)}
                        </div>
                      )}
                    </div>

                    {/* Table */}
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Client Name</TableHead>
                            <TableHead>Billing Address</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">SGST</TableHead>
                            <TableHead className="text-right">CGST</TableHead>
                            <TableHead className="text-right">IGST</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead className="w-32">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {typeRecords.map((record: any, index: number) => {
                            const total = parseFloat(record.total || '0') || 
                              (parseFloat(record.amount || '0') + 
                               parseFloat(record.sgstAmount || '0') + 
                               parseFloat(record.cgstAmount || '0') + 
                               parseFloat(record.igstAmount || '0'))
                            return (
                              <TableRow key={record.id || record.purchase_id || index}>
                                <TableCell>{formatDate(record.date)}</TableCell>
                                <TableCell className="font-medium">{record.itemName || '-'}</TableCell>
                                <TableCell>{record.clientName || '-'}</TableCell>
                                <TableCell className="max-w-xs truncate" title={record.billingAddress}>
                                  {record.billingAddress || '-'}
                                </TableCell>
                                <TableCell className="text-right">₹{formatCurrency(record.amount)}</TableCell>
                                <TableCell className="text-right">₹{formatCurrency(record.sgstAmount)}</TableCell>
                                <TableCell className="text-right">₹{formatCurrency(record.cgstAmount)}</TableCell>
                                <TableCell className="text-right">₹{formatCurrency(record.igstAmount)}</TableCell>
                                <TableCell className="text-right font-semibold">₹{formatCurrency(record.total || total)}</TableCell>
                                <TableCell className="max-w-xs truncate" title={record.reasonForPurchase}>
                                  {record.reasonForPurchase || '-'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(record)}
                                      className="h-8 w-8"
                                      title="Edit"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDelete(record)}
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

                    {/* Purchase Type Totals */}
                    {purchaseTypeTotals[purchaseType] && (
                      <Card className="bg-gray-50">
                        <div className="p-4">
                          <div className="grid grid-cols-6 gap-4 text-sm">
                            <div className="col-span-2">
                              <span className="font-semibold text-gray-700">MONTH TOTAL:</span>
                            </div>
                            <div className="text-right">
                              <span className="text-gray-600">Amount: </span>
                              <span className="font-semibold">₹{purchaseTypeTotals[purchaseType].amount.toFixed(2)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-gray-600">SGST: </span>
                              <span className="font-semibold">₹{purchaseTypeTotals[purchaseType].sgst.toFixed(2)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-gray-600">CGST: </span>
                              <span className="font-semibold">₹{purchaseTypeTotals[purchaseType].cgst.toFixed(2)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-gray-600">IGST: </span>
                              <span className="font-semibold">₹{purchaseTypeTotals[purchaseType].igst.toFixed(2)}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="font-semibold text-gray-700">HEAD TOTAL:</span>
                            </div>
                            <div className="text-right">
                              <span className="text-gray-600">Amount: </span>
                              <span className="font-semibold">₹{purchaseTypeTotals[purchaseType].amount.toFixed(2)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-gray-600">SGST: </span>
                              <span className="font-semibold">₹{purchaseTypeTotals[purchaseType].sgst.toFixed(2)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-gray-600">CGST: </span>
                              <span className="font-semibold">₹{purchaseTypeTotals[purchaseType].cgst.toFixed(2)}</span>
                            </div>
                            <div className="text-right col-span-2">
                              <span className="text-gray-700 font-semibold text-base">Total: ₹{purchaseTypeTotals[purchaseType].total.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <SlideOver
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          title={editingRecord ? 'Edit Purchase' : 'Add New Purchase'}
          description={editingRecord ? 'Update the purchase entry' : 'Fill in the details to create a new purchase entry'}
        >
          <PurchaseForm
            initialData={editingRecord || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isCreating || isUpdating}
          />
        </SlideOver>
      </div>
    </MainLayout>
  )
}

