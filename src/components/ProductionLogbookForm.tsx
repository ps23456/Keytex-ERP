import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Button } from './ui/button'

const productionLogSchema = z.object({
  shiftIncharge: z.string().min(1, 'Shift incharge is required'),
  department: z.string().min(1, 'Department is required'),
  date: z.string().min(1, 'Date is required'),
  shift: z.string().min(1, 'Shift is required'),
  timeIn: z.string().min(1, 'Time in is required'),
  timeOut: z.string().min(1, 'Time out is required'),
  machineName: z.string().min(1, 'Machine name is required'),
  productOrderNumber: z.string().min(1, 'Product order number is required'),
  productName: z.string().min(1, 'Product name is required'),
  setupTime: z.string().optional(),
  cycleTime: z.string().optional(),
  orderQuantity: z.string().optional(),
  producedQuantity: z.string().optional(),
  processStage: z.string().optional(),
  rejectionQuantity: z.string().optional(),
  totalMachineRunHour: z.string().optional(),
  toolBreakQuantity: z.string().optional(),
  machineDownTime: z.string().optional(),
  outgoingOperator: z.string().optional(),
  incomingOperator: z.string().optional(),
  remarks: z.string().optional(),
})

export type ProductionLogFormData = z.infer<typeof productionLogSchema>

interface ProductionLogbookFormProps {
  initialData?: Partial<ProductionLogFormData>
  onSubmit: (data: ProductionLogFormData) => Promise<void> | void
  isLoading?: boolean
}

const generateTicketNumber = () => `PL-${Date.now().toString().slice(-6)}`

export default function ProductionLogbookForm({ initialData, onSubmit, isLoading = false }: ProductionLogbookFormProps) {
  const [submitted, setSubmitted] = useState(false)

  const defaultValues = useMemo<ProductionLogFormData>(() => ({
    shiftIncharge: initialData?.shiftIncharge || '',
    department: initialData?.department || '',
    date: initialData?.date || new Date().toISOString().slice(0, 10),
    shift: initialData?.shift || '',
    timeIn: initialData?.timeIn || '',
    timeOut: initialData?.timeOut || '',
    machineName: initialData?.machineName || '',
    productOrderNumber: initialData?.productOrderNumber || '',
    productName: initialData?.productName || '',
    setupTime: initialData?.setupTime || '',
    cycleTime: initialData?.cycleTime || '',
    orderQuantity: initialData?.orderQuantity || '',
    producedQuantity: initialData?.producedQuantity || '',
    processStage: initialData?.processStage || '',
    rejectionQuantity: initialData?.rejectionQuantity || '',
    totalMachineRunHour: initialData?.totalMachineRunHour || '',
    toolBreakQuantity: initialData?.toolBreakQuantity || '',
    machineDownTime: initialData?.machineDownTime || '',
    outgoingOperator: initialData?.outgoingOperator || '',
    incomingOperator: initialData?.incomingOperator || '',
    remarks: initialData?.remarks || '',
  }), [initialData])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ProductionLogFormData>({
    resolver: zodResolver(productionLogSchema),
    defaultValues,
    mode: 'onChange',
  })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  const handleFormSubmit = async (data: ProductionLogFormData) => {
    await onSubmit(data)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2500)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="rounded-3xl border border-orange-200 bg-gradient-to-r from-indigo-600 via-violet-500 to-rose-500 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-white/90">Keytex Machines</p>
            <h2 className="text-3xl font-semibold text-white">Production Logbook</h2>
            <p className="text-sm text-white/90 max-w-3xl">
              Capture shift-wise production data including machine utilization, process stages, and operator handoffs.
            </p>
          </div>
          <div className="grid w-full gap-3 md:grid-cols-2 lg:w-auto">
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/85">Ticket</p>
              <p className="text-lg font-semibold text-white">{initialData?.productOrderNumber || generateTicketNumber()}</p>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/85">Status</p>
              <p className="text-lg font-semibold text-white">Draft</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Shift Incharge</Label>
            <Input placeholder="Enter shift incharge name" {...register('shiftIncharge')} />
            {errors.shiftIncharge && <p className="text-xs text-destructive">{errors.shiftIncharge.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Department</Label>
            <Input placeholder="Dept / Cell" {...register('department')} />
            {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Date</Label>
            <Input type="date" {...register('date')} />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Shift</Label>
            <Input placeholder="A / B / C" {...register('shift')} />
            {errors.shift && <p className="text-xs text-destructive">{errors.shift.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Time In</Label>
            <Input type="time" {...register('timeIn')} />
            {errors.timeIn && <p className="text-xs text-destructive">{errors.timeIn.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Time Out</Label>
            <Input type="time" {...register('timeOut')} />
            {errors.timeOut && <p className="text-xs text-destructive">{errors.timeOut.message}</p>}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Machine Name</Label>
            <Input placeholder="Machine / Workcenter" {...register('machineName')} />
            {errors.machineName && <p className="text-xs text-destructive">{errors.machineName.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Product Order No.</Label>
            <Input placeholder="PO / Work order" {...register('productOrderNumber')} />
            {errors.productOrderNumber && <p className="text-xs text-destructive">{errors.productOrderNumber.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Product Name</Label>
            <Input placeholder="Component" {...register('productName')} />
            {errors.productName && <p className="text-xs text-destructive">{errors.productName.message}</p>}
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Setup Time (min)</Label>
            <Input placeholder="00:00" {...register('setupTime')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Cycle Time (min)</Label>
            <Input placeholder="00:00" {...register('cycleTime')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Order Qty.</Label>
            <Input placeholder="Qty" {...register('orderQuantity')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Produced Qty.</Label>
            <Input placeholder="Qty" {...register('producedQuantity')} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Process Stage</Label>
            <Input placeholder="Roughing / Finishing / QC" {...register('processStage')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Rejection Qty.</Label>
            <Input placeholder="Qty" {...register('rejectionQuantity')} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Total Machine Run Hour</Label>
            <Input placeholder="HH:MM" {...register('totalMachineRunHour')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Tool Break Qty.</Label>
            <Input placeholder="Qty" {...register('toolBreakQuantity')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Machine Down Time (min)</Label>
            <Input placeholder="Minutes" {...register('machineDownTime')} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Outgoing Operator</Label>
            <Input placeholder="Outgoing operator" {...register('outgoingOperator')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Incoming Operator</Label>
            <Input placeholder="Incoming operator" {...register('incomingOperator')} />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase text-slate-500">Remarks</Label>
          <Textarea rows={3} placeholder="General notes, tooling issues, inspection comments" {...register('remarks')} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pb-4">
        <Button type="submit" disabled={!isValid || isLoading} className="bg-indigo-600 text-white hover:bg-indigo-700">
          {isLoading ? 'Saving...' : submitted ? 'Saved' : 'Save Log Entry'}
        </Button>
      </div>
    </form>
  )
}

