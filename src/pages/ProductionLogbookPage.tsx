import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
import { Eye, Pencil, Trash2, Plus } from 'lucide-react'
import { deleteProductionLog, loadProductionLogs, ProductionLogEntry } from '../lib/productionLogbookStorage'

export default function ProductionLogbookPage() {
  const [records, setRecords] = useState<ProductionLogEntry[]>(() => loadProductionLogs())
  const [selectedRecord, setSelectedRecord] = useState<ProductionLogEntry | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [shiftFilter, setShiftFilter] = useState('all')
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

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (shiftFilter !== 'all' && record.shift !== shiftFilter) return false
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const match =
          record.productName.toLowerCase().includes(search) ||
          record.machineName.toLowerCase().includes(search) ||
          record.productOrderNumber.toLowerCase().includes(search) ||
          record.shiftIncharge.toLowerCase().includes(search)
        if (!match) return false
      }
      return true
    })
  }, [records, shiftFilter, searchTerm])

  const handleDelete = (record: ProductionLogEntry) => {
    if (window.confirm('Delete this log entry?')) {
      const updated = deleteProductionLog(record.id)
      setRecords(updated)
      setSuccessMessage('Production log deleted.')
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  useEffect(() => {
    const success = (location.state as any)?.success
    if (success) {
      setSuccessMessage(success)
      setRecords(loadProductionLogs())
      setTimeout(() => setSuccessMessage(null), 3000)
      navigate(location.pathname, { replace: true })
    }
  }, [location.pathname, location.state, navigate])

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Production Logbook</h1>
            <p className="text-slate-600 mt-1">Monitor daily shift performance, machine utilization, and operator handoffs.</p>
          </div>
          <Button
            onClick={() => navigate('/production-logbook/new')}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Create Log Entry</span>
          </Button>
        </div>

        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 text-sm">
            {successMessage}
          </div>
        )}

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-3 space-y-3 md:space-y-0">
                <Input
                  placeholder="Search by product, machine, order, or incharge..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="md:w-96"
                />
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
              </div>
              <Button
                variant="outline"
                onClick={() => setRecords(loadProductionLogs())}
                className="rounded-full border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                Refresh Records
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Machine</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Produced Qty</TableHead>
                    <TableHead>Process Stage</TableHead>
                    <TableHead>Operators</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        No production log entries yet. Use “Create Log Entry” to capture a shift.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="font-medium">{record.date}</div>
                          <div className="text-xs text-muted-foreground">{record.shiftIncharge}</div>
                        </TableCell>
                        <TableCell>{record.shift}</TableCell>
                        <TableCell>
                          <div className="font-medium">{record.machineName}</div>
                          <div className="text-xs text-muted-foreground">{record.department}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{record.productName}</div>
                          <div className="text-xs text-muted-foreground">{record.productOrderNumber}</div>
                        </TableCell>
                        <TableCell>{record.producedQuantity || '-'}</TableCell>
                        <TableCell>{record.processStage || '-'}</TableCell>
                        <TableCell>
                          <div className="text-xs">
                            Out: {record.outgoingOperator || '—'} <br />
                            In: {record.incomingOperator || '—'}
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
                            onClick={() => navigate(`/production-logbook/${record.id}/edit`)}
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
          title="Log Entry Summary"
          description="Review detailed production data."
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
                  <Label className="text-xs uppercase text-slate-500">Shift Incharge</Label>
                  <div className="font-medium">{selectedRecord.shiftIncharge}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Department</Label>
                  <div className="font-medium">{selectedRecord.department}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase text-slate-500">Machine</Label>
                  <div className="font-medium">{selectedRecord.machineName}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Product</Label>
                  <div className="font-medium">{selectedRecord.productName}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Time In / Out</Label>
                  <div className="font-medium">
                    {selectedRecord.timeIn} - {selectedRecord.timeOut}
                  </div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Order No.</Label>
                  <div className="font-medium">{selectedRecord.productOrderNumber}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs uppercase text-slate-500">Order Qty.</Label>
                  <div className="font-medium">{selectedRecord.orderQuantity || '—'}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Produced Qty.</Label>
                  <div className="font-medium">{selectedRecord.producedQuantity || '—'}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Rejection Qty.</Label>
                  <div className="font-medium">{selectedRecord.rejectionQuantity || '—'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase text-slate-500">Process Stage</Label>
                  <div className="font-medium">{selectedRecord.processStage || '—'}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Run Hour</Label>
                  <div className="font-medium">{selectedRecord.totalMachineRunHour || '—'}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Tool Break</Label>
                  <div className="font-medium">{selectedRecord.toolBreakQuantity || '—'}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Machine Down Time</Label>
                  <div className="font-medium">{selectedRecord.machineDownTime || '—'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase text-slate-500">Outgoing Operator</Label>
                  <div className="font-medium">{selectedRecord.outgoingOperator || '—'}</div>
                </div>
                <div>
                  <Label className="text-xs uppercase text-slate-500">Incoming Operator</Label>
                  <div className="font-medium">{selectedRecord.incomingOperator || '—'}</div>
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

