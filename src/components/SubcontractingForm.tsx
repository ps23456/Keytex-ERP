import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Plus, Trash2, Truck } from 'lucide-react'

const subcontractingSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  challanNo: z.string().min(1, 'Challan No is required'),
  to: z.string().min(1, 'To is required'),
  mr: z.string().min(1, 'Mr. is required'),
  items: z.array(
    z.object({
      particular: z.string().min(1, 'Particular is required'),
      quantity: z.string().min(1, 'Quantity is required').refine((val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num >= 0
      }, 'Quantity must be a valid number'),
      rate: z.string().optional(),
    })
  ).min(1, 'At least one item is required'),
  receivedBy: z.string().optional(),
  mobileNo: z.string().optional(),
  authorisedSignature: z.string().optional(),
})

export type SubcontractingFormData = z.infer<typeof subcontractingSchema>

interface SubcontractingFormProps {
  initialData?: Partial<SubcontractingFormData & { id?: string }>
  onSubmit: (data: SubcontractingFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export default function SubcontractingForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: SubcontractingFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    reset,
  } = useForm<SubcontractingFormData>({
    resolver: zodResolver(subcontractingSchema),
    mode: 'onChange',
    defaultValues: {
      date: initialData?.date || new Date().toISOString().slice(0, 10),
      challanNo: initialData?.challanNo || '',
      to: initialData?.to || '',
      mr: initialData?.mr || '',
      items: initialData?.items || [{ particular: '', quantity: '', rate: '' }],
      receivedBy: initialData?.receivedBy || '',
      mobileNo: initialData?.mobileNo || '',
      authorisedSignature: initialData?.authorisedSignature || '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const handleFormSubmit = async (data: SubcontractingFormData) => {
    await onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-700 to-orange-500 text-white px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Truck className="h-8 w-8" />
            </div>
            <div>
              <p className="uppercase tracking-[0.3em] text-xs font-semibold text-white/80">Delivery Challan</p>
              <h2 className="text-2xl font-bold mt-1">
                {initialData?.id ? 'Edit Subcontracting' : 'New Subcontracting'}
              </h2>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6 bg-white">
          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Date</Label>
              <Input type="date" {...register('date')} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Challan No</Label>
              <Input placeholder="Enter challan number" {...register('challanNo')} />
              {errors.challanNo && <p className="text-xs text-destructive">{errors.challanNo.message}</p>}
            </div>
          </div>

          {/* Recipient Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">To</Label>
              <Input placeholder="Enter recipient name/company" {...register('to')} />
              {errors.to && <p className="text-xs text-destructive">{errors.to.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Mr.</Label>
              <Input placeholder="Enter contact person name" {...register('mr')} />
              {errors.mr && <p className="text-xs text-destructive">{errors.mr.message}</p>}
            </div>
          </div>

          {/* Items Section */}
          <div className="rounded-xl border border-orange-200 bg-orange-50">
            <div className="px-5 py-3 border-b border-orange-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-orange-700 font-semibold">
                <Truck className="h-4 w-4" />
                <span>Items</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ particular: '', quantity: '', rate: '' })}
                className="text-orange-700 border-orange-300 hover:bg-orange-100"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            <div className="px-5 py-5 space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid md:grid-cols-12 gap-3 items-start p-3 bg-white rounded-lg border border-orange-200">
                  <div className="md:col-span-1 flex items-center justify-center pt-2">
                    <span className="text-sm font-semibold text-slate-600">{index + 1}</span>
                  </div>
                  <div className="md:col-span-5 space-y-1">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Particulars</Label>
                    <Input
                      placeholder="Enter item description"
                      {...register(`items.${index}.particular` as const)}
                    />
                    {errors.items?.[index]?.particular && (
                      <p className="text-xs text-destructive">{errors.items[index]?.particular?.message}</p>
                    )}
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Qty.</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      {...register(`items.${index}.quantity` as const)}
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="text-xs text-destructive">{errors.items[index]?.quantity?.message}</p>
                    )}
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Rate</Label>
                    <Input
                      placeholder="Rate"
                      {...register(`items.${index}.rate` as const)}
                    />
                  </div>
                  <div className="md:col-span-1 flex items-center justify-center pt-2">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {errors.items && typeof errors.items === 'object' && 'message' in errors.items && (
                <p className="text-xs text-destructive">{errors.items.message}</p>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Received By</Label>
              <Input placeholder="Enter receiver name" {...register('receivedBy')} />
              {errors.receivedBy && <p className="text-xs text-destructive">{errors.receivedBy.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Mob. No.</Label>
              <Input placeholder="Enter mobile number" {...register('mobileNo')} />
              {errors.mobileNo && <p className="text-xs text-destructive">{errors.mobileNo.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Authorised Signature</Label>
              <Input placeholder="Enter signature name" {...register('authorisedSignature')} />
              {errors.authorisedSignature && <p className="text-xs text-destructive">{errors.authorisedSignature.message}</p>}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={!isValid || isLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? 'Saving...' : initialData?.id ? 'Update Challan' : 'Save Challan'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

