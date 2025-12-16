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
import { Calendar, Eye, Filter, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  ShiftHandoverEntry,
  deleteShiftHandover,
  loadShiftHandovers,
} from '../lib/shiftHandoverStorage'

export default function ShiftHandoverPage() {
  const [records, setRecords] = useState<ShiftHandoverEntry[]>(() => loadShiftHandovers())
  const [selectedRecord, setSelectedRecord] = useState<ShiftHandoverEntry | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [shiftFilter, setShiftFilter] = useState('all')
  const [machineFilter, setMachineFilter] = useState('all')
  const [operatorFilter, setOperatorFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  const machines = useMemo(() => {
    const unique = new Set<string>()
    records.forEach((record) => {
      record.items.forEach((item) => {
        if (item.machineName) unique.add(item.machineName)
      })
    })
    return Array.from(unique)
  }, [records])

  const operators = useMemo(() => {
    const unique = new Set<string>()
    records.forEach((record) => {
      record.items.forEach((item) => {
        if (item.operatorName) unique.add(item.operatorName)
      })
    })
    return Array.from(unique)
  }, [records])

  const activeFilterCount = useMemo(() => {
    return [
      shiftFilter !== 'all',
      machineFilter !== 'all',
      operatorFilter !== 'all',
      Boolean(startDate),
      Boolean(endDate),
    ].filter(Boolean).length
  }, [shiftFilter, machineFilter, operatorFilter, startDate, endDate])

  const filteredRecords = useMemo(() => {
    const search = searchTerm.toLowerCase().trim()
    return records.filter((record) => {
      if (shiftFilter !== 'all' && record.productionShift !== shiftFilter) return false
      if (startDate && record.date < startDate) return false
      if (endDate && record.date > endDate) return false

      const hasMachine =
        machineFilter === 'all' ||
        record.items.some((item) => item.machineName.toLowerCase() === machineFilter.toLowerCase())
      if (!hasMachine) return false

      const hasOperator =
        operatorFilter === 'all' ||
        record.items.some((item) => item.operatorName.toLowerCase() === operatorFilter.toLowerCase())
      if (!hasOperator) return false

      if (!search) return true
      return (
        record.reportNumber.toLowerCase().includes(search) ||
        record.items.some(
          (item) =>
            item.machineName.toLowerCase().includes(search) ||
            item.operatorName.toLowerCase().includes(search) ||
            item.runningItemDescription.toLowerCase().includes(search)
        )
      )
    })
  }, [records, searchTerm, shiftFilter, machineFilter, operatorFilter, startDate, endDate])

  const handleDelete = (record: ShiftHandoverEntry) => {
    if (window.confirm('Delete this shift handover sheet?')) {
      const updated = deleteShiftHandover(record.id)
      setRecords(updated)
      setSuccessMessage('Shift handover sheet deleted.')
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  const resetFilters = () => {
    setShiftFilter('all')
    setMachineFilter('all')
    setOperatorFilter('all')
    setStartDate('')
    setEndDate('')
    setShowFilters(false)
  }

  useEffect(() => {
    const success = (location.state as any)?.success
    if (success) {
      setSuccessMessage(success)
      setRecords(loadShiftHandovers())
      setTimeout(() => setSuccessMessage(null), 3000)
      navigate(location.pathname, { replace: true })
    }
  }, [location.pathname, location.state, navigate])

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Shift Handover Sheets</h1>
            <p className="text-slate-600 mt-1">
              Capture shift-to-shift context on machine status, pending issues, and next actions.
            </p>
          </div>
          <Button
            onClick={() => navigate('/shift-handovers/new')}
            className="flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Create Handover Sheet</span>
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
                placeholder="Search by report, machine, operator, or running item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="md:w-96"
              />
              <Button
                type="button"
                variant={showFilters ? 'default' : 'outline'}
                className={`${showFilters ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''} rounded-full`}
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
              <div className="grid md:grid-cols-5 gap-4 rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase text-slate-500">Shift</Label>
                  <select
                    value={shiftFilter}
                    onChange={(e) => setShiftFilter(e.target.value)}
                    className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm"
                  >
                    <option value="all">All shifts</option>
                    <option value="Day">Day</option>
                    <option value="Night">Night</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase text-slate-500">Machine</Label>
                  <select
                    value={machineFilter}
                    onChange={(e) => setMachineFilter(e.target.value)}
                    className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm"
                  >
                    <option value="all">All machines</option>
                    {machines.map((machine) => (
                      <option key={machine} value={machine}>
                        {machine}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase text-slate-500">Operator</Label>
                  <select
                    value={operatorFilter}
                    onChange={(e) => setOperatorFilter(e.target.value)}
                    className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm"
                  >
                    <option value="all">All operators</option>
                    {operators.map((operator) => (
                      <option key={operator} value={operator}>
                        {operator}
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
                    variant="ghost"
                    className="text-slate-600 hover:text-rose-600"
                    onClick={resetFilters}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-md border border-t border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Machines Covered</TableHead>
                  <TableHead>Issues Logged</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No shift handover sheets yet. Click “Create Handover Sheet” to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="font-semibold text-slate-900">{record.reportNumber}</div>
                        <div className="text-xs text-slate-500">Created {new Date(record.createdAt).toLocaleString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {record.date}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                          {record.productionShift}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-slate-800">
                          {record.items.map((item) => item.machineName).join(', ')}
                        </div>
                        <div className="text-xs text-slate-500">
                          Operators: {record.items.map((item) => item.operatorName).join(', ')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-700">
                          {record.items.filter((item) => item.issue).length || 'No issues'}
                        </div>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="inline-flex items-center gap-1 rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="inline-flex items-center gap-1 rounded-full border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                          onClick={() => navigate(`/shift-handovers/${record.id}/edit`)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(record)}
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

        <SlideOver
          open={!!selectedRecord}
          onOpenChange={(open) => {
            if (!open) setSelectedRecord(null)
          }}
          title="Shift Handover Summary"
          description="Full detail of machines, issues, and approvals for the selected shift."
        >
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase text-slate-500">Report Number</Label>
                  <div className="font-medium">{selectedRecord.reportNumber}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Date</Label>
                  <div className="font-medium">{selectedRecord.date}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Shift</Label>
                  <div className="font-medium">{selectedRecord.productionShift}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Created</Label>
                  <div className="font-medium">
                    {new Date(selectedRecord.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs uppercase text-slate-500">Machines & Status</Label>
                <div className="space-y-3">
                  {selectedRecord.items.map((item, idx) => (
                    <div key={`${item.machineName}-${idx}`} className="rounded-xl border border-slate-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{item.machineName}</div>
                          <div className="text-xs text-slate-500">{item.operatorName} • {item.shift} shift</div>
                        </div>
                        <div className="text-xs font-semibold text-rose-700">
                          Target {item.targetQty} / Done {item.completedQty}
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-slate-700">{item.runningItemDescription}</div>
                      {item.manualWorkDone && (
                        <div className="mt-2 text-xs text-slate-500">
                          Manual work: {item.manualWorkDone}
                        </div>
                      )}
                      {item.issue && (
                        <div className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                          Issue: {item.issue}
                        </div>
                      )}
                      {item.nextAction && (
                        <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                          Next action: {item.nextAction}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedRecord.note && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <strong>Note:</strong> {selectedRecord.note}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedRecord.dayShiftInCharge && (
                  <div>
                    <Label className="text-xs uppercase text-slate-500">Day Shift In-Charge</Label>
                    <div className="font-medium">{selectedRecord.dayShiftInCharge}</div>
                  </div>
                )}
                {selectedRecord.nightShiftInCharge && (
                  <div>
                    <Label className="text-xs uppercase text-slate-500">Night Shift In-Charge</Label>
                    <div className="font-medium">{selectedRecord.nightShiftInCharge}</div>
                  </div>
                )}
                {selectedRecord.productionManager && (
                  <div className="col-span-2">
                    <Label className="text-xs uppercase text-slate-500">Production Manager</Label>
                    <div className="font-medium">{selectedRecord.productionManager}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </SlideOver>
      </div>
    </MainLayout>
  )
}








