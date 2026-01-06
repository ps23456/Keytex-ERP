import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import SlideOver from '../components/SlideOver'
import { AlertTriangle, Eye, Filter, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  RejectionLogbookEntry,
  deleteRejectionLogbook,
  loadRejectionLogbooks,
} from '../lib/rejectionLogbookStorage'

export default function RejectionLogbookPage() {
  const [records, setRecords] = useState<RejectionLogbookEntry[]>(() => loadRejectionLogbooks())
  const [selectedRecord, setSelectedRecord] = useState<RejectionLogbookEntry | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [machineTypeFilter, setMachineTypeFilter] = useState('all')
  const [machineNameFilter, setMachineNameFilter] = useState('all')
  const [rejectionTypeFilter, setRejectionTypeFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  const machineTypes = useMemo(() => {
    const unique = new Set<string>()
    records.forEach((record) => {
      record.items.forEach((item) => {
        if (item.machineType) unique.add(item.machineType)
      })
    })
    return Array.from(unique)
  }, [records])

  const machineNames = useMemo(() => {
    const unique = new Set<string>()
    records.forEach((record) => {
      record.items.forEach((item) => {
        if (item.machineName) unique.add(item.machineName)
      })
    })
    return Array.from(unique)
  }, [records])

  const rejectionTypes = useMemo(() => {
    const unique = new Set<string>()
    records.forEach((record) => {
      record.items.forEach((item) => {
        if (item.rejectionType) unique.add(item.rejectionType)
      })
    })
    return Array.from(unique)
  }, [records])

  const activeFilterCount = useMemo(() => {
    return [
      machineTypeFilter !== 'all',
      machineNameFilter !== 'all',
      rejectionTypeFilter !== 'all',
      Boolean(startDate),
      Boolean(endDate),
    ].filter(Boolean).length
  }, [machineTypeFilter, machineNameFilter, rejectionTypeFilter, startDate, endDate])

  const filteredRecords = useMemo(() => {
    const search = searchTerm.toLowerCase().trim()
    return records.filter((record) => {
      if (startDate && record.date < startDate) return false
      if (endDate && record.date > endDate) return false

      const hasMachineType =
        machineTypeFilter === 'all' ||
        record.items.some((item) => item.machineType.toLowerCase() === machineTypeFilter.toLowerCase())
      if (!hasMachineType) return false

      const hasMachineName =
        machineNameFilter === 'all' ||
        record.items.some((item) => item.machineName.toLowerCase() === machineNameFilter.toLowerCase())
      if (!hasMachineName) return false

      const hasRejectionType =
        rejectionTypeFilter === 'all' ||
        record.items.some((item) => item.rejectionType?.toLowerCase() === rejectionTypeFilter.toLowerCase())
      if (!hasRejectionType) return false

      if (!search) return true
      return (
        record.logbookNumber.toLowerCase().includes(search) ||
        record.items.some(
          (item) =>
            item.machineName.toLowerCase().includes(search) ||
            item.machineType.toLowerCase().includes(search) ||
            item.productDescription.toLowerCase().includes(search) ||
            item.productionOrderNo.toLowerCase().includes(search)
        )
      )
    })
  }, [records, searchTerm, machineTypeFilter, machineNameFilter, rejectionTypeFilter, startDate, endDate])

  const handleDelete = (record: RejectionLogbookEntry) => {
    if (window.confirm('Delete this rejection logbook entry?')) {
      const updated = deleteRejectionLogbook(record.id)
      setRecords(updated)
      setSuccessMessage('Rejection logbook entry deleted.')
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  const resetFilters = () => {
    setMachineTypeFilter('all')
    setMachineNameFilter('all')
    setRejectionTypeFilter('all')
    setStartDate('')
    setEndDate('')
    setShowFilters(false)
  }

  useEffect(() => {
    const success = (location.state as any)?.success
    if (success) {
      setSuccessMessage(success)
      setRecords(loadRejectionLogbooks())
      setTimeout(() => setSuccessMessage(null), 3000)
      navigate(location.pathname, { replace: true })
    }
  }, [location.pathname, location.state, navigate])

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Rejection & Rework Logbook</h1>
            <p className="text-slate-600 mt-1">
              Track rejection quantities, rework activities, and quality issues across production.
            </p>
          </div>
          <Button
            onClick={() => navigate('/rejection-logbook/new')}
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Create Logbook Entry</span>
          </Button>
        </div>

        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 text-sm">
            {successMessage}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <Input
                placeholder="Search by logbook number, machine, product, or order number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="md:w-96"
              />
              <Button
                type="button"
                variant={showFilters ? 'default' : 'outline'}
                className={`${showFilters ? 'bg-red-600 hover:bg-red-700 text-white' : ''} rounded-full`}
                onClick={() => setShowFilters((prev) => !prev)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'More Filters'}
                {activeFilterCount > 0 && (
                  <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/20 px-2 text-xs font-semibold">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>

            {showFilters && (
              <div className="grid md:grid-cols-5 gap-4 rounded-2xl border border-red-100 bg-red-50/50 p-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase text-slate-500">Machine Type</Label>
                  <select
                    value={machineTypeFilter}
                    onChange={(e) => setMachineTypeFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                  >
                    <option value="all">All types</option>
                    {machineTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase text-slate-500">Machine Name</Label>
                  <select
                    value={machineNameFilter}
                    onChange={(e) => setMachineNameFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                  >
                    <option value="all">All machines</option>
                    {machineNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase text-slate-500">Rejection Type</Label>
                  <select
                    value={rejectionTypeFilter}
                    onChange={(e) => setRejectionTypeFilter(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                  >
                    <option value="all">All types</option>
                    {rejectionTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase text-slate-500">Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase text-slate-500">End Date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <div className="md:col-span-5 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50"
                    onClick={resetFilters}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            )}

            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Logbook #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Machine Type</TableHead>
                      <TableHead>Machine Name</TableHead>
                      <TableHead>Production Order</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Rejection Qty</TableHead>
                      <TableHead>Rework Qty</TableHead>
                      <TableHead>Entries</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                          No rejection logbook entries yet. Use "Create Logbook Entry" to add records.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="font-medium">{record.logbookNumber}</div>
                          </TableCell>
                          <TableCell>{record.date}</TableCell>
                          <TableCell>
                            {record.items.length > 0 && record.items[0].machineType ? record.items[0].machineType : '—'}
                          </TableCell>
                          <TableCell>
                            {record.items.length > 0 && record.items[0].machineName ? record.items[0].machineName : '—'}
                          </TableCell>
                          <TableCell>
                            {record.items.length > 0 && record.items[0].productionOrderNo ? record.items[0].productionOrderNo : '—'}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium truncate max-w-[200px]">
                              {record.items.length > 0 && record.items[0].productDescription
                                ? record.items[0].productDescription
                                : '—'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {record.items.reduce((sum, item) => sum + (parseFloat(item.rejectionQty || '0') || 0), 0)}
                          </TableCell>
                          <TableCell>
                            {record.items.reduce((sum, item) => sum + (parseFloat(item.reworkQty || '0') || 0), 0)}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                              {record.items.length} {record.items.length === 1 ? 'entry' : 'entries'}
                            </span>
                          </TableCell>
                          <TableCell className="space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="inline-flex items-center gap-1 rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 hover:text-emerald-800"
                              onClick={() => setSelectedRecord(record)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="inline-flex items-center gap-1 rounded-full border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100 hover:text-blue-800"
                              onClick={() => navigate(`/rejection-logbook/${record.id}/edit`)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(record)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        <SlideOver
          open={!!selectedRecord}
          onOpenChange={(open) => {
            if (!open) setSelectedRecord(null)
          }}
          title="Rejection Logbook Details"
          description="Complete breakdown of rejection and rework entries."
        >
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase text-slate-500">Logbook Number</Label>
                  <div className="font-medium">{selectedRecord.logbookNumber}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Date</Label>
                  <div className="font-medium">{selectedRecord.date}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Entries ({selectedRecord.items.length})</h3>
                {selectedRecord.items.map((item, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Machine Type:</span> <span className="font-medium">{item.machineType || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Machine Name:</span> <span className="font-medium">{item.machineName || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Production Order:</span> <span className="font-medium">{item.productionOrderNo || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Product:</span> <span className="font-medium">{item.productDescription || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Order Qty:</span> <span className="font-medium">{item.orderQty || '0'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Produced Qty:</span> <span className="font-medium">{item.producedQty || '0'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Rejection Qty:</span> <span className="font-medium text-red-600">{item.rejectionQty || '0'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Rework Qty:</span> <span className="font-medium">{item.reworkQty || '0'}</span>
                      </div>
                      {item.rejectionReason && (
                        <div className="col-span-2">
                          <span className="text-slate-500">Rejection Reason:</span> <span className="font-medium">{item.rejectionReason}</span>
                        </div>
                      )}
                      {item.issueDescription && (
                        <div className="col-span-2">
                          <span className="text-slate-500">Issue Description:</span> <span className="font-medium">{item.issueDescription}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SlideOver>
      </div>
    </MainLayout>
  )
}



















