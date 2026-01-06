import { useState, useMemo, useEffect } from 'react'
import MainLayout from '../layouts/MainLayout'
import SlideOver from '../components/SlideOver'
import SubcontractingForm, { SubcontractingFormData } from '../components/SubcontractingForm'
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
import { Plus, Edit, Trash2, Search, Filter, Truck, X } from 'lucide-react'
import {
  SubcontractingRecord,
  loadSubcontractingRecords,
  saveSubcontractingRecord,
  deleteSubcontractingRecord,
} from '../lib/subcontractingStorage'

export default function SubcontractingManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<SubcontractingRecord | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [challanNoFilter, setChallanNoFilter] = useState('')
  const [records, setRecords] = useState<SubcontractingRecord[]>([])
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Load records
  useEffect(() => {
    const loadedRecords = loadSubcontractingRecords()
    setRecords(loadedRecords)
  }, [])

  const formatDate = (date: string | undefined) => {
    if (!date) return '-'
    try {
      const d = new Date(date)
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return date
    }
  }

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // Date range filter
      if (dateFromFilter) {
        const recordDate = new Date(record.date)
        const fromDate = new Date(dateFromFilter)
        if (recordDate < fromDate) return false
      }
      if (dateToFilter) {
        const recordDate = new Date(record.date)
        const toDate = new Date(dateToFilter)
        toDate.setHours(23, 59, 59, 999) // Include entire end date
        if (recordDate > toDate) return false
      }

      // Challan No filter
      if (challanNoFilter && !record.challanNo.toLowerCase().includes(challanNoFilter.toLowerCase())) {
        return false
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesSearch = (
          (record.challanNo || '').toLowerCase().includes(search) ||
          (record.to || '').toLowerCase().includes(search) ||
          (record.mr || '').toLowerCase().includes(search) ||
          record.items.some(item => item.particular.toLowerCase().includes(search))
        )
        if (!matchesSearch) return false
      }

      return true
    })
  }, [records, dateFromFilter, dateToFilter, challanNoFilter, searchTerm])

  const handleAdd = () => {
    setEditingRecord(null)
    setIsFormOpen(true)
  }

  const handleEdit = (record: SubcontractingRecord) => {
    setEditingRecord(record)
    setIsFormOpen(true)
  }

  const handleDelete = (record: SubcontractingRecord) => {
    if (window.confirm(`Are you sure you want to delete Challan No: ${record.challanNo}?`)) {
      try {
        deleteSubcontractingRecord(record.id)
        const loadedRecords = loadSubcontractingRecords()
        setRecords(loadedRecords)
        setSuccessMessage('Subcontracting record deleted successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
      } catch (error) {
        alert('Failed to delete subcontracting record')
      }
    }
  }

  const handleFormSubmit = async (data: SubcontractingFormData) => {
    try {
      const record: SubcontractingRecord = {
        id: editingRecord?.id || `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        date: data.date,
        challanNo: data.challanNo,
        to: data.to,
        mr: data.mr,
        items: data.items.map(item => ({
          id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          particular: item.particular,
          quantity: parseFloat(item.quantity) || 0,
          rate: item.rate || '',
        })),
        receivedBy: data.receivedBy,
        mobileNo: data.mobileNo,
        authorisedSignature: data.authorisedSignature,
        createdAt: editingRecord?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      saveSubcontractingRecord(record)
      const loadedRecords = loadSubcontractingRecords()
      setRecords(loadedRecords)
      setSuccessMessage(editingRecord ? 'Subcontracting record updated successfully!' : 'Subcontracting record added successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
      setIsFormOpen(false)
      setEditingRecord(null)
    } catch (error) {
      alert('Failed to save subcontracting record')
    }
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingRecord(null)
  }

  const clearFilters = () => {
    setDateFromFilter('')
    setDateToFilter('')
    setChallanNoFilter('')
    setSearchTerm('')
  }

  const hasActiveFilters = dateFromFilter || dateToFilter || challanNoFilter || searchTerm

  return (
    <MainLayout>
      <div className="space-y-6">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Subcontracting Management</h1>
          <p className="text-gray-600 mt-1">Manage delivery challans and subcontracting records</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Delivery Challan Records</h2>
                <p className="text-gray-600">View and manage all subcontracting delivery challans</p>
              </div>
              <Button onClick={handleAdd} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add New Subcontracting</span>
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by challan no, recipient, contact person, or item..."
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
                <span>More Filters</span>
              </Button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <Card className="mb-6 p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                  <div className="flex items-center space-x-2">
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-xs"
                      >
                        Clear All
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowFilters(false)}
                      className="h-6 w-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Date From</label>
                    <Input
                      type="date"
                      value={dateFromFilter}
                      onChange={(e) => setDateFromFilter(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Date To</label>
                    <Input
                      type="date"
                      value={dateToFilter}
                      onChange={(e) => setDateToFilter(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Challan No</label>
                    <Input
                      placeholder="Filter by challan number"
                      value={challanNoFilter}
                      onChange={(e) => setChallanNoFilter(e.target.value)}
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Table */}
            {filteredRecords.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No subcontracting records found</p>
                <Button onClick={handleAdd} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Record
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">SR NO</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Challan No</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Mr.</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Received By</TableHead>
                      <TableHead>Mob. No.</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record, index) => (
                      <TableRow key={record.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell className="font-medium">{record.challanNo}</TableCell>
                        <TableCell>{record.to}</TableCell>
                        <TableCell>{record.mr}</TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {record.items.length > 0 ? (
                              <div className="space-y-1">
                                {record.items.slice(0, 2).map((item, idx) => (
                                  <div key={idx} className="text-sm">
                                    {item.particular} (Qty: {item.quantity})
                                  </div>
                                ))}
                                {record.items.length > 2 && (
                                  <div className="text-xs text-gray-500">
                                    +{record.items.length - 2} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{record.receivedBy || '-'}</TableCell>
                        <TableCell>{record.mobileNo || '-'}</TableCell>
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <SlideOver
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          title={editingRecord ? 'Edit Delivery Challan' : 'Add New Delivery Challan'}
          description={editingRecord ? 'Update the delivery challan details' : 'Fill in the details to create a new delivery challan'}
        >
          <SubcontractingForm
            initialData={editingRecord ? {
              date: editingRecord.date,
              challanNo: editingRecord.challanNo,
              to: editingRecord.to,
              mr: editingRecord.mr,
              items: editingRecord.items.map(item => ({
                particular: item.particular,
                quantity: item.quantity.toString(),
                rate: item.rate,
              })),
              receivedBy: editingRecord.receivedBy,
              mobileNo: editingRecord.mobileNo,
              authorisedSignature: editingRecord.authorisedSignature,
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

