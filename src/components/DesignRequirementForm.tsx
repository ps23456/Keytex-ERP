import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Calendar, ClipboardList, FileText, RefreshCw } from 'lucide-react'

const machiningKeys = [
  { key: 'cnc', label: 'CNC' },
  { key: 'vmc', label: 'VMC' },
  { key: 'rotaryGrinding', label: 'Rotary Grinding' },
  { key: 'surfaceGrinding', label: 'Surface Grinding' },
  { key: 'wireCutting', label: 'Wire Cutting' },
  { key: 'welding', label: 'Welding' },
  { key: 'sheetMetalBending', label: 'Sheet Metal Bending' },
] as const

const regularInfoKeys = [
  { key: 'material', label: 'Material' },
  { key: 'heatTreatment', label: 'Heat Treatment' },
  { key: 'coating', label: 'Coating' },
  { key: 'thread', label: 'Thread' },
  { key: 'rawMaterialSize', label: 'Raw Material Size' },
  { key: 'sheetThickness', label: 'Sheet Thickness' },
] as const

const rotaryDieKeys = [
  { key: 'od', label: 'OD' },
  { key: 'id', label: 'ID' },
  { key: 'cuttingRoller', label: 'Cutting Roller' },
  { key: 'sealingRoller', label: 'Sealing Roller' },
  { key: 'gearChain', label: 'Gear Chain' },
  { key: 'keyway', label: 'Keyway' },
  { key: 'bearingNumber', label: 'Bearing No.' },
  { key: 'cuttingDepth', label: 'Cutting Depth' },
  { key: 'cuttingDirection', label: 'Cutting Direction' },
  { key: 'sideCollar', label: 'Side Collar' },
] as const

const designRequirementSchema = z.object({
  date: z.string().optional(),
  clientName: z.string().min(1, 'Client name is required'),
  partName: z.string().min(1, 'Part name is required'),
  manufacturingQty: z.string().optional(),
  baseMaterial: z.string().optional(),
  sourceInput: z.string().optional(),
  sourceAttachmentName: z.string().optional(),
  sourceAttachmentData: z.string().optional(),
  notes: z.string().optional(),
  rotaryDie: z.object(
    rotaryDieKeys.reduce((shape, field) => {
      shape[field.key] = z.string().optional()
      return shape
    }, {} as Record<(typeof rotaryDieKeys)[number]['key'], z.ZodTypeAny>)
  ),
  machiningProcess: z.object(
    machiningKeys.reduce((shape, field) => {
      shape[field.key] = z.string().optional()
      return shape
    }, {} as Record<(typeof machiningKeys)[number]['key'], z.ZodTypeAny>)
  ),
  regularInfo: z.object(
    regularInfoKeys.reduce((shape, field) => {
      shape[field.key] = z.string().optional()
      return shape
    }, {} as Record<(typeof regularInfoKeys)[number]['key'], z.ZodTypeAny>)
  ),
})

export type DesignRequirementFormData = z.infer<typeof designRequirementSchema>

interface DesignRequirementFormProps {
  initialData?: Partial<DesignRequirementFormData>
  onSubmit: (data: DesignRequirementFormData) => Promise<void> | void
  isLoading?: boolean
}

const emptyRotaryDie = rotaryDieKeys.reduce((obj, field) => {
  obj[field.key] = ''
  return obj
}, {} as Record<(typeof rotaryDieKeys)[number]['key'], string>)

const emptyMachiningProcess = machiningKeys.reduce((obj, field) => {
  obj[field.key] = ''
  return obj
}, {} as Record<(typeof machiningKeys)[number]['key'], string>)

const emptyRegularInfo = regularInfoKeys.reduce((obj, field) => {
  obj[field.key] = ''
  return obj
}, {} as Record<(typeof regularInfoKeys)[number]['key'], string>)

export default function DesignRequirementForm({
  initialData,
  onSubmit,
  isLoading = false,
}: DesignRequirementFormProps) {
  const [submitted, setSubmitted] = useState(false)

  const defaultValues = useMemo<DesignRequirementFormData>(() => ({
    date: initialData?.date || new Date().toISOString().slice(0, 10),
    clientName: initialData?.clientName || '',
    partName: initialData?.partName || '',
    manufacturingQty: initialData?.manufacturingQty || '',
    baseMaterial: initialData?.baseMaterial || '',
    sourceInput: initialData?.sourceInput || '',
    sourceAttachmentName: initialData?.sourceAttachmentName || '',
    sourceAttachmentData: initialData?.sourceAttachmentData || '',
    notes: initialData?.notes || '',
    rotaryDie: { ...emptyRotaryDie, ...(initialData?.rotaryDie || {}) },
    machiningProcess: { ...emptyMachiningProcess, ...(initialData?.machiningProcess || {}) },
    regularInfo: { ...emptyRegularInfo, ...(initialData?.regularInfo || {}) },
  }), [initialData])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    reset,
    setValue,
  } = useForm<DesignRequirementFormData>({
    resolver: zodResolver(designRequirementSchema),
    defaultValues,
    mode: 'onChange',
  })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  const watchedData = watch()
  const sourceFileName = watch('sourceAttachmentName')

  const onFormSubmit = async (data: DesignRequirementFormData) => {
    await onSubmit(data)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  const handleSourceFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setValue('sourceAttachmentName', file.name, { shouldDirty: true, shouldTouch: true })
      setValue('sourceAttachmentData', result, { shouldDirty: true, shouldTouch: true })
    }
    reader.readAsDataURL(file)
  }

  const clearSourceFile = () => {
    setValue('sourceAttachmentName', '', { shouldDirty: true, shouldTouch: true })
    setValue('sourceAttachmentData', '', { shouldDirty: true, shouldTouch: true })
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-lime-500 text-white px-6 py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-white/15 rounded-xl">
              <ClipboardList className="h-8 w-8" />
            </div>
            <div>
              <p className="uppercase tracking-[0.3em] text-xs font-semibold text-emerald-100">Design Requirement</p>
              <h2 className="text-2xl font-bold mt-1">KM-DPD-03 Checklist</h2>
              <div className="flex flex-wrap gap-4 text-sm text-emerald-100 mt-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{watchedData.date || '--'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Part: {watchedData.partName || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>Qty: {watchedData.manufacturingQty || '0'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-3 text-right space-y-1">
            <div className="text-xs uppercase tracking-widest text-emerald-100">Document No.</div>
            <div className="text-lg font-semibold">KM-DPD-03</div>
            <div className="text-xs uppercase tracking-widest text-emerald-100">Keytex Machines</div>
          </div>
        </div>

        <div className="p-6 bg-white space-y-6">
          <section className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Date</Label>
              <Input type="date" {...register('date')} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Client Name</Label>
              <Input placeholder="Enter client name" {...register('clientName')} />
              {errors.clientName && <p className="text-xs text-destructive">{errors.clientName.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Part Name</Label>
              <Input placeholder="Enter part name" {...register('partName')} />
              {errors.partName && <p className="text-xs text-destructive">{errors.partName.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Manufacturing Quantity</Label>
              <Input placeholder="Enter manufacturing quantity" {...register('manufacturingQty')} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Base Material</Label>
              <Input placeholder="Enter base material" {...register('baseMaterial')} />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-widest">Rotary Die Specifications</h3>
              <span className="text-xs text-slate-500">Critical dimensions & assembly details</span>
            </div>
            <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rotaryDieKeys.map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label className="text-xs font-medium text-slate-600">{field.label}</Label>
                  <Input placeholder={`Enter ${field.label.toLowerCase()}`} {...register(`rotaryDie.${field.key}` as const)} />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-blue-200 bg-blue-50">
            <div className="px-5 py-3 border-b border-blue-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-widest">Source Input (Customer)</h3>
              <span className="text-xs text-blue-600">Attach references provided by client</span>
            </div>
            <div className="p-5 space-y-4">
              <Textarea
                rows={4}
                placeholder="Capture drawings, sketches, special instructions or references shared by the customer"
                {...register('sourceInput')}
              />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-blue-200 bg-white px-4 py-3">
                <div>
                  <div className="text-xs font-semibold uppercase text-blue-600 tracking-widest">Reference Upload</div>
                  <p className="text-xs text-slate-500">
                    Add drawings, annotated PDFs, or images received from the customer.
                  </p>
                  {sourceFileName && (
                    <div className="mt-1 text-sm font-medium text-blue-700 break-all">
                      Uploaded: {sourceFileName}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <label>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) {
                          handleSourceFile(file)
                        }
                      }}
                    />
                    <Button type="button" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                      Upload Reference
                    </Button>
                  </label>
                  {sourceFileName && (
                    <Button type="button" variant="ghost" className="text-sm text-rose-600 hover:text-rose-700" onClick={clearSourceFile}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="grid lg:grid-cols-[2fr_1.2fr] gap-4">
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-widest">Machining Process</h3>
                <span className="text-xs text-slate-500">Equipment & operations required</span>
              </div>
              <div className="p-5 grid sm:grid-cols-2 gap-4">
                {machiningKeys.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-xs font-medium text-slate-600">{field.label}</Label>
                    <Input placeholder={`Enter ${field.label.toLowerCase()} details`} {...register(`machiningProcess.${field.key}` as const)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white">
              <div className="px-5 py-3 border-b border-emerald-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-widest">Regular Information</h3>
                <span className="text-xs text-emerald-600">Material & finishing</span>
              </div>
              <div className="p-5 space-y-4">
                {regularInfoKeys.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-xs font-medium text-emerald-700">{field.label}</Label>
                    <Input placeholder={`Enter ${field.label.toLowerCase()}`} {...register(`regularInfo.${field.key}` as const)} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-widest">Notes & Critical Points</h3>
              <span className="text-xs text-slate-500">Highlight risk areas or special checks</span>
            </div>
            <div className="p-5">
              <Textarea
                rows={4}
                placeholder="Record important notes from client, potential risks, quality concerns, inspection checkpoints etc."
                {...register('notes')}
              />
            </div>
          </section>

          <section className="rounded-xl border border-indigo-200 bg-indigo-50">
            <div className="px-5 py-4 border-b border-indigo-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-widest">Live Summary</h3>
              <span className="text-xs text-indigo-600">Auto-updated from inputs</span>
            </div>
            <div className="p-5 grid md:grid-cols-2 gap-4 text-sm text-slate-700 leading-relaxed">
              <div className="space-y-2">
                <div className="font-semibold text-indigo-700 uppercase text-xs tracking-widest">Project Overview</div>
                <div><span className="font-medium text-slate-900">Client:</span> {watchedData.clientName || '—'}</div>
                <div><span className="font-medium text-slate-900">Part:</span> {watchedData.partName || '—'}</div>
                <div><span className="font-medium text-slate-900">Base Material:</span> {watchedData.baseMaterial || '—'}</div>
                <div><span className="font-medium text-slate-900">Production Qty:</span> {watchedData.manufacturingQty || '—'}</div>
                <div><span className="font-medium text-slate-900">Reference File:</span> {sourceFileName || 'None'}</div>
              </div>
              <div className="space-y-2">
                <div className="font-semibold text-indigo-700 uppercase text-xs tracking-widest">Key Operations</div>
                <div className="flex flex-wrap gap-2">
                  {machiningKeys
                    .filter((field) => watchedData.machiningProcess?.[field.key])
                    .map((field) => (
                      <span key={field.key} className="inline-flex items-center rounded-full bg-white border border-indigo-200 px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm">
                        {field.label}: {watchedData.machiningProcess?.[field.key]}
                      </span>
                    ))}
                  {machiningKeys.every((field) => !watchedData.machiningProcess?.[field.key]) && (
                    <span className="text-xs text-indigo-500">Add machining details to see quick summary chips.</span>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <div className="font-semibold text-indigo-700 uppercase text-xs tracking-widest">Critical Notes</div>
                <div className="min-h-[60px] rounded-lg border border-indigo-200 bg-white px-4 py-3 shadow-sm text-sm text-slate-700">
                  {watchedData.notes?.trim() || 'No critical notes captured yet. Document client remarks, tolerances or inspection checkpoints here.'}
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => reset(defaultValues)} disabled={isLoading}>
              Reset Form
            </Button>
            <Button type="submit" disabled={!isValid || isLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {isLoading ? 'Saving...' : submitted ? 'Saved' : 'Save Requirement'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

