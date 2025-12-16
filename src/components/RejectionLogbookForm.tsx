import { useEffect, useMemo } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Plus, Trash2, FileText } from 'lucide-react'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Button } from './ui/button'
import {
  RejectionLogbookFormData,
  generateRejectionLogbookNumber,
  rejectionLogbookSchema,
} from '../lib/rejectionLogbookSchema'

interface RejectionLogbookFormProps {
  initialData?: Partial<RejectionLogbookFormData>
  onSubmit: (data: RejectionLogbookFormData) => Promise<void>
  isLoading?: boolean
}

const defaultLineItem = {
  serialNumber: '',
  date: new Date().toISOString().slice(0, 10),
  machineType: '',
  machineName: '',
  productionOrderNo: '',
  productDescription: '',
  orderQty: '',
  producedQty: '',
  rejectionQty: '',
  rejectionReason: '',
  reworkQty: '',
  reworkTime: '',
  scrapQty: '',
  processStage: '',
  rejectionType: '',
  issueDescription: '',
  responsibility: '',
  remarks: '',
  approvedHODSign: '',
}

export default function RejectionLogbookForm({
  initialData,
  onSubmit,
  isLoading = false,
}: RejectionLogbookFormProps) {
  const defaultValues: RejectionLogbookFormData = useMemo(
    () => ({
      logbookNumber: initialData?.logbookNumber || generateRejectionLogbookNumber(),
      date: initialData?.date || new Date().toISOString().slice(0, 10),
      items:
        initialData?.items && initialData.items.length > 0
          ? initialData.items
          : [{ ...defaultLineItem }],
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
  } = useForm<RejectionLogbookFormData>({
    resolver: zodResolver(rejectionLogbookSchema),
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

  const watchedDate = watch('date')
  const watchedLogbookNumber = watch('logbookNumber')

  const handleFormSubmit = async (data: RejectionLogbookFormData) => {
    await onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-red-600 to-rose-500 text-white px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div>
              <p className="uppercase tracking-[0.3em] text-xs font-semibold text-white/70">Rejection/Rework Logbook</p>
              <h2 className="text-2xl font-bold mt-1">Rejection & Rework Log</h2>
              <div className="flex flex-wrap gap-6 text-sm text-white/80 mt-3">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Logbook #: {watchedLogbookNumber}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-3 text-right">
            <div className="text-xs uppercase tracking-widest text-white/80">Date</div>
            <div className="text-lg font-semibold">{watchedDate}</div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6 bg-white">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Logbook Number</Label>
              <Input placeholder="RL-000000" {...register('logbookNumber')} />
              {errors.logbookNumber && <p className="text-xs text-destructive">{errors.logbookNumber.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Date</Label>
              <Input type="date" {...register('date')} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[60px]">S. No.</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[110px]">Date</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[120px]">Machine Type</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[130px]">Machine name</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[150px]">Production Order No</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[160px]">Product Discription</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[100px]">Order Qty</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[110px]">Produced Qty</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[110px]">Rejection Qty</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[130px]">Rejection Reason</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[100px]">Rework Qty</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[110px]">Rework Time</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[100px]">Scrap Qty</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[120px]">Process Stage</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[120px]">Rejection Type</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[140px]">Issue Description</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[120px]">Responsibility</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[120px]">Remarks</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[140px]">Approved HOD Sign</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-700 whitespace-nowrap min-w-[80px]">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {fields.map((field, index) => (
                    <tr key={field.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3 align-top whitespace-nowrap">
                        <Input 
                          placeholder="S. No." 
                          className="w-full min-w-[50px]"
                          {...register(`items.${index}.serialNumber` as const)} 
                        />
                      </td>
                      <td className="px-3 py-3 align-top whitespace-nowrap">
                        <Input 
                          type="date"
                          className="w-full min-w-[100px]"
                          {...register(`items.${index}.date` as const)} 
                        />
                        {errors.items?.[index]?.date && (
                          <p className="text-xs text-destructive mt-1">{errors.items[index]?.date?.message}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top whitespace-nowrap">
                        <Input 
                          placeholder="Machine type" 
                          className="w-full min-w-[110px]"
                          {...register(`items.${index}.machineType` as const)} 
                        />
                        {errors.items?.[index]?.machineType && (
                          <p className="text-xs text-destructive mt-1">{errors.items[index]?.machineType?.message}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top whitespace-nowrap">
                        <Input 
                          placeholder="Machine name" 
                          className="w-full min-w-[120px]"
                          {...register(`items.${index}.machineName` as const)} 
                        />
                        {errors.items?.[index]?.machineName && (
                          <p className="text-xs text-destructive mt-1">{errors.items[index]?.machineName?.message}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top whitespace-nowrap">
                        <Input 
                          placeholder="Production order no" 
                          className="w-full min-w-[140px]"
                          {...register(`items.${index}.productionOrderNo` as const)} 
                        />
                        {errors.items?.[index]?.productionOrderNo && (
                          <p className="text-xs text-destructive mt-1">{errors.items[index]?.productionOrderNo?.message}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <Textarea
                          rows={2}
                          placeholder="Product description"
                          className="w-full min-w-[150px]"
                          {...register(`items.${index}.productDescription` as const)}
                        />
                        {errors.items?.[index]?.productDescription && (
                          <p className="text-xs text-destructive mt-1">
                            {errors.items[index]?.productDescription?.message}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top whitespace-nowrap">
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-full min-w-[90px]"
                          {...register(`items.${index}.orderQty` as const)}
                        />
                        {errors.items?.[index]?.orderQty && (
                          <p className="text-xs text-destructive mt-1">{errors.items[index]?.orderQty?.message}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top whitespace-nowrap">
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-full min-w-[100px]"
                          {...register(`items.${index}.producedQty` as const)}
                        />
                        {errors.items?.[index]?.producedQty && (
                          <p className="text-xs text-destructive mt-1">{errors.items[index]?.producedQty?.message}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top whitespace-nowrap">
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-full min-w-[100px]"
                          {...register(`items.${index}.rejectionQty` as const)}
                        />
                        {errors.items?.[index]?.rejectionQty && (
                          <p className="text-xs text-destructive mt-1">{errors.items[index]?.rejectionQty?.message}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <Textarea
                          rows={2}
                          placeholder="Rejection reason"
                          className="w-full min-w-[120px]"
                          {...register(`items.${index}.rejectionReason` as const)}
                        />
                      </td>
                      <td className="px-3 py-3 align-top whitespace-nowrap">
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-full min-w-[90px]"
                          {...register(`items.${index}.reworkQty` as const)}
                        />
                      </td>
                      <td className="px-3 py-3 align-top whitespace-nowrap">
                        <Input
                          placeholder="Rework time"
                          className="w-full min-w-[100px]"
                          {...register(`items.${index}.reworkTime` as const)}
                        />
                      </td>
                      <td className="px-3 py-3 align-top whitespace-nowrap">
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-full min-w-[90px]"
                          {...register(`items.${index}.scrapQty` as const)}
                        />
                      </td>
                      <td className="px-3 py-3 align-top whitespace-nowrap">
                        <Input
                          placeholder="Process stage"
                          className="w-full min-w-[110px]"
                          {...register(`items.${index}.processStage` as const)}
                        />
                      </td>
                      <td className="px-3 py-3 align-top whitespace-nowrap">
                        <Input
                          placeholder="Rejection type"
                          className="w-full min-w-[110px]"
                          {...register(`items.${index}.rejectionType` as const)}
                        />
                      </td>
                      <td className="px-3 py-3 align-top">
                        <Textarea
                          rows={2}
                          placeholder="Issue description"
                          className="w-full min-w-[130px]"
                          {...register(`items.${index}.issueDescription` as const)}
                        />
                      </td>
                      <td className="px-3 py-3 align-top whitespace-nowrap">
                        <Input
                          placeholder="Responsibility"
                          className="w-full min-w-[110px]"
                          {...register(`items.${index}.responsibility` as const)}
                        />
                      </td>
                      <td className="px-3 py-3 align-top">
                        <Textarea
                          rows={2}
                          placeholder="Remarks"
                          className="w-full min-w-[110px]"
                          {...register(`items.${index}.remarks` as const)}
                        />
                      </td>
                      <td className="px-3 py-3 align-top whitespace-nowrap">
                        <Input
                          placeholder="HOD sign"
                          className="w-full min-w-[130px]"
                          {...register(`items.${index}.approvedHODSign` as const)}
                        />
                      </td>
                      <td className="px-3 py-3 align-top whitespace-nowrap">
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
                className="bg-red-600 hover:bg-red-700"
                onClick={() => append({ ...defaultLineItem })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
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
              className="px-8 rounded-full bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Saving...' : 'Save Logbook'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}








