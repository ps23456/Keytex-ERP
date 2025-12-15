import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Calendar, FileText, UserCheck } from 'lucide-react'

const designIssueSchema = z.object({
  productionNo: z.string().optional(),
  productionDescription: z.string().optional(),
  revisionNo: z.string().optional(),
  dateOfIssue: z.string().optional(),
  receiverName: z.string().optional(),
  receiverSignature: z.string().optional(),
  dateOfReceived: z.string().optional(),
  remark: z.string().optional(),
})

export type DesignIssueFormData = z.infer<typeof designIssueSchema>

interface DesignIssueFormProps {
  initialData?: Partial<DesignIssueFormData>
  onSubmit: (data: DesignIssueFormData) => Promise<void> | void
  isLoading?: boolean
}

export default function DesignIssueForm({
  initialData,
  onSubmit,
  isLoading = false,
}: DesignIssueFormProps) {
  const defaultValues = useMemo<DesignIssueFormData>(() => ({
    productionNo: initialData?.productionNo || '',
    productionDescription: initialData?.productionDescription || '',
    revisionNo: initialData?.revisionNo || '',
    dateOfIssue: initialData?.dateOfIssue || '',
    receiverName: initialData?.receiverName || '',
    receiverSignature: initialData?.receiverSignature || '',
    dateOfReceived: initialData?.dateOfReceived || '',
    remark: initialData?.remark || '',
  }), [initialData])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isValid },
  } = useForm<DesignIssueFormData>({
    resolver: zodResolver(designIssueSchema),
    defaultValues,
    mode: 'onChange',
  })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  const watchedData = watch()

  const handleFormSubmit = async (data: DesignIssueFormData) => {
    await onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 text-white px-6 py-7 space-y-6">
          <div className="space-y-1">
            <p className="uppercase tracking-[0.3em] text-xs font-semibold text-white/70">Design Issue</p>
            <h2 className="text-2xl font-bold leading-tight">Issue Receive Sheet</h2>
            <p className="text-sm text-white/80 max-w-lg">
              Log the issuing of design drawings, capturing production references and receiver acknowledgement.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-3 text-sm font-medium">
            <div className="rounded-xl bg-white/15 px-4 py-3 shadow-sm flex items-center gap-3">
              <FileText className="h-5 w-5" />
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-white/70">Production No</div>
                <div className="text-white">{watchedData.productionNo || 'Not set'}</div>
              </div>
            </div>
            <div className="rounded-xl bg-white/15 px-4 py-3 shadow-sm flex items-center gap-3">
              <Calendar className="h-5 w-5" />
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-white/70">Date of Issue</div>
                <div className="text-white">
                  {watchedData.dateOfIssue
                    ? new Date(watchedData.dateOfIssue).toLocaleDateString()
                    : 'Not set'}
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white/15 px-4 py-3 shadow-sm flex items-center gap-3">
              <UserCheck className="h-5 w-5" />
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-white/70">Receiver</div>
                <div className="text-white">{watchedData.receiverName || 'Not set'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 bg-white space-y-6">
          <section className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Production No</Label>
              <Input placeholder="Enter production number" {...register('productionNo')} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Revision No</Label>
              <Input placeholder="Enter revision number" {...register('revisionNo')} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Production Description</Label>
              <Textarea
                rows={3}
                placeholder="Describe the production drawing or issue details"
                {...register('productionDescription')}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Date of Issue</Label>
              <Input type="date" {...register('dateOfIssue')} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Date of Received</Label>
              <Input type="date" {...register('dateOfReceived')} />
            </div>
          </section>

          <section className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Receiver Name</Label>
              <Input placeholder="Enter receiver name" {...register('receiverName')} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Receiver Signature</Label>
              <Input placeholder="Enter receiver signature / code" {...register('receiverSignature')} />
            </div>
          </section>

          <section className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Remarks</Label>
            <Textarea
              rows={3}
              placeholder="Any additional notes, special instructions, or comments"
              {...register('remark')}
            />
          </section>

          <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-200">
            <Button type="submit" disabled={!isValid || isLoading} className="bg-indigo-600 hover:bg-indigo-700">
              {isLoading ? 'Saving...' : 'Save Entry'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

