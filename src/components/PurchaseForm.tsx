import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { ShoppingCart, Calendar } from 'lucide-react'

const purchaseSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  purchaseType: z.string().min(1, 'Purchase type is required'),
  itemName: z.string().min(1, 'Item name is required'),
  clientName: z.string().min(1, 'Client name is required'),
  billingAddress: z.string().min(1, 'Billing address is required'),
  amount: z.string().min(1, 'Amount is required').refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0
  }, 'Amount must be a valid number'),
  sgstAmount: z.string().min(1, 'SGST amount is required').refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0
  }, 'SGST amount must be a valid number'),
  cgstAmount: z.string().min(1, 'CGST amount is required').refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0
  }, 'CGST amount must be a valid number'),
  igstAmount: z.string().optional(),
  reasonForPurchase: z.string().min(1, 'Reason for purchase is required'),
})

export type PurchaseFormData = z.infer<typeof purchaseSchema>

interface PurchaseFormProps {
  initialData?: Partial<PurchaseFormData>
  onSubmit: (data: PurchaseFormData & { total: number }) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

const PURCHASE_TYPES = [
  'TOOLS PURCHASE A/C',
  'RAW MATERIAL PURCHASE A/C',
  'SERVICES PURCHASE A/C',
  'MACHINERY PURCHASE A/C',
  'OTHER PURCHASE A/C',
]

const GST_RATE = 0.18 // 18% GST

export default function PurchaseForm({ initialData, onSubmit, onCancel, isLoading = false }: PurchaseFormProps) {
  const defaultValues: PurchaseFormData = useMemo(() => ({
    date: initialData?.date || new Date().toISOString().slice(0, 10),
    purchaseType: initialData?.purchaseType || '',
    itemName: initialData?.itemName || '',
    clientName: initialData?.clientName || '',
    billingAddress: initialData?.billingAddress || '',
    amount: initialData?.amount || '',
    sgstAmount: initialData?.sgstAmount || '',
    cgstAmount: initialData?.cgstAmount || '',
    igstAmount: initialData?.igstAmount || '',
    reasonForPurchase: initialData?.reasonForPurchase || '',
  }), [initialData])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    mode: 'onChange',
    defaultValues,
  })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  const amount = watch('amount')
  const sgstAmount = watch('sgstAmount')
  const cgstAmount = watch('cgstAmount')
  const igstAmount = watch('igstAmount')

  // Calculate total
  const total = useMemo(() => {
    const amountNum = parseFloat(amount || '0') || 0
    const sgstNum = parseFloat(sgstAmount || '0') || 0
    const cgstNum = parseFloat(cgstAmount || '0') || 0
    const igstNum = parseFloat(igstAmount || '0') || 0
    return amountNum + sgstNum + cgstNum + igstNum
  }, [amount, sgstAmount, cgstAmount, igstAmount])

  // Auto-calculate SGST and CGST when amount changes (assuming 18% GST, split 9% each)
  useEffect(() => {
    const amountNum = parseFloat(amount || '0')
    if (amountNum > 0 && !sgstAmount && !cgstAmount) {
      const sgst = (amountNum * 0.09).toFixed(2)
      const cgst = (amountNum * 0.09).toFixed(2)
      setValue('sgstAmount', sgst)
      setValue('cgstAmount', cgst)
    }
  }, [amount, sgstAmount, cgstAmount, setValue])

  const handleFormSubmit = async (data: PurchaseFormData) => {
    await onSubmit({ ...data, total })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 text-white px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <ShoppingCart className="h-8 w-8" />
            </div>
            <div>
              <p className="uppercase tracking-[0.3em] text-xs font-semibold text-emerald-100">Purchase Entry</p>
              <h2 className="text-2xl font-bold mt-1">New Purchase</h2>
              <div className="flex flex-wrap gap-6 text-sm text-emerald-100 mt-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Date: {watch('date') || '--'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6 bg-white">
          {/* Date and Purchase Type */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Purchase Date</Label>
              <Input type="date" {...register('date')} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Purchase Type</Label>
              <Select
                value={watch('purchaseType')}
                onValueChange={(value) => setValue('purchaseType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select purchase type" />
                </SelectTrigger>
                <SelectContent>
                  {PURCHASE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.purchaseType && <p className="text-xs text-destructive">{errors.purchaseType.message}</p>}
            </div>
          </div>

          {/* Item Name */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Item Name</Label>
            <Input placeholder="Enter item name" {...register('itemName')} />
            {errors.itemName && <p className="text-xs text-destructive">{errors.itemName.message}</p>}
          </div>

          {/* Client Name and Billing Address */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Client Name</Label>
              <Input placeholder="Enter client name" {...register('clientName')} />
              {errors.clientName && <p className="text-xs text-destructive">{errors.clientName.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Billing Address</Label>
              <Input placeholder="Enter billing address" {...register('billingAddress')} />
              {errors.billingAddress && <p className="text-xs text-destructive">{errors.billingAddress.message}</p>}
            </div>
          </div>

          {/* Amount Section */}
          <div className="rounded-xl border border-blue-200 bg-blue-50">
            <div className="px-5 py-3 border-b border-blue-200 flex items-center space-x-2 text-blue-700 font-semibold">
              <ShoppingCart className="h-4 w-4" />
              <span>Amount Details</span>
            </div>
            <div className="px-5 py-5 grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase text-blue-700">Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('amount')}
                />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase text-blue-700">SGST Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('sgstAmount')}
                />
                {errors.sgstAmount && <p className="text-xs text-destructive">{errors.sgstAmount.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase text-blue-700">CGST Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('cgstAmount')}
                />
                {errors.cgstAmount && <p className="text-xs text-destructive">{errors.cgstAmount.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase text-blue-700">IGST Amount (Optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('igstAmount')}
                />
                {errors.igstAmount && <p className="text-xs text-destructive">{errors.igstAmount.message}</p>}
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs font-semibold uppercase text-blue-700">Total Amount</Label>
                <Input
                  type="text"
                  value={total.toFixed(2)}
                  readOnly
                  className="bg-slate-100 font-semibold text-lg"
                />
              </div>
            </div>
          </div>

          {/* Reason for Purchase */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Reason for Purchase</Label>
            <Textarea
              rows={4}
              placeholder="Enter reason for purchase"
              {...register('reasonForPurchase')}
            />
            {errors.reasonForPurchase && <p className="text-xs text-destructive">{errors.reasonForPurchase.message}</p>}
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
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? 'Saving...' : 'Save Purchase'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

