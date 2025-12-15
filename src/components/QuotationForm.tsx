import { useEffect, useMemo } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Plus, Trash2, FileText, Calendar, Info } from 'lucide-react'
import { SpecificationCostBreakdown } from '../types/specifications'

const quotationItemSchema = z.object({
  partName: z.string().min(1, 'Part name is required'),
  material: z.string().optional(),
  quantity: z.string().min(1, 'Quantity is required'),
  price: z.string().optional(),
})

const quotationSchema = z.object({
  quotationNumber: z.string().min(1, 'Quotation number is required'),
  quotationDate: z.string().min(1, 'Quotation date is required'),
  validUntil: z.string().optional(),
  companyName: z.string().min(1, 'Company name is required'),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['Draft', 'Sent', 'Accepted', 'Expired']).default('Draft'),
  followUps: z.string().optional(),
  items: z.array(quotationItemSchema).min(1, 'Add at least one item'),
  notes: z.string().optional(),
  terms: z.array(
    z.object({
      title: z.string(),
      value: z.string().optional(),
    })
  ).optional(),
})

export type QuotationFormData = z.infer<typeof quotationSchema>

interface QuotationFormProps {
  initialData?: Partial<QuotationFormData>
  onSubmit: (data: QuotationFormData & { totalAmount: number }) => Promise<void>
  isLoading?: boolean
  specCostDetails?: (SpecificationCostBreakdown | null)[]
}

const DEFAULT_TERMS = [
  { title: 'FOR', value: 'The above quotation prices are Ex-works, Surat,GJ India' },
  { title: 'FORWARDING', value: 'Forwarding, Freight & Transport charges are excluded in quote price. Will be arrange by You.' },
  { title: 'PRICE', value: 'Prices are valid for 30 days from quote date' },
  { title: 'TAXES', value: 'On final invoice as per government norms.' },
  { title: 'INSURANCE', value: 'Transit insurance is born by you.' },
  { title: 'DELIVERY', value: 'Within 10 days after advance payment received' },
  { title: 'PAYMENT', value: '50% advance along with P.O & 50% against delivery.' },
]

const GST_RATE = 0.18

const generateQuotationNumber = () => `Q${Date.now().toString().slice(-6)}`

export default function QuotationForm({ initialData, onSubmit, isLoading = false, specCostDetails }: QuotationFormProps) {
  const defaultValues: QuotationFormData = useMemo(() => ({
    quotationNumber: initialData?.quotationNumber || generateQuotationNumber(),
    quotationDate: initialData?.quotationDate || new Date().toISOString().slice(0, 10),
    validUntil: initialData?.validUntil || '',
    companyName: initialData?.companyName || '',
    contactPerson: initialData?.contactPerson || '',
    contactPhone: initialData?.contactPhone || '',
    contactEmail: initialData?.contactEmail || '',
    address: initialData?.address || '',
    status: initialData?.status || 'Draft',
    followUps: initialData?.followUps !== undefined && initialData?.followUps !== null
      ? String(initialData.followUps)
      : '0',
    items:
      initialData?.items && initialData.items.length > 0
        ? initialData.items
        : [{ partName: '', material: '', quantity: '1', price: '0' }],
    notes: initialData?.notes || '',
    terms: initialData?.terms && initialData.terms.length > 0 ? initialData.terms : DEFAULT_TERMS,
  }), [initialData])

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    mode: 'onChange',
    defaultValues,
  })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({ control, name: 'items' })
  const { fields: termFields, append: appendTerm, remove: removeTerm } = useFieldArray({ control, name: 'terms' })

  useEffect(() => {
    if (!initialData?.quotationNumber) {
      setValue('quotationNumber', generateQuotationNumber())
    }
  }, [initialData?.quotationNumber, setValue])

  const items = watch('items')
  const statusValue = watch('status')
  const followUpsValue = watch('followUps')
  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity || '0') || 0
    const price = parseFloat(item.price || '0') || 0
    return sum + qty * price
  }, 0)
  const gstAmount = subtotal * GST_RATE
  const totalAmount = subtotal + gstAmount

  const handleFormSubmit = async (data: QuotationFormData) => {
    await onSubmit({ ...data, totalAmount })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <p className="uppercase tracking-[0.3em] text-xs font-semibold text-blue-100">Manual Quotation</p>
              <h2 className="text-2xl font-bold mt-1">Quotation</h2>
              <div className="flex flex-wrap gap-6 text-sm text-blue-100 mt-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Date: {watch('quotationDate') || '--'}</span>
                </div>
                <div>
                  Quote No: <span className="font-semibold text-white">{watch('quotationNumber')}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-2 text-right">
            <div className="text-xs uppercase tracking-widest text-blue-100">Quotation No.</div>
            <div className="text-lg font-semibold">{watch('quotationNumber')}</div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6 bg-white">
          <input type="hidden" value={statusValue} {...register('status')} />
          <input type="hidden" value={followUpsValue} {...register('followUps')} />

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Quotation No</Label>
              <Input placeholder="Enter quotation number" {...register('quotationNumber')} />
              {errors.quotationNumber && <p className="text-xs text-destructive">{errors.quotationNumber.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Quotation Date</Label>
              <Input type="date" {...register('quotationDate')} />
              {errors.quotationDate && <p className="text-xs text-destructive">{errors.quotationDate.message}</p>}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50">
            <div className="px-5 py-3 border-b border-emerald-200 flex items-center space-x-2 text-emerald-700 font-semibold">
              <FileText className="h-4 w-4" />
              <span>To:</span>
            </div>
            <div className="px-5 py-5 grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase text-emerald-700">Company Name</Label>
                <Input placeholder="Enter company name" {...register('companyName')} />
                {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase text-emerald-700">Contact Person</Label>
                <Input placeholder="Enter contact person name" {...register('contactPerson')} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase text-emerald-700">Contact Number</Label>
                <Input placeholder="Enter contact number" {...register('contactPhone')} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase text-emerald-700">Email</Label>
                <Input placeholder="Enter email address" type="email" {...register('contactEmail')} />
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs font-semibold uppercase text-emerald-700">Address</Label>
                <Textarea rows={3} placeholder="Enter complete address" {...register('address')} />
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-600 leading-relaxed">
            Dear Sir,
            <br />
            We acknowledge with thanks to the receipt of your above referred inquiry and are please to submit our lowest Offer for the same as under.
          </div>

          <div className="bg-white border border-blue-100 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-600 text-white text-sm">
                  <tr>
                    <th className="px-4 py-3 text-left w-[60px]">Item No.</th>
                    <th className="px-4 py-3 text-left">Part Name</th>
                    <th className="px-4 py-3 text-left">Material</th>
                    <th className="px-4 py-3 text-left">Quantity</th>
                    <th className="px-4 py-3 text-left">Price/No INR</th>
                    <th className="px-4 py-3 text-left">Total INR</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {itemFields.map((field, index) => {
                    const qty = parseFloat(items[index]?.quantity || '0') || 0
                    const price = parseFloat(items[index]?.price || '0') || 0
                    const lineTotal = qty * price
                    const specCost = specCostDetails?.[index] ?? null
                    return (
                      <tr key={field.id} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50/40'}>
                        <td className="px-4 py-3 text-sm font-medium">{index + 1}</td>
                        <td className="px-4 py-3">
                          <Input placeholder="Part name" {...register(`items.${index}.partName` as const)} />
                          {errors.items?.[index]?.partName && <p className="text-xs text-destructive mt-1">{errors.items[index]?.partName?.message}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <Input placeholder="Material" {...register(`items.${index}.material` as const)} />
                        </td>
                        <td className="px-4 py-3">
                          <Input type="number" min="0" placeholder="1" {...register(`items.${index}.quantity` as const)} />
                          {errors.items?.[index]?.quantity && <p className="text-xs text-destructive mt-1">{errors.items[index]?.quantity?.message}</p>}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Input type="number" step="0.01" placeholder="0" {...register(`items.${index}.price` as const)} />
                          {specCost && specCost.totalCost > 0 && (
                            <div className="mt-2 p-2 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                              <div className="flex items-center gap-1 font-medium text-slate-700">
                                <Info className="h-3.5 w-3.5" />
                                <span>Calculated from manufacturing specs</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Material Cost</span>
                                <span>₹ {specCost.materialCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Operations Cost</span>
                                <span>₹ {specCost.operationsCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Includes:&nbsp;
                                {specCost.operations
                                  .filter((op) => op.value > 0)
                                  .map((op) => `${op.label}: ₹ ${op.value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`)
                                  .join(', ') || 'No additional operations'}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold">₹ {lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-4 py-3">
                          {itemFields.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeItem(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4 py-4 border-t border-blue-100 gap-3">
              <Button
                type="button"
                variant="default"
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
                onClick={() => appendItem({ partName: '', material: '', quantity: '1', price: '0' })}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
              <div className="bg-white border border-slate-200 rounded-xl px-6 py-4 shadow-sm w-full md:w-72">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-900">₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600 mt-2">
                  <span>GST (18%):</span>
                  <span className="font-semibold text-slate-900">₹ {gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-blue-700 mt-3 border-t border-slate-200 pt-3">
                  <span>Total:</span>
                  <span>₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-700 font-medium">
            NOTE: *Quote price includes : Material, Machining & Q.C.
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold tracking-tight text-slate-800 uppercase">Terms and Conditions:</h3>
            <div className="space-y-3">
              {termFields.map((field, index) => {
                const termTitle = watch(`terms.${index}.title` as const)
                return (
                  <div key={field.id} className="grid md:grid-cols-[100px_minmax(0,1fr)] gap-4 items-center bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm">
                    <div className="text-sm font-semibold text-blue-700">({index + 1}) {(termTitle || field.title || 'Term').toUpperCase()}</div>
                    <div className="space-y-2">
                      <Input placeholder="Term heading" {...register(`terms.${index}.title` as const)} />
                      <Input placeholder="Term description" {...register(`terms.${index}.value` as const)} />
                    </div>
                    {termFields.length > DEFAULT_TERMS.length && (
                      <div className="md:col-span-2 flex justify-end">
                        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removeTerm(index)}>
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="outline" className="border-dashed border-slate-300 text-slate-700" onClick={() => appendTerm({ title: 'Additional Term', value: '' })}>
                <Plus className="h-4 w-4 mr-2" /> Add Term
              </Button>
            </div>
          </div>

          <div className="md:flex md:items-center md:justify-between gap-4">
            <div className="space-y-1 max-w-xs">
              <Label className="text-xs font-semibold uppercase text-slate-500">Valid Until</Label>
              <Input type="date" {...register('validUntil')} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Additional Notes</Label>
            <Textarea rows={3} placeholder="Any additional notes or comments" {...register('notes')} />
          </div>

          <div className="text-sm text-slate-600 leading-relaxed">
            The above offer are quite reasonable & inline with your requirement. Now we look forward to the pleasure of receiving your valued order soon.
            <br />
            Thanking You.
          </div>

          <div className="text-center text-sm font-semibold text-slate-800 space-y-1">
            <div>FOR</div>
            <div>KEYTEX MACHINES</div>
            <div>ANKUR C. PATEL</div>
            <div>+91 99789 22288</div>
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
            <Button type="submit" disabled={!isValid || isLoading} className="px-8 rounded-full bg-blue-600 hover:bg-blue-700">
              {isLoading ? 'Saving...' : 'Create Quotation'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
