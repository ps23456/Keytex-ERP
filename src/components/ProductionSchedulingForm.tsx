import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import {
  ProductionSchedulingFormData,
  calculateSchedulingMetrics,
  productionSchedulingSchema,
  safeNumber,
} from '../lib/productionSchedulingSchema'

interface ProductionSchedulingFormProps {
  initialData?: Partial<ProductionSchedulingFormData>
  onSubmit: (_data: ProductionSchedulingFormData) => Promise<void> | void
  isLoading?: boolean
}

export default function ProductionSchedulingForm({
  initialData,
  onSubmit,
  isLoading = false,
}: ProductionSchedulingFormProps) {
  const [submitted, setSubmitted] = useState(false)

  const defaultValues = useMemo<ProductionSchedulingFormData>(
    () => ({
      serialNumber: initialData?.serialNumber || '',
      operatorName: initialData?.operatorName || '',
      date: initialData?.date || new Date().toISOString().slice(0, 10),
      shift: initialData?.shift || '',
      productDescription: initialData?.productDescription || '',
      totalShiftHours:
        typeof initialData?.totalShiftHours === 'number'
          ? safeNumber(initialData?.totalShiftHours)
          : 8,
      totalQty: safeNumber(initialData?.totalQty),
      targetQty: safeNumber(initialData?.targetQty),
      numberOfSetups: safeNumber(initialData?.numberOfSetups),
      settingTimeMinutes: safeNumber(initialData?.settingTimeMinutes),
      programSettingTimeMinutes: safeNumber(initialData?.programSettingTimeMinutes),
      cycleTimeMinutes: safeNumber(initialData?.cycleTimeMinutes),
      loadingUnloadingTimeMinutes: safeNumber(initialData?.loadingUnloadingTimeMinutes),
      lunchTimeMinutes: safeNumber(initialData?.lunchTimeMinutes),
      effectiveTimeHours: safeNumber(initialData?.effectiveTimeHours),
      producedQty: safeNumber(initialData?.producedQty),
      reworkMaterialQty: safeNumber(initialData?.reworkMaterialQty),
      rejectionMaterialQty: safeNumber(initialData?.rejectionMaterialQty),
      remarks: initialData?.remarks || '',
    }),
    [initialData]
  )

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<ProductionSchedulingFormData>({
    resolver: zodResolver(productionSchedulingSchema),
    defaultValues,
    mode: 'onChange',
  })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  const watchValues = watch()
  const metrics = calculateSchedulingMetrics(watchValues)

  const calculatedEffectiveTime = Math.max(
    safeNumber(watchValues.totalShiftHours) - safeNumber(watchValues.lunchTimeMinutes) / 60,
    0
  )

  const handleFormSubmit = async (data: ProductionSchedulingFormData) => {
    await onSubmit(data)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2500)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-white/90">Keytex Machines</p>
            <h2 className="text-3xl font-semibold text-white">Production Scheduling Sheet</h2>
            <p className="text-sm text-white/90 max-w-3xl">
              Plan 3-day CNC production priorities, capture cycle calculations, and align shift targets before execution.
            </p>
          </div>
          <div className="grid w-full gap-3 md:grid-cols-2 lg:w-auto">
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/85">Operator</p>
              <p className="text-lg font-semibold text-white">
                {watchValues.operatorName ? watchValues.operatorName : '—'}
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/85">Shift</p>
              <p className="text-lg font-semibold text-white">{watchValues.shift || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Serial No.</Label>
            <Input placeholder="Auto / Manual" {...register('serialNumber')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Operator Name</Label>
            <Input placeholder="Operator responsible" {...register('operatorName')} />
            {errors.operatorName && <p className="text-xs text-destructive">{errors.operatorName.message}</p>}
          </div>
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
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Product Description</Label>
            <Input placeholder="Component or process" {...register('productDescription')} />
            {errors.productDescription && (
              <p className="text-xs text-destructive">{errors.productDescription.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Total Shift Hours</Label>
            <Input type="number" step="0.25" {...register('totalShiftHours', { valueAsNumber: true })} />
            {errors.totalShiftHours && <p className="text-xs text-destructive">{errors.totalShiftHours.message}</p>}
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Total Qty (A)</Label>
            <Input type="number" {...register('totalQty', { valueAsNumber: true })} />
            {errors.totalQty && <p className="text-xs text-destructive">{errors.totalQty.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Target Qty (B)</Label>
            <Input type="number" {...register('targetQty', { valueAsNumber: true })} />
            {errors.targetQty && <p className="text-xs text-destructive">{errors.targetQty.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Balance Qty (C = A - B)</Label>
            <Input value={metrics.balanceQty.toFixed(2)} readOnly className="bg-slate-50" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">No. of Setup</Label>
            <Input type="number" {...register('numberOfSetups', { valueAsNumber: true })} />
            {errors.numberOfSetups && <p className="text-xs text-destructive">{errors.numberOfSetups.message}</p>}
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Setting Time (min) (G)</Label>
            <Input type="number" {...register('settingTimeMinutes', { valueAsNumber: true })} />
            {errors.settingTimeMinutes && <p className="text-xs text-destructive">{errors.settingTimeMinutes.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Program Setting Time (min) (H)</Label>
            <Input type="number" {...register('programSettingTimeMinutes', { valueAsNumber: true })} />
            {errors.programSettingTimeMinutes && (
              <p className="text-xs text-destructive">{errors.programSettingTimeMinutes.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Total Setting Time (hr) (L=G+H)</Label>
            <Input value={metrics.totalSettingTimeHour.toFixed(2)} readOnly className="bg-slate-50" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Cycle Time (min)</Label>
            <Input type="number" {...register('cycleTimeMinutes', { valueAsNumber: true })} />
            {errors.cycleTimeMinutes && <p className="text-xs text-destructive">{errors.cycleTimeMinutes.message}</p>}
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Loading & Unloading Time (min)</Label>
            <Input type="number" {...register('loadingUnloadingTimeMinutes', { valueAsNumber: true })} />
            {errors.loadingUnloadingTimeMinutes && (
              <p className="text-xs text-destructive">{errors.loadingUnloadingTimeMinutes.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Total Cycle Time (min)</Label>
            <Input value={metrics.totalCycleTimeMinutes.toFixed(2)} readOnly className="bg-slate-50" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Time / Piece (hr)</Label>
            <Input value={metrics.timePerPieceHour.toFixed(3)} readOnly className="bg-slate-50" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Lunch Time (min)</Label>
            <Input type="number" {...register('lunchTimeMinutes', { valueAsNumber: true })} />
            {errors.lunchTimeMinutes && <p className="text-xs text-destructive">{errors.lunchTimeMinutes.message}</p>}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Effective Time (hr)</Label>
            <Input type="number" {...register('effectiveTimeHours', { valueAsNumber: true })} />
            {errors.effectiveTimeHours && <p className="text-xs text-destructive">{errors.effectiveTimeHours.message}</p>}
            <p className="text-[11px] text-slate-500">
              Suggested: {calculatedEffectiveTime.toFixed(2)} hr (Shift hrs − Lunch)
            </p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Target Time (hr) = B × Time/Pc</Label>
            <Input value={metrics.targetTimeHour.toFixed(2)} readOnly className="bg-slate-50" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Produced Qty</Label>
            <Input type="number" {...register('producedQty', { valueAsNumber: true })} />
            {errors.producedQty && <p className="text-xs text-destructive">{errors.producedQty.message}</p>}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Rework Material Qty</Label>
            <Input type="number" {...register('reworkMaterialQty', { valueAsNumber: true })} />
            {errors.reworkMaterialQty && <p className="text-xs text-destructive">{errors.reworkMaterialQty.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Rejected Material Qty</Label>
            <Input type="number" {...register('rejectionMaterialQty', { valueAsNumber: true })} />
            {errors.rejectionMaterialQty && (
              <p className="text-xs text-destructive">{errors.rejectionMaterialQty.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase text-slate-500">Remarks</Label>
          <Textarea rows={3} placeholder="Constraints, tooling availability, shift notes" {...register('remarks')} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pb-4">
        <Button type="submit" disabled={!isValid || isLoading} className="bg-amber-600 text-white hover:bg-amber-700">
          {isLoading ? 'Saving...' : submitted ? 'Saved' : 'Save Scheduling Sheet'}
        </Button>
      </div>
    </form>
  )
}


