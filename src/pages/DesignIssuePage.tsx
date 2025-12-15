import { useMemo, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import DesignIssueForm, { DesignIssueFormData } from '../components/DesignIssueForm'
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
import { Filter, Eye, Trash2, Plus, Pencil, FileText } from 'lucide-react'

interface SavedDesignIssue extends DesignIssueFormData {
  id: string
  createdAt: string
  updatedAt?: string
}

const STORAGE_KEY = 'design_issue_records'

const saveDesignIssue = (data: DesignIssueFormData): SavedDesignIssue => {
  const record: SavedDesignIssue = {
    ...data,
    id: `designIssue_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }

  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    const parsed: SavedDesignIssue[] = existing ? JSON.parse(existing) : []
    parsed.unshift(record)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
  } catch (error) {
    console.error('Failed to persist design issue record:', error)
  }

  return record
}

const loadDesignIssues = (): SavedDesignIssue[] => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    return existing ? JSON.parse(existing) : []
  } catch (error) {
    console.error('Failed to load design issue records:', error)
    return []
  }
}

const deleteDesignIssue = (id: string): SavedDesignIssue[] => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    const parsed: SavedDesignIssue[] = existing ? JSON.parse(existing) : []
    const filtered = parsed.filter((record) => record.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return filtered
  } catch (error) {
    console.error('Failed to delete design issue record:', error)
    return loadDesignIssues()
  }
}

const updateDesignIssue = (id: string, data: DesignIssueFormData): SavedDesignIssue[] => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    const parsed: SavedDesignIssue[] = existing ? JSON.parse(existing) : []
    const updated = parsed.map((record) =>
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
    console.error('Failed to update design issue record:', error)
    return loadDesignIssues()
  }
}

const formatKeyLabel = (key: string) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())

export default function DesignIssuePage() {
  const [records, setRecords] = useState<SavedDesignIssue[]>(() => loadDesignIssues())
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formResetKey, setFormResetKey] = useState(() => Date.now())
  const [editingRecord, setEditingRecord] = useState<SavedDesignIssue | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<SavedDesignIssue | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [receiverFilter, setReceiverFilter] = useState('all')
  const [revisionFilter, setRevisionFilter] = useState('all')

  const handleRefresh = () => {
    setRecords(loadDesignIssues())
  }

  const handleSubmit = async (data: DesignIssueFormData) => {
    setIsSaving(true)
    try {
      if (editingRecord) {
        const updated = updateDesignIssue(editingRecord.id, data)
        setRecords(updated)
        setSuccessMessage('Design issue updated successfully.')
        setEditingRecord(null)
      } else {
        saveDesignIssue(data)
        setRecords(loadDesignIssues())
        setSuccessMessage('Design issue logged successfully.')
      }
      setTimeout(() => setSuccessMessage(null), 3000)
      setIsFormOpen(false)
      setFormResetKey(Date.now())
    } catch (error) {
      console.error('Failed to save design issue:', error)
      setSuccessMessage('Failed to save design issue. Please try again.')
      setTimeout(() => setSuccessMessage(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = (record: SavedDesignIssue) => {
    if (window.confirm('Delete this design issue entry?')) {
      const remaining = deleteDesignIssue(record.id)
      setRecords(remaining)
      setSuccessMessage('Design issue removed.')
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  const handleEdit = (record: SavedDesignIssue) => {
    setEditingRecord(record)
    setIsFormOpen(true)
    setFormResetKey(Date.now())
  }

  const receiverOptions = useMemo(() => {
    const set = new Set<string>()
    records.forEach((record) => {
      if (record.receiverName) set.add(record.receiverName)
    })
    return Array.from(set)
  }, [records])

  const revisionOptions = useMemo(() => {
    const set = new Set<string>()
    records.forEach((record) => {
      if (record.revisionNo) set.add(record.revisionNo)
    })
    return Array.from(set)
  }, [records])

  const activeFilters = useMemo(() => {
    return [receiverFilter, revisionFilter].filter((value) => value !== 'all').length
  }, [receiverFilter, revisionFilter])

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (receiverFilter !== 'all' && record.receiverName !== receiverFilter) return false
      if (revisionFilter !== 'all' && record.revisionNo !== revisionFilter) return false
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const match =
          (record.productionNo || '').toLowerCase().includes(search) ||
          (record.productionDescription || '').toLowerCase().includes(search) ||
          (record.receiverName || '').toLowerCase().includes(search) ||
          (record.remark || '').toLowerCase().includes(search)
        if (!match) return false
      }
      return true
    })
  }, [records, receiverFilter, revisionFilter, searchTerm])

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Design Issue Log</h1>
            <p className="text-slate-600 mt-1">
              Track when design drawings are issued, revision history, and receiver acknowledgements.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-full border-indigo-200 text-indigo-700 hover:bg-indigo-50"
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
                  placeholder="Search by production, revision, receiver, or remarks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="md:w-96"
                />
                <Button
                  variant={showFilters ? 'default' : 'outline'}
                  onClick={() => setShowFilters((prev) => !prev)}
                  className={`h-10 px-4 text-sm font-medium flex items-center space-x-2 ${
                    showFilters ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span>More Filters</span>
                  {activeFilters > 0 && (
                    <span
                      className={`ml-1 inline-flex items-center justify-center rounded-full px-2 text-xs font-semibold ${
                        showFilters ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {activeFilters}
                    </span>
                  )}
                </Button>
              </div>
              <Button
                onClick={() => {
                  setEditingRecord(null)
                  setIsFormOpen(true)
                  setFormResetKey(Date.now())
                }}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                <span>Log Issue</span>
              </Button>
            </div>

            {showFilters && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Receiver</Label>
                    <select
                      value={receiverFilter}
                      onChange={(e) => setReceiverFilter(e.target.value)}
                      className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm"
                    >
                      <option value="all">All receivers</option>
                      {receiverOptions.map((receiver) => (
                        <option key={receiver} value={receiver}>
                          {receiver}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Revision No</Label>
                    <select
                      value={revisionFilter}
                      onChange={(e) => setRevisionFilter(e.target.value)}
                      className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm"
                    >
                      <option value="all">All revisions</option>
                      {revisionOptions.map((revision) => (
                        <option key={revision} value={revision}>
                          {revision}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Latest Issue</Label>
                    <div className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm flex items-center text-slate-600">
                      {records.length > 0
                        ? `${records[0].productionNo || 'No production #'} • ${
                            records[0].dateOfIssue
                              ? new Date(records[0].dateOfIssue).toLocaleDateString()
                              : 'Date not set'
                          }`
                        : 'No issues logged yet'}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={activeFilters === 0}
                    onClick={() => {
                      setReceiverFilter('all')
                      setRevisionFilter('all')
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 disabled:text-slate-400"
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
                    <TableHead>Issue</TableHead>
                    <TableHead>Production</TableHead>
                    <TableHead>Revision</TableHead>
                    <TableHead>Receiver</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        No design issues found. Use “Log Issue” to capture a new entry.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="space-y-1">
                          <div className="font-medium">#{record.id.slice(-6).toUpperCase()}</div>
                          <div className="text-xs text-muted-foreground">
                            Logged: {new Date(record.createdAt).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{record.productionNo || '—'}</div>
                          <div className="text-xs text-muted-foreground max-w-[260px] truncate">
                            {record.productionDescription || 'No description'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{record.revisionNo || '—'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{record.receiverName || '—'}</div>
                          <div className="text-xs text-muted-foreground">
                            Signature: {record.receiverSignature || '—'}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm space-y-1">
                          <div>
                            <span className="font-medium">Issue:</span>{' '}
                            {record.dateOfIssue
                              ? new Date(record.dateOfIssue).toLocaleDateString()
                              : '—'}
                          </div>
                          <div>
                            <span className="font-medium">Received:</span>{' '}
                            {record.dateOfReceived
                              ? new Date(record.dateOfReceived).toLocaleDateString()
                              : '—'}
                          </div>
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
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          title={editingRecord ? 'Edit Design Issue' : 'Log Design Issue'}
          description={editingRecord ? 'Update the design issue receive entry.' : 'Capture a new design issue receive entry.'}
        >
          <DesignIssueForm
            key={formResetKey}
            onSubmit={handleSubmit}
            isLoading={isSaving}
            initialData={editingRecord || undefined}
          />
        </SlideOver>

        <SlideOver
          open={!!selectedRecord}
          onOpenChange={(open) => {
            if (!open) setSelectedRecord(null)
          }}
          title="Design Issue Summary"
          description="Review production issue and receiver acknowledgement details."
        >
          {selectedRecord && (
            <div className="space-y-6">
              <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-xl">
                <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 text-white px-6 py-6 space-y-5">
                  <div className="space-y-1">
                    <p className="uppercase tracking-[0.35em] text-xs font-semibold text-white/70">Design Issue</p>
                    <h2 className="text-2xl font-semibold leading-tight flex items-center gap-2">
                      <FileText className="h-6 w-6" />
                      {selectedRecord.productionNo || 'Unknown Production'}
                    </h2>
                    <p className="text-sm text-white/80 max-w-2xl">
                      Logged on {new Date(selectedRecord.createdAt).toLocaleString()} {selectedRecord.updatedAt ? `(updated ${new Date(selectedRecord.updatedAt).toLocaleString()})` : ''}
                    </p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 text-sm font-medium">
                    <div className="rounded-2xl bg-white/15 px-4 py-3 shadow-sm">
                      <div className="text-xs uppercase tracking-[0.25em] text-white/70">Revision</div>
                      <div className="text-white text-base">{selectedRecord.revisionNo || '—'}</div>
                    </div>
                    <div className="rounded-2xl bg-white/15 px-4 py-3 shadow-sm">
                      <div className="text-xs uppercase tracking-[0.25em] text-white/70">Issue Date</div>
                      <div className="text-white text-base">
                        {selectedRecord.dateOfIssue
                          ? new Date(selectedRecord.dateOfIssue).toLocaleDateString()
                          : '—'}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/15 px-4 py-3 shadow-sm">
                      <div className="text-xs uppercase tracking-[0.25em] text-white/70">Receiver</div>
                      <div className="text-white text-base">{selectedRecord.receiverName || '—'}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white px-6 py-6 space-y-6 text-sm text-slate-700">
                  <div className="space-y-3">
                    <h3 className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Production Details</h3>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm">
                      <div className="space-y-2">
                        <div className="font-semibold text-slate-800">Description</div>
                        <div className="text-slate-600">
                          {selectedRecord.productionDescription || 'No production description captured.'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h3 className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Receiver Details</h3>
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm space-y-3">
                        <div className="flex justify-between text-xs font-medium text-emerald-700">
                          <span className="uppercase tracking-wide">Name</span>
                          <span className="text-slate-900">{selectedRecord.receiverName || '—'}</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-emerald-700">
                          <span className="uppercase tracking-wide">Signature</span>
                          <span className="text-slate-900">{selectedRecord.receiverSignature || '—'}</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-emerald-700">
                          <span className="uppercase tracking-wide">Received Date</span>
                          <span className="text-slate-900">
                            {selectedRecord.dateOfReceived
                              ? new Date(selectedRecord.dateOfReceived).toLocaleDateString()
                              : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Issue Timeline</h3>
                      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4 shadow-sm space-y-2 text-xs font-medium text-indigo-700">
                        <div className="flex justify-between">
                          <span className="uppercase tracking-wide">Issue Date</span>
                          <span className="text-slate-900">
                            {selectedRecord.dateOfIssue
                              ? new Date(selectedRecord.dateOfIssue).toLocaleDateString()
                              : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="uppercase tracking-wide">Received Date</span>
                          <span className="text-slate-900">
                            {selectedRecord.dateOfReceived
                              ? new Date(selectedRecord.dateOfReceived).toLocaleDateString()
                              : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Remarks</h3>
                    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700 min-h-[100px] shadow-sm">
                      {selectedRecord.remark?.trim() || 'No remarks added.'}
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

