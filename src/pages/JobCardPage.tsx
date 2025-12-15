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
import { Filter, Eye, Trash2, Plus, Pencil, ClipboardList } from 'lucide-react'
import { deleteJobCard, loadJobCards, SavedJobCard } from '../lib/jobCardStorage'

export default function JobCardPage() {
  const [records, setRecords] = useState<SavedJobCard[]>(() => loadJobCards())
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<SavedJobCard | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [workCenterFilter, setWorkCenterFilter] = useState('all')

  const location = useLocation()
  const navigate = useNavigate()

  const statusOptions = useMemo(() => {
    const set = new Set<string>()
    records.forEach((record) => {
      if (record.status) set.add(record.status)
    })
    return Array.from(set)
  }, [records])

  const workCenterOptions = useMemo(() => {
    const set = new Set<string>()
    records.forEach((record) => {
      if (record.workCenter) set.add(record.workCenter)
    })
    return Array.from(set)
  }, [records])

  const activeFilters = useMemo(() => {
    return [statusFilter, workCenterFilter].filter((value) => value !== 'all').length
  }, [statusFilter, workCenterFilter])

  const handleRefresh = () => {
    setRecords(loadJobCards())
  }

  const handleDelete = (record: SavedJobCard) => {
    if (window.confirm('Delete this job card?')) {
      const remaining = deleteJobCard(record.id)
      setRecords(remaining)
      setSuccessMessage('Job card deleted.')
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  const handleEdit = (record: SavedJobCard) => {
    navigate(`/job-cards/${record.id}/edit`)
  }

  const getCustomerName = (record: SavedJobCard) =>
    record.sale?.clientName || record.customerName || ''
  const getPartName = (record: SavedJobCard) => record.sale?.itemName || record.partName || ''
  const getMaterial = (record: SavedJobCard) => record.sale?.rawMaterial || record.material || ''
  const getQuantity = (record: SavedJobCard) => record.sale?.quantity || record.quantity || ''
  const getContactPerson = (record: SavedJobCard) =>
    record.sale?.contactPerson || record.contactPerson || ''
  const getContactPhone = (record: SavedJobCard) =>
    record.sale?.contactPhone || record.contactPhone || ''

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (statusFilter !== 'all' && record.status !== statusFilter) return false
      if (workCenterFilter !== 'all' && record.workCenter !== workCenterFilter) return false
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const match =
          (record.jobNumber || '').toLowerCase().includes(search) ||
          getCustomerName(record).toLowerCase().includes(search) ||
          getPartName(record).toLowerCase().includes(search) ||
          (record.workCenter || '').toLowerCase().includes(search)
        if (!match) return false
      }
      return true
    })
  }, [records, statusFilter, workCenterFilter, searchTerm])

  const latestJob = records[0] || null

  useEffect(() => {
    const quotation = (location.state as any)?.quotation
    if (quotation) {
      navigate('/job-cards/new', { state: { quotation }, replace: true })
    }
  }, [location.state, navigate])

  useEffect(() => {
    const success = (location.state as any)?.success
    if (success) {
      setSuccessMessage(success)
      setRecords(loadJobCards())
      setTimeout(() => setSuccessMessage(null), 3000)
      navigate(location.pathname, { replace: true })
    }
  }, [location.pathname, location.state, navigate])

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Job Cards</h1>
            <p className="text-slate-600 mt-1">
              Manage production jobs generated from quotations and track their planning progress.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-full border-orange-200 text-orange-700 hover:bg-orange-50"
            onClick={handleRefresh}
          >
            Refresh Records
          </Button>
        </div>

        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 text-sm">
            {successMessage}
          </div>
        )}

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-3 space-y-3 md:space-y-0">
                <Input
                  placeholder="Search by job number, customer, part, or work center..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="md:w-96"
                />
                <Button
                  variant={showFilters ? 'default' : 'outline'}
                  onClick={() => setShowFilters((prev) => !prev)}
                  className={`h-10 px-4 text-sm font-medium flex items-center space-x-2 ${
                    showFilters ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span>More Filters</span>
                  {activeFilters > 0 && (
                    <span
                      className={`ml-1 inline-flex items-center justify-center rounded-full px-2 text-xs font-semibold ${
                        showFilters ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {activeFilters}
                    </span>
                  )}
                </Button>
              </div>
              <Button
                onClick={() => navigate('/job-cards/new')}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600"
              >
                <Plus className="h-4 w-4" />
                <span>Create Job Card</span>
              </Button>
            </div>

            {showFilters && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Status</Label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm"
                    >
                      <option value="all">All statuses</option>
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Work Center</Label>
                    <select
                      value={workCenterFilter}
                      onChange={(e) => setWorkCenterFilter(e.target.value)}
                      className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm"
                    >
                      <option value="all">All work centers</option>
                      {workCenterOptions.map((workCenter) => (
                        <option key={workCenter} value={workCenter}>
                          {workCenter}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Latest Job</Label>
                    <div className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm flex items-center text-slate-600">
                      {latestJob
                        ? `${latestJob.jobNumber} • ${getCustomerName(latestJob) || 'Unknown customer'}`
                        : 'No job cards created yet'}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={activeFilters === 0}
                    onClick={() => {
                      setStatusFilter('all')
                      setWorkCenterFilter('all')
                    }}
                    className="text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 disabled:text-slate-400"
                  >
                    Clear filters
                  </Button>
                </div>
              </div>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Part & Material</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        No job cards found. Use “Create Job Card” to capture a new job.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="space-y-1">
                          <div className="font-medium">{record.jobNumber}</div>
                          <div className="text-xs text-muted-foreground">
                            Created: {new Date(record.createdAt).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{getCustomerName(record) || '—'}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                            {getContactPerson(record)
                              ? `${getContactPerson(record)} (${getContactPhone(record) || 'No phone'})`
                              : 'No contact'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{getPartName(record) || '—'}</div>
                          <div className="text-xs text-muted-foreground">Material: {getMaterial(record) || '—'}</div>
                          <div className="text-xs text-muted-foreground">Qty: {getQuantity(record) || '—'}</div>
                        </TableCell>
                        <TableCell className="text-sm space-y-1">
                          <div>
                            <span className="font-medium">Job Date:</span>{' '}
                            {record.jobDate ? new Date(record.jobDate).toLocaleDateString() : '—'}
                          </div>
                          <div>
                            <span className="font-medium">Delivery:</span>{' '}
                            {record.sale?.deliveryDate
                              ? new Date(record.sale.deliveryDate).toLocaleDateString()
                              : '—'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Work Center: {record.workCenter || '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                            {record.status}
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
                            onClick={() => handleEdit(record)}
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

        <SlideOver
          open={!!selectedRecord}
          onOpenChange={(open) => {
            if (!open) setSelectedRecord(null)
          }}
          title="Job Card Summary"
          description="Review production job plan details."
        >
          {selectedRecord && (
            <div className="space-y-6">
              <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-xl">
                <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 text-white px-6 py-6 space-y-5">
                  <div className="space-y-1">
                    <p className="uppercase tracking-[0.35em] text-xs font-semibold text-white/70">Job Card</p>
                    <h2 className="text-2xl font-semibold leading-tight flex items-center gap-2">
                      <ClipboardList className="h-6 w-6" />
                      {selectedRecord.jobNumber}
                    </h2>
                    <p className="text-sm text-white/80 max-w-2xl">
                      Created {new Date(selectedRecord.createdAt).toLocaleString()}
                      {selectedRecord.updatedAt ? ` • Updated ${new Date(selectedRecord.updatedAt).toLocaleString()}` : ''}
                    </p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 text-sm font-medium">
                    <div className="rounded-2xl bg-white/90 px-4 py-3 shadow-md text-orange-700">
                      <div className="text-xs uppercase tracking-[0.25em] text-orange-500/80">Status</div>
                      <div className="text-base font-semibold">{selectedRecord.status}</div>
                    </div>
                    <div className="rounded-2xl bg-white/90 px-4 py-3 shadow-md text-orange-700">
                      <div className="text-xs uppercase tracking-[0.25em] text-orange-500/80">Customer</div>
                      <div className="text-base font-semibold">{getCustomerName(selectedRecord) || '—'}</div>
                    </div>
                    <div className="rounded-2xl bg-white/90 px-4 py-3 shadow-md text-orange-700">
                      <div className="text-xs uppercase tracking-[0.25em] text-orange-500/80">Quotation</div>
                      <div className="text-base font-semibold">{selectedRecord.quoteNumber || '—'}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white px-6 py-6 space-y-6 text-sm text-slate-700">
                  <div className="space-y-3">
                    <h3 className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Customer & Contact</h3>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm space-y-2">
                      <div className="font-semibold text-slate-900">{getCustomerName(selectedRecord) || '—'}</div>
                      <div>Contact Person: {getContactPerson(selectedRecord) || '—'}</div>
                      <div>Phone: {getContactPhone(selectedRecord) || '—'}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Part & Operations</h3>
                    <div className="rounded-2xl border border-amber-200 bg-white px-5 py-4 shadow-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-amber-700">Part</span>
                        <span className="text-slate-900">{getPartName(selectedRecord) || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-amber-700">Material</span>
                        <span className="text-slate-900">{getMaterial(selectedRecord) || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-amber-700">Quantity</span>
                        <span className="text-slate-900">{getQuantity(selectedRecord) || '—'}</span>
                      </div>
                      <div className="pt-3 border-t border-amber-200 text-sm text-slate-700 leading-relaxed space-y-1">
                        {Array.isArray(selectedRecord.operations) && selectedRecord.operations.length > 0 ? (
                          selectedRecord.operations.map((operation, index) => (
                            <div key={`${operation.operation}-${index}`} className="flex justify-between text-xs">
                              <span className="font-semibold text-amber-700">{operation.operation}</span>
                              <span className="text-slate-600">
                                {operation.start || '—'} - {operation.end || '—'}
                              </span>
                            </div>
                          ))
                        ) : (selectedRecord as any).operations ? (
                          <span>{(selectedRecord as any).operations}</span>
                        ) : (
                          <span>No operations listed.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h3 className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Schedule</h3>
                      <div className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 shadow-sm space-y-2">
                        <div className="flex justify-between text-xs font-medium text-orange-700">
                          <span className="uppercase tracking-wide">Job Date</span>
                          <span className="text-slate-900">
                            {selectedRecord.jobDate ? new Date(selectedRecord.jobDate).toLocaleDateString() : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-orange-700">
                          <span className="uppercase tracking-wide">Delivery</span>
                          <span className="text-slate-900">
                            {selectedRecord.sale?.deliveryDate
                              ? new Date(selectedRecord.sale.deliveryDate).toLocaleDateString()
                              : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-orange-700">
                          <span className="uppercase tracking-wide">Design Issue</span>
                          <span className="text-slate-900">
                            {selectedRecord.design?.issueStart
                              ? `${new Date(selectedRecord.design.issueStart).toLocaleDateString()} – ${
                                  selectedRecord.design?.issueEnd
                                    ? new Date(selectedRecord.design.issueEnd).toLocaleDateString()
                                    : '—'
                                }`
                              : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-orange-700">
                          <span className="uppercase tracking-wide">Work Center</span>
                          <span className="text-slate-900">{selectedRecord.workCenter || '—'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Notes</h3>
                      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700 min-h-[100px] shadow-sm space-y-2">
                        <div>
                          <span className="font-semibold text-slate-900">Special Requirement:</span>{' '}
                          {selectedRecord.program?.specialRequirement?.trim() || '—'}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">Instruction:</span>{' '}
                          {selectedRecord.program?.instruction?.trim() ||
                            selectedRecord.finalInspection?.notes?.trim() ||
                            'No notes recorded.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SlideOver>
      </div>
    </MainLayout>
  )
}

