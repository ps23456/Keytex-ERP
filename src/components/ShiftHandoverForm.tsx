import { useEffect, useMemo } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ClipboardList, Plus, Trash2, Users2 } from 'lucide-react'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Button } from './ui/button'
import {
  ShiftHandoverFormData,
  generateShiftHandoverNumber,
  shiftHandoverSchema,
} from '../lib/shiftHandoverSchema'

interface ShiftHandoverFormProps {
  initialData?: Partial<ShiftHandoverFormData>
  onSubmit: (data: ShiftHandoverFormData) => Promise<void>
  isLoading?: boolean
}

const defaultLineItem = {
  machineName: '',
  shift: 'Day',
  operatorName: '',
  runningItemDescription: '',
  targetQty: '',
  completedQty: '',
  manualWorkDone: '',
  issue: '',
  nextAction: '',
  operatorSign: '',
}

export default function ShiftHandoverForm({
  initialData,
  onSubmit,
  isLoading = false,
}: ShiftHandoverFormProps) {
  const defaultValues: ShiftHandoverFormData = useMemo(
    () => ({
      reportNumber: initialData?.reportNumber || generateShiftHandoverNumber(),
      date: initialData?.date || new Date().toISOString().slice(0, 10),
      productionShift: initialData?.productionShift || 'Day',
      items:
        initialData?.items && initialData.items.length > 0
          ? initialData.items
          : [{ ...defaultLineItem }],
      note: initialData?.note || '',
      dayShiftInCharge: initialData?.dayShiftInCharge || '',
      nightShiftInCharge: initialData?.nightShiftInCharge || '',
      productionManager: initialData?.productionManager || '',
    }),
    [initialData]
  )

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
    watch,
  } = useForm<ShiftHandoverFormData>({
    resolver: zodResolver(shiftHandoverSchema),
    mode: 'onChange',
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  const watchedShift = watch('productionShift')
  const watchedDate = watch('date')

  const handleFormSubmit = async (data: ShiftHandoverFormData) => {
    await onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-rose-600 to-orange-500 text-white px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <ClipboardList className="h-8 w-8" />
            </div>
            <div>
              <p className="uppercase tracking-[0.3em] text-xs font-semibold text-white/70">Shift Handover</p>
              <h2 className="text-2xl font-bold mt-1">Shift Handover Sheet</h2>
              <div className="flex flex-wrap gap-6 text-sm text-white/80 mt-3">
                <div className="flex items-center space-x-2">
                  <Users2 className="h-4 w-4" />
                  <span>Shift: {watchedShift}</span>
                </div>
                <div>Report #: <span className="font-semibold text-white">{watch('reportNumber')}</span></div>
              </div>
            </div>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-3 text-right">
            <div className="text-xs uppercase tracking-widest text-white/80">Date</div>
            <div className="text-lg font-semibold">{watchedDate}</div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6 bg-white">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Report Number</Label>
              <Input placeholder="SH-000000" {...register('reportNumber')} />
              {errors.reportNumber && <p className="text-xs text-destructive">{errors.reportNumber.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Date</Label>
              <Input type="date" {...register('date')} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Production Shift</Label>
              <select
                {...register('productionShift')}
                className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm"
              >
                <option value="Day">Day</option>
                <option value="Night">Night</option>
                <option value="General">General</option>
              </select>
              {errors.productionShift && (
                <p className="text-xs text-destructive">{errors.productionShift.message}</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[140px]">Machine Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[100px]">Shift</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[140px]">Operator</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[200px]">Running Item Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[110px]">Target Qty/Shift</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[130px]">Completed Qty/Shift</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[160px]">Manual work Done</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[150px]">Issue</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[150px]">Next action</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[130px]">Operator Sign</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[80px]">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {fields.map((field, index) => (
                    <tr key={field.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <Input 
                          placeholder="Machine name" 
                          className="w-full min-w-[120px]"
                          {...register(`items.${index}.machineName` as const)} 
                        />
                        {errors.items?.[index]?.machineName && (
                          <p className="text-xs text-destructive mt-1">{errors.items[index]?.machineName?.message}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <select
                          {...register(`items.${index}.shift` as const)}
                          className="h-10 w-full min-w-[80px] rounded-md border border-input bg-white px-3 py-2 text-sm"
                        >
                          <option value="Day">Day</option>
                          <option value="Night">Night</option>
                          <option value="General">General</option>
                        </select>
                        {errors.items?.[index]?.shift && (
                          <p className="text-xs text-destructive mt-1">{errors.items[index]?.shift?.message}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <Input 
                          placeholder="Operator name" 
                          className="w-full min-w-[120px]"
                          {...register(`items.${index}.operatorName` as const)} 
                        />
                        {errors.items?.[index]?.operatorName && (
                          <p className="text-xs text-destructive mt-1">{errors.items[index]?.operatorName?.message}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Textarea
                          rows={2}
                          placeholder="Running item description"
                          className="w-full min-w-[180px]"
                          {...register(`items.${index}.runningItemDescription` as const)}
                        />
                        {errors.items?.[index]?.runningItemDescription && (
                          <p className="text-xs text-destructive mt-1">
                            {errors.items[index]?.runningItemDescription?.message}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-full min-w-[100px]"
                          {...register(`items.${index}.targetQty` as const)}
                        />
                        {errors.items?.[index]?.targetQty && (
                          <p className="text-xs text-destructive mt-1">{errors.items[index]?.targetQty?.message}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-full min-w-[100px]"
                          {...register(`items.${index}.completedQty` as const)}
                        />
                        {errors.items?.[index]?.completedQty && (
                          <p className="text-xs text-destructive mt-1">{errors.items[index]?.completedQty?.message}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Textarea
                          rows={2}
                          placeholder="Manual work details"
                          className="w-full min-w-[140px]"
                          {...register(`items.${index}.manualWorkDone` as const)}
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Textarea 
                          rows={2} 
                          placeholder="Issues" 
                          className="w-full min-w-[130px]"
                          {...register(`items.${index}.issue` as const)} 
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Textarea
                          rows={2}
                          placeholder="Next action"
                          className="w-full min-w-[130px]"
                          {...register(`items.${index}.nextAction` as const)}
                        />
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <Input 
                          placeholder="Operator sign" 
                          className="w-full min-w-[110px]"
                          {...register(`items.${index}.operatorSign` as const)} 
                        />
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-4 border-t border-slate-200 bg-slate-50">
              <Button
                type="button"
                variant="default"
                className="bg-rose-600 hover:bg-rose-700"
                onClick={() => append({ ...defaultLineItem })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Machine Row
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="uppercase text-xs font-semibold text-slate-500">Note</Label>
              <Textarea rows={4} placeholder="Add any special instruction or remark" {...register('note')} />
            </div>
            <div className="grid gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase text-slate-500">Day Shift In-Charge</Label>
                <Input placeholder="Name of day shift in-charge" {...register('dayShiftInCharge')} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase text-slate-500">Night Shift In-Charge</Label>
                <Input placeholder="Name of night shift in-charge" {...register('nightShiftInCharge')} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase text-slate-500">
                  Approved by Production Manager
                </Label>
                <Input placeholder="Production manager name" {...register('productionManager')} />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              className="px-8 rounded-full border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200"
              disabled={isLoading}
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isLoading}
              className="px-8 rounded-full bg-rose-600 hover:bg-rose-700"
            >
              {isLoading ? 'Saving...' : 'Save Shift Handover'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

