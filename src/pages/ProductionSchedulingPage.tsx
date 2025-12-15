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
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  ProductionSchedulingEntry,
  deleteProductionSchedule,
  loadProductionSchedules,
} from '../lib/productionSchedulingStorage'

export default function ProductionSchedulingPage() {
  const [records, setRecords] = useState<ProductionSchedulingEntry[]>(() => loadProductionSchedules())
  const [selectedRecord, setSelectedRecord] = useState<ProductionSchedulingEntry | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [shiftFilter, setShiftFilter] = useState('all')
  const [operatorFilter, setOperatorFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const navigate = useNavigate()
  const location = useLocation()

  const shifts = useMemo(() => {
    const unique = new Set<string>()
    records.forEach((record) => {
      if (record.shift) unique.add(record.shift)
    })
    return Array.from(unique)
  }, [records])

  const operators = useMemo(() => {
    const unique = new Set<string>()
    records.forEach((record) => {
      if (record.operatorName) unique.add(record.operatorName)
    })
    return Array.from(unique)
  }, [records])

  const filteredRecords = useMemo(() => {
    const search = searchTerm.toLowerCase().trim()
    return records.filter((record) => {
      if (shiftFilter !== 'all' && record.shift !== shiftFilter) return false
      if (operatorFilter !== 'all' && record.operatorName !== operatorFilter) return false
      if (startDate && record.date < startDate) return false
      if (endDate && record.date > endDate) return false
      if (!search) return true
      return (
        record.productDescription.toLowerCase().includes(search) ||
        record.operatorName.toLowerCase().includes(search) ||
        record.remarks?.toLowerCase().includes(search)
      )
    })
  }, [records, searchTerm, shiftFilter, operatorFilter, startDate, endDate])

  const resetFilters = () => {
    setShiftFilter('all')
    setOperatorFilter('all')
    setStartDate('')
    setEndDate('')
    setSearchTerm('')
  }

  const totals = useMemo(
    () =>
      filteredRecords.reduce(
        (acc, record) => {
          acc.target += record.targetQty || 0
          acc.produced += record.producedQty || 0
          acc.balance += record.balanceQty || 0
          return acc
        },
        { target: 0, produced: 0, balance: 0 }
      ),
    [filteredRecords]
  )

  const handleDelete = (record: ProductionSchedulingEntry) => {
    if (window.confirm('Delete this scheduling sheet?')) {
      const updated = deleteProductionSchedule(record.id)
      setRecords(updated)
      setSuccessMessage('Scheduling sheet deleted.')
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  useEffect(() => {
    const success = (location.state as any)?.success
    if (success) {
      setSuccessMessage(success)
      setRecords(loadProductionSchedules())
      setTimeout(() => setSuccessMessage(null), 3000)
      navigate(location.pathname, { replace: true })
    }
  }, [location.pathname, location.state, navigate])

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Production Scheduling Sheet</h1>
            <p className="text-slate-600 mt-1">
              Translate 3-day CNC plans into actionable shift-level targets, track time studies, and monitor output.
            </p>
          </div>
          <Button
            onClick={() => navigate('/production-scheduling/new')}
            className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Add Scheduling Sheet</span>
          </Button>
        </div>

        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 text-sm">
            {successMessage}
          </div>
        )}

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="p-6 space-y-4">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-3 space-y-3 md:space-y-0">
                <Input
                  placeholder="Search by product, operator, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="md:w-80"
                />
                <div className="flex flex-wrap gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Shift</Label>
                    <select
                      value={shiftFilter}
                      onChange={(e) => setShiftFilter(e.target.value)}
                      className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm"
                    >
                      <option value="all">All shifts</option>
                      {shifts.map((shift) => (
                        <option key={shift} value={shift}>
                          {shift}
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
                  <div className="flex items-end pb-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50"
                      onClick={resetFilters}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
              <div className="text-sm rounded-2xl bg-slate-50 border border-slate-200 px-4 py-2">
                <span className="font-semibold text-slate-700">Totals:</span>{' '}
                Target {totals.target.toFixed(0)} pcs • Produced {totals.produced.toFixed(0)} pcs • Balance{' '}
                {totals.balance.toFixed(0)} pcs
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Target Qty</TableHead>
                    <TableHead>Produced Qty</TableHead>
                    <TableHead>Balance Qty</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        No scheduling sheet entries yet. Use “Add Scheduling Sheet” to plan production.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="font-medium">{record.date}</div>
                          <div className="text-xs text-muted-foreground">{record.serialNumber || '—'}</div>
                        </TableCell>
                        <TableCell>{record.shift}</TableCell>
                        <TableCell>
                          <div className="font-medium">{record.operatorName}</div>
                          <div className="text-xs text-muted-foreground">
                            Eff. {record.effectiveTimeHours?.toFixed(2)} hr
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium truncate max-w-[140px]">{record.productDescription}</div>
                          <div className="text-xs text-muted-foreground">
                            Cycle {record.cycleTimeMinutes?.toFixed(1)} min
                          </div>
                        </TableCell>
                        <TableCell>{record.targetQty?.toLocaleString()}</TableCell>
                        <TableCell>{record.producedQty?.toLocaleString()}</TableCell>
                        <TableCell>{record.balanceQty?.toLocaleString(undefined, { maximumFractionDigits: 1 })}</TableCell>
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
                            onClick={() => navigate(`/production-scheduling/${record.id}/edit`)}
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
          title="Scheduling Sheet Summary"
          description="Detailed breakdown of cycle calculations and shift targets."
        >
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase text-slate-500">Date</Label>
                  <div className="font-medium">{selectedRecord.date}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Shift</Label>
                  <div className="font-medium">{selectedRecord.shift}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Operator</Label>
                  <div className="font-medium">{selectedRecord.operatorName}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Total Shift Hours</Label>
                  <div className="font-medium">{selectedRecord.totalShiftHours} hr</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase text-slate-500">Product Description</Label>
                  <div className="font-medium">{selectedRecord.productDescription}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Number of Setups</Label>
                  <div className="font-medium">{selectedRecord.numberOfSetups}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs uppercase text-slate-500">Total Qty (A)</Label>
                  <div className="font-medium">{selectedRecord.totalQty}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Target Qty (B)</Label>
                  <div className="font-medium">{selectedRecord.targetQty}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Balance Qty (C)</Label>
                  <div className="font-medium">{selectedRecord.balanceQty.toFixed(2)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase text-slate-500">Setting Time (min)</Label>
                  <div className="font-medium">{selectedRecord.settingTimeMinutes}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Program Setting Time (min)</Label>
                  <div className="font-medium">{selectedRecord.programSettingTimeMinutes}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Total Setting Time (hr)</Label>
                  <div className="font-medium">{selectedRecord.totalSettingTimeHour.toFixed(2)}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Cycle Time (min)</Label>
                  <div className="font-medium">{selectedRecord.cycleTimeMinutes}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase text-slate-500">Loading & Unloading (min)</Label>
                  <div className="font-medium">{selectedRecord.loadingUnloadingTimeMinutes}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Total Cycle Time (min)</Label>
                  <div className="font-medium">{selectedRecord.totalCycleTimeMinutes.toFixed(2)}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Time / Piece (hr)</Label>
                  <div className="font-medium">{selectedRecord.timePerPieceHour.toFixed(3)}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Target Time (hr)</Label>
                  <div className="font-medium">{selectedRecord.targetTimeHour.toFixed(2)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase text-slate-500">Lunch Time (min)</Label>
                  <div className="font-medium">{selectedRecord.lunchTimeMinutes}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Effective Time (hr)</Label>
                  <div className="font-medium">{selectedRecord.effectiveTimeHours}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs uppercase text-slate-500">Produced Qty</Label>
                  <div className="font-medium">{selectedRecord.producedQty}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Rework Qty</Label>
                  <div className="font-medium">{selectedRecord.reworkMaterialQty}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Rejected Qty</Label>
                  <div className="font-medium">{selectedRecord.rejectionMaterialQty}</div>
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase text-slate-500">Remarks</Label>
                <div className="font-medium text-slate-700">{selectedRecord.remarks || 'No remarks recorded.'}</div>
              </div>
            </div>
          )}
        </SlideOver>
      </div>
    </MainLayout>
  )
}


