import { useMemo, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import DesignRequirementForm, { DesignRequirementFormData } from '../components/DesignRequirementForm'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import SlideOver from '../components/SlideOver'
import { ClipboardList, Filter, Eye, Trash2, Plus, Pencil } from 'lucide-react'
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

interface SavedRequirement extends DesignRequirementFormData {
  id: string
  createdAt: string
}

const STORAGE_KEY = 'design_requirement_records'

const saveRequirement = (data: DesignRequirementFormData): SavedRequirement => {
  const record: SavedRequirement = {
    ...data,
    id: `designRequirement_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }

  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    const parsed: SavedRequirement[] = existing ? JSON.parse(existing) : []
    parsed.unshift(record)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
  } catch (error) {
    console.error('Failed to persist design requirement:', error)
  }

  return record
}

const loadRequirements = (): SavedRequirement[] => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    return existing ? JSON.parse(existing) : []
  } catch (error) {
    console.error('Failed to load design requirements:', error)
    return []
  }
}

const deleteRequirement = (id: string): SavedRequirement[] => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    const parsed: SavedRequirement[] = existing ? JSON.parse(existing) : []
    const filtered = parsed.filter((record) => record.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return filtered
  } catch (error) {
    console.error('Failed to delete design requirement:', error)
    return loadRequirements()
  }
}

const updateRequirement = (id: string, data: DesignRequirementFormData): SavedRequirement[] => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    const parsed: SavedRequirement[] = existing ? JSON.parse(existing) : []
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
    console.error('Failed to update design requirement:', error)
    return loadRequirements()
  }
}

export default function DesignRequirementPage() {
  const [records, setRecords] = useState<SavedRequirement[]>(() => loadRequirements())
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formResetKey, setFormResetKey] = useState(() => Date.now())
  const [selectedRecord, setSelectedRecord] = useState<SavedRequirement | null>(null)
  const [editingRecord, setEditingRecord] = useState<SavedRequirement | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [clientFilter, setClientFilter] = useState('all')
  const [materialFilter, setMaterialFilter] = useState('all')

  const recentRecords = useMemo(() => records.slice(0, 3), [records])
  const latestRecord = recentRecords[0] || null

  const handleSubmit = async (data: DesignRequirementFormData) => {
    setIsSaving(true)
    try {
      if (editingRecord) {
        const updatedRecords = updateRequirement(editingRecord.id, data)
        setRecords(updatedRecords)
        setSuccessMessage('Design requirement updated successfully.')
        setEditingRecord(null)
      } else {
        saveRequirement(data)
        const all = loadRequirements()
        setRecords(all)
        setSuccessMessage('Design requirement saved successfully.')
      }
      setTimeout(() => setSuccessMessage(null), 3000)
      setIsFormOpen(false)
      setFormResetKey(Date.now())
    } catch (error) {
      console.error('Failed to save design requirement:', error)
      setSuccessMessage('Failed to save design requirement. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRefreshRecords = () => {
    setRecords(loadRequirements())
  }

  const handleDelete = (record: SavedRequirement) => {
    if (window.confirm('Delete this design requirement?')) {
      const remaining = deleteRequirement(record.id)
      setRecords(remaining)
      setSuccessMessage('Design requirement deleted.')
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  const handleEdit = (record: SavedRequirement) => {
    setEditingRecord(record)
    setIsFormOpen(true)
    setFormResetKey(Date.now())
  }

  const clientOptions = useMemo(() => {
    const clients = new Set<string>()
    records.forEach((record) => {
      if (record.clientName) {
        clients.add(record.clientName)
      }
    })
    return Array.from(clients)
  }, [records])

  const materialOptions = useMemo(() => {
    const materials = new Set<string>()
    records.forEach((record) => {
      if (record.baseMaterial) {
        materials.add(record.baseMaterial)
      }
    })
    return Array.from(materials)
  }, [records])

  const activeFilters = useMemo(() => {
    return [clientFilter, materialFilter].filter((value) => value !== 'all').length
  }, [clientFilter, materialFilter])

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (clientFilter !== 'all' && record.clientName !== clientFilter) {
        return false
      }
      if (materialFilter !== 'all' && record.baseMaterial !== materialFilter) {
        return false
      }
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const match =
          (record.clientName || '').toLowerCase().includes(search) ||
          (record.partName || '').toLowerCase().includes(search) ||
          (record.baseMaterial || '').toLowerCase().includes(search) ||
          (record.notes || '').toLowerCase().includes(search)
        if (!match) {
          return false
        }
      }
      return true
    })
  }, [records, clientFilter, materialFilter, searchTerm])

  const renderMachiningSummary = (record: SavedRequirement) => {
    const processes = record.machiningProcess || {}
    const entries = Object.entries(processes)
      .filter(([, value]) => value)
      .slice(0, 2)
      .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
    if (entries.length === 0) return '—'
    return entries.join(' • ')
  }

  const formatKeyLabel = (key: string) =>
    key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase())

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Design Requirement Checklist</h1>
            <p className="text-slate-600 mt-1">
              Capture comprehensive machining and material details before releasing a production drawing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={handleRefreshRecords}
            >
              Refresh Recent Records
            </Button>
          </div>
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
                  placeholder="Search by client, part, material, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="md:w-96"
                />
                <Button
                  variant={showFilters ? 'default' : 'outline'}
                  onClick={() => setShowFilters((prev) => !prev)}
                  className={`h-10 px-4 text-sm font-medium flex items-center space-x-2 ${
                    showFilters ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span>More Filters</span>
                  {activeFilters > 0 && (
                    <span
                      className={`ml-1 inline-flex items-center justify-center rounded-full px-2 text-xs font-semibold ${
                        showFilters ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
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
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                <span>New Requirement</span>
              </Button>
            </div>

            {showFilters && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Client</Label>
                    <select
                      value={clientFilter}
                      onChange={(e) => setClientFilter(e.target.value)}
                      className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm"
                    >
                      <option value="all">All clients</option>
                      {clientOptions.map((client) => (
                        <option key={client} value={client}>
                          {client}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Base Material</Label>
                    <select
                      value={materialFilter}
                      onChange={(e) => setMaterialFilter(e.target.value)}
                      className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm"
                    >
                      <option value="all">All materials</option>
                      {materialOptions.map((material) => (
                        <option key={material} value={material}>
                          {material}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-1">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Latest Part Highlight</Label>
                    <div className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm flex items-center text-slate-600">
                      {latestRecord ? `${latestRecord.partName || 'Unnamed'} • Qty ${latestRecord.manufacturingQty || '—'}` : 'No submissions yet'}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={activeFilters === 0}
                    onClick={() => {
                      setClientFilter('all')
                      setMaterialFilter('all')
                    }}
                    className="text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 disabled:text-slate-400"
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
                    <TableHead>Requirement</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Part Details</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Machining Snapshot</TableHead>
                    <TableHead>Created On</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        No design requirements found. Use “New Requirement” to capture a checklist.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="space-y-1">
                          <div className="font-medium">#{record.id.slice(-6).toUpperCase()}</div>
                          <div className="text-xs text-muted-foreground">
                            {record.date ? new Date(record.date).toLocaleDateString() : 'Date not set'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{record.clientName || '—'}</div>
                          <div className="text-xs text-muted-foreground">
                            {record.sourceInput ? `${record.sourceInput.slice(0, 36)}${record.sourceInput.length > 36 ? '…' : ''}` : 'No customer inputs logged'}
                          </div>
                          {record.sourceAttachmentName && (
                            <div className="mt-1 inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                              Attachment: {record.sourceAttachmentName}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{record.partName || '—'}</div>
                          <div className="text-xs text-muted-foreground">Qty: {record.manufacturingQty || '—'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{record.baseMaterial || '—'}</div>
                          <div className="text-xs text-muted-foreground">
                            Heat Treatment: {record.regularInfo?.heatTreatment || '—'}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {renderMachiningSummary(record)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {new Date(record.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(record.createdAt).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
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
          title="KM-DPD-03 Design Requirement"
          description="Fill out the checklist to log machining, material, and customer requirements."
        >
          <DesignRequirementForm
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
          title="Design Requirement Summary"
          description="Review captured machining and material details."
        >
          {selectedRecord && (
            <div className="space-y-6">
              <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-xl">
                <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white px-6 py-6 space-y-5">
                  <div className="space-y-1">
                    <p className="uppercase tracking-[0.35em] text-xs font-semibold text-white/70">Design Requirement</p>
                    <h2 className="text-2xl font-semibold leading-tight">
                      {selectedRecord.partName || 'Untitled Part'}
                    </h2>
                    <p className="text-sm text-white/80">
                      Review captured machining and material details for this component.
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm font-medium">
                    <div className="rounded-2xl bg-white/15 px-4 py-3 shadow-sm">
                      <div className="text-xs uppercase tracking-[0.25em] text-white/70">Client</div>
                      <div className="text-base text-white">{selectedRecord.clientName || '—'}</div>
                      <div className="text-xs text-white/80 mt-1">
                        Manufacturing Qty: {selectedRecord.manufacturingQty || '—'}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white/15 px-4 py-3 shadow-sm">
                      <div className="text-xs uppercase tracking-[0.25em] text-white/70">Material & Date</div>
                      <div className="text-base text-white">{selectedRecord.baseMaterial || '—'}</div>
                      <div className="text-xs text-white/80 mt-1">
                        {selectedRecord.date
                          ? new Date(selectedRecord.date).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'Date not specified'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white px-6 py-6 space-y-6 text-sm text-slate-700">
                  <div className="grid lg:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h3 className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Rotary Die</h3>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs font-medium text-slate-600">
                          {Object.entries(selectedRecord.rotaryDie || {}).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center">
                              <span className="uppercase tracking-wide text-slate-500">{formatKeyLabel(key)}</span>
                              <span className="text-slate-900 font-semibold">{value || '—'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Machining Process</h3>
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs font-medium text-emerald-700">
                          {Object.entries(selectedRecord.machiningProcess || {}).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center">
                              <span className="uppercase tracking-wide text-emerald-600">{formatKeyLabel(key)}</span>
                              <span className="text-slate-900 font-semibold">{value || '—'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Regular Information</h3>
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4 shadow-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs font-medium text-indigo-700">
                        {Object.entries(selectedRecord.regularInfo || {}).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="uppercase tracking-wide text-indigo-600">{formatKeyLabel(key)}</span>
                            <span className="text-slate-900 font-semibold">{value || '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Notes</h3>
                      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700 min-h-[100px] shadow-sm">
                        {selectedRecord.notes?.trim() || 'No additional notes recorded.'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Reference Attachment</h3>
                      {selectedRecord.sourceAttachmentName && selectedRecord.sourceAttachmentData ? (
                        <a
                          href={selectedRecord.sourceAttachmentData}
                          download={selectedRecord.sourceAttachmentName}
                          className="inline-flex items-center justify-between rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-5 py-4 text-sm font-semibold text-blue-800 shadow-sm hover:from-blue-100 hover:to-blue-50"
                        >
                          <span>{selectedRecord.sourceAttachmentName}</span>
                          <span className="text-xs text-blue-600">Download</span>
                        </a>
                      ) : (
                        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
                          No reference file uploaded.
                        </div>
                      )}
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

