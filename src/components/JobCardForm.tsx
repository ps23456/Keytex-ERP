import { ReactNode, useEffect, useMemo, useRef, useState, useCallback, useLayoutEffect } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
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
import { getJobCardTemplate, initializeJobCardTemplates } from '../lib/jobCardTemplates'
import { useMasters } from '../hooks/useMasters'
import { loadInventoryItems, reduceInventoryStock, InventoryItem, InventoryType } from '../lib/inventoryStorage'

const STATUS_OPTIONS = ['Planned', 'In Progress', 'On Hold', 'Completed']
const DESIGN_CHOICES = ['KM', 'CUST', '2D', '3D'] as const

const programPathSchema = z.object({
  inDate: z.string().optional(),
  estimateTime: z.string().optional(),
  outDate: z.string().optional(),
})

const programMachineSchema = z.object({
  programmer: z.string().optional(),
  path1: programPathSchema,
  path2: programPathSchema,
})

const saleSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  address: z.string().optional(),
  itemName: z.string().optional(),
  itemDescription: z.string().optional(),
  quantity: z.string().optional(),
  rawMaterial: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  poNumberDate: z.string().optional(),
  confirmOrderDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  rmGrade: z.string().optional(),
})

const designSchema = z.object({
  ownership: z.array(z.enum(DESIGN_CHOICES)).optional(),
  sampleReceived: z.string().optional(),
  drawnBy: z.string().optional(),
  comments: z.string().optional(),
  issueStart: z.string().optional(),
  issueEnd: z.string().optional(),
})

const programSchema = z.object({
  cnc: programMachineSchema,
  vmc: programMachineSchema,
  specialRequirement: z.string().optional(),
  instruction: z.string().optional(),
})

const operationEntrySchema = z.object({
  operation: z.string(),
  date: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  operator: z.string().optional(),
  estSetTime: z.string().optional(),
  actualSetTime: z.string().optional(),
  estProcessTime: z.string().optional(),
  actualProcessTime: z.string().optional(),
  diff: z.string().optional(),
  total: z.string().optional(),
  doneBy: z.string().optional(),
  qc: z.string().optional(),
})

const finalInspectionSchema = z.object({
  notes: z.string().optional(),
  preparedBy: z.string().optional(),
  checkedBy: z.string().optional(),
  approvedBy: z.string().optional(),
})

const jobCardSchema = z.object({
  jobNumber: z.string().min(1, 'Job number is required'),
  srNumber: z.string().min(1, 'Sr. No is required'),
  jobDate: z.string().min(1, 'Date is required'),
  jobOrderNumber: z.string().min(1, 'Job order no. is required'),
  quoteNumber: z.string().optional(),
  quotationId: z.string().optional(),
  status: z.enum(STATUS_OPTIONS as [string, ...string[]]),
  sale: saleSchema,
  design: designSchema,
  program: programSchema,
  operations: z.array(operationEntrySchema),
  finalInspection: finalInspectionSchema,
  workCenter: z.string().optional(),
})

export type JobCardFormData = z.infer<typeof jobCardSchema>

interface JobCardFormProps {
  initialData?: Partial<JobCardFormData>
  onSubmit: (data: JobCardFormData) => Promise<void> | void
  isLoading?: boolean
}

const generateJobNumber = () => {
  const timestamp = Date.now().toString().slice(-6)
  return `JC-${timestamp}`
}

const today = () => new Date().toISOString().slice(0, 10)

const OPERATION_PRESETS = [
  'RM CUTTING',
  '',
  '',
  '',
  'VMC SIDE 1',
  'VMC SIDE 2',
  'VMC SIDE 3',
  'VMC SIDE 4',
  'VMC SIDE 5',
  'OILING',
  'OUTSOURCE',
  'GRAINDING',
  'MANUAL',
  'ASEMBLY',
  'WIRE CUTTING',
  'ASTHETIC',
  'PACKING',
]

const PROGRAM_PATHS = ['path1', 'path2'] as const

const buildOperationDefaults = (
  initial?: JobCardFormData['operations'],
  templateId?: string
) => {
  if (initial && initial.length > 0) return initial
  
  // If template is provided, use its operations
  if (templateId) {
    const template = getJobCardTemplate(templateId)
    if (template && template.operations && template.operations.length > 0) {
      return template.operations.map((op) => ({
        operation: op.label || op.key || '',
        date: '',
        start: '',
        end: '',
        operator: '',
        estSetTime: '',
        actualSetTime: '',
        estProcessTime: '',
        actualProcessTime: '',
        diff: '',
        total: '',
        doneBy: '',
        qc: '',
      }))
    }
  }
  
  // Fallback to default presets
  return OPERATION_PRESETS.map((operation, index) => ({
    operation: operation || `OPERATION ${index + 1}`,
    date: '',
    start: '',
    end: '',
    operator: '',
    estSetTime: '',
    actualSetTime: '',
    estProcessTime: '',
    actualProcessTime: '',
    diff: '',
    total: '',
    doneBy: '',
    qc: '',
  }))
}

export default function JobCardForm({
  initialData,
  onSubmit,
  isLoading = false,
}: JobCardFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState<string | null>(null)
  const prevClientNameRef = useRef<string>('')
  const hasInitializedItemSelection = useRef(false)
  const [shouldShowDropdown, setShouldShowDropdown] = useState(false)
  const [debouncedClientName, setDebouncedClientName] = useState<string>(initialData?.sale?.clientName || '')
  const stableJobNumberRef = useRef<string>('')
  const initialDataRef = useRef(initialData)
  
  // Initialize job card templates
  useEffect(() => {
    initializeJobCardTemplates()
  }, [])

  // Fetch job card templates from master data
  const { records: templateRecords } = useMasters('job_card_template')
  
  // Load purchase records to get client names
  const { records: purchaseRecords } = useMasters('purchase')
  
  // Create a map of purchaseId to clientName
  const purchaseClientMap = useMemo(() => {
    const map = new Map<string, string>()
    purchaseRecords?.forEach((record: any) => {
      const purchaseId = record.id || record.purchase_id
      if (purchaseId && record.clientName) {
        map.set(String(purchaseId), record.clientName)
      }
    })
    return map
  }, [purchaseRecords])
  
  // Load all inventory items - make it stable to avoid re-renders
  const allInventoryItems = useMemo(() => {
    const rawMaterialItems = loadInventoryItems('raw_material', false) // Only completed items
    const toolItems = loadInventoryItems('tool', false) // Only completed items
    return [...rawMaterialItems, ...toolItems]
  }, []) // Empty deps - only load once, reload manually when needed
  
  // Convert master records to template format
  const jobCardTemplates = useMemo(() => {
    return templateRecords
      .filter((record: any) => record.status === 'Active')
      .map((record: any) => {
        let operations: any[] = []
        try {
          operations = typeof record.operations === 'string' 
            ? JSON.parse(record.operations) 
            : (record.operations || [])
        } catch (e) {
          console.error('Error parsing operations:', e)
        }
        
        return {
          template_id: record.template_id || record.id,
          template_name: record.template_name || '',
          template_code: record.template_code || '',
          description: record.description || '',
          operations: operations,
          status: record.status || 'Active',
        }
      })
  }, [templateRecords])
  
  // Get template ID from initial data (from quotation's inquiryData)
  useEffect(() => {
    if (initialData && (initialData as any).jobCardTemplateId) {
      setSelectedTemplateId((initialData as any).jobCardTemplateId)
    }
  }, [initialData])

  // Generate stable job number only once
  useEffect(() => {
    if (!stableJobNumberRef.current) {
      stableJobNumberRef.current = initialData?.jobNumber || generateJobNumber()
    }
  }, [initialData?.jobNumber])

  const defaultValues = useMemo<JobCardFormData>(() => {
    const generatedJobNumber = initialData?.jobNumber || stableJobNumberRef.current || generateJobNumber()
    return {
      jobNumber: generatedJobNumber,
      srNumber: initialData?.srNumber || '1',
      jobDate: initialData?.jobDate || today(),
      jobOrderNumber: initialData?.jobOrderNumber || generatedJobNumber,
      quoteNumber: initialData?.quoteNumber || '',
    quotationId: initialData?.quotationId || '',
      status: (initialData?.status as JobCardFormData['status']) || 'Planned',
    workCenter: initialData?.workCenter || '',
      sale: {
        clientName: initialData?.sale?.clientName || '',
        address: initialData?.sale?.address || '',
        itemName: initialData?.sale?.itemName || '',
        itemDescription: initialData?.sale?.itemDescription || '',
        quantity: initialData?.sale?.quantity || '',
        rawMaterial: initialData?.sale?.rawMaterial || '',
        contactPerson: initialData?.sale?.contactPerson || '',
        contactPhone: initialData?.sale?.contactPhone || '',
        poNumberDate: initialData?.sale?.poNumberDate || '',
        confirmOrderDate: initialData?.sale?.confirmOrderDate || '',
        deliveryDate: initialData?.sale?.deliveryDate || '',
        rmGrade: initialData?.sale?.rmGrade || '',
      },
      design: {
        ownership: initialData?.design?.ownership || [],
        sampleReceived: initialData?.design?.sampleReceived || '',
        drawnBy: initialData?.design?.drawnBy || '',
        comments: initialData?.design?.comments || '',
        issueStart: initialData?.design?.issueStart || '',
        issueEnd: initialData?.design?.issueEnd || '',
      },
      program: {
        cnc: {
          programmer: initialData?.program?.cnc?.programmer || '',
          path1: {
            inDate: initialData?.program?.cnc?.path1?.inDate || '',
            estimateTime: initialData?.program?.cnc?.path1?.estimateTime || '',
            outDate: initialData?.program?.cnc?.path1?.outDate || '',
          },
          path2: {
            inDate: initialData?.program?.cnc?.path2?.inDate || '',
            estimateTime: initialData?.program?.cnc?.path2?.estimateTime || '',
            outDate: initialData?.program?.cnc?.path2?.outDate || '',
          },
        },
        vmc: {
          programmer: initialData?.program?.vmc?.programmer || '',
          path1: {
            inDate: initialData?.program?.vmc?.path1?.inDate || '',
            estimateTime: initialData?.program?.vmc?.path1?.estimateTime || '',
            outDate: initialData?.program?.vmc?.path1?.outDate || '',
          },
          path2: {
            inDate: initialData?.program?.vmc?.path2?.inDate || '',
            estimateTime: initialData?.program?.vmc?.path2?.estimateTime || '',
            outDate: initialData?.program?.vmc?.path2?.outDate || '',
          },
        },
        specialRequirement: initialData?.program?.specialRequirement || '',
        instruction: initialData?.program?.instruction || '',
      },
      operations: buildOperationDefaults(
        initialData?.operations,
        (initialData as any)?.jobCardTemplateId || ''
      ),
      finalInspection: {
        notes: initialData?.finalInspection?.notes || '',
        preparedBy: initialData?.finalInspection?.preparedBy || '',
        checkedBy: initialData?.finalInspection?.checkedBy || '',
        approvedBy: initialData?.finalInspection?.approvedBy || '',
      },
    }
  }, [initialData]) // selectedTemplateId removed - it's handled separately via useEffect

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid },
  } = useForm<JobCardFormData>({
    resolver: zodResolver(jobCardSchema),
    defaultValues,
    mode: 'onBlur', // Validate on blur, not on every keystroke
    shouldUnregister: false, // Keep form values in DOM to prevent focus loss
    shouldFocusError: false, // Don't auto-focus errors to prevent focus loss
  })
  
  // Initialize preview state and debounced client name from initial data - only run when initialData changes
  useEffect(() => {
    // Only initialize if initialData changed (new edit/new create)
    if (initialDataRef.current !== initialData) {
      if (initialData) {
        const clientName = initialData.sale?.clientName || ''
        setPreviewState({
          jobNumber: initialData.jobNumber || '',
          clientName: clientName,
          contactPerson: initialData.sale?.contactPerson || '',
        })
        setDebouncedClientName(clientName)
        prevClientNameRef.current = clientName
      } else {
        // Clear state when initialData becomes undefined
        setPreviewState({
          jobNumber: '',
          clientName: '',
          contactPerson: '',
        })
        setDebouncedClientName('')
        prevClientNameRef.current = ''
      }
      initialDataRef.current = initialData
    }
  }, [initialData])

  const { fields: operationFields, replace: replaceOperations } = useFieldArray({
    control,
    name: 'operations',
  })
  
  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId)
    const template = getJobCardTemplate(templateId)
    if (template && template.operations && template.operations.length > 0) {
      const newOperations = template.operations.map((op) => ({
        operation: op.label || op.key || '',
        date: '',
        start: '',
        end: '',
        operator: '',
        estSetTime: '',
        actualSetTime: '',
        estProcessTime: '',
        actualProcessTime: '',
        diff: '',
        total: '',
        doneBy: '',
        qc: '',
      }))
      replaceOperations(newOperations)
    }
  }
  
  // Auto-load operations when template is pre-selected from quotation - use ref to avoid re-running
  const hasLoadedOperationsRef = useRef(false)
  useEffect(() => {
    if (selectedTemplateId && initialData && (initialData as any).jobCardTemplateId === selectedTemplateId && !hasLoadedOperationsRef.current) {
      const template = getJobCardTemplate(selectedTemplateId)
      if (template && template.operations && template.operations.length > 0) {
        const currentOps = getValues('operations')
        // Only replace if operations are empty or default
        if (!currentOps || currentOps.length === 0 || 
            (currentOps.length === 1 && currentOps[0].operation === 'OPERATION 1')) {
          const newOperations = template.operations.map((op) => ({
            operation: op.label || op.key || '',
            date: '',
            start: '',
            end: '',
            operator: '',
            estSetTime: '',
            actualSetTime: '',
            estProcessTime: '',
            actualProcessTime: '',
            diff: '',
            total: '',
            doneBy: '',
            qc: '',
          }))
          replaceOperations(newOperations)
          hasLoadedOperationsRef.current = true
        }
      }
    }
    // Reset flag when initialData changes
    if (initialDataRef.current !== initialData) {
      hasLoadedOperationsRef.current = false
    }
  }, [selectedTemplateId, initialData, replaceOperations]) // Removed getValues from deps

  // CRITICAL FIX: Only watch fields that MUST trigger UI updates (status dropdown, design ownership)
  // DO NOT watch input fields - it causes re-renders that lose focus on every keystroke
  const designOwnership = useWatch({ control, name: 'design.ownership', defaultValue: [] }) || []
  const watchedStatus = useWatch({ control, name: 'status' })
  
  // For preview: Use state that only updates on blur, NEVER during typing
  const [previewState, setPreviewState] = useState({
    jobNumber: initialData?.jobNumber || '',
    clientName: initialData?.sale?.clientName || '',
    contactPerson: initialData?.sale?.contactPerson || '',
  })
  
  // Update preview state ONLY on blur - never during typing
  const updatePreviewOnBlur = useCallback(() => {
    const currentValues = getValues()
    setPreviewState({
      jobNumber: currentValues.jobNumber || '',
      clientName: currentValues.sale?.clientName || '',
      contactPerson: currentValues.sale?.contactPerson || '',
    })
    // Also update debounced client name for inventory filtering
    setDebouncedClientName(currentValues.sale?.clientName || '')
  }, [getValues])
  
  // Create preview object from state
  const preview = useMemo(() => ({
    jobNumber: previewState.jobNumber,
    sale: {
      clientName: previewState.clientName,
      contactPerson: previewState.contactPerson
    }
  }), [previewState])

  // Filter inventory items by debounced client name
  const filteredInventoryItems = useMemo(() => {
    if (!debouncedClientName || debouncedClientName.trim() === '') {
      return []
    }
    
    const clientNameLower = debouncedClientName.toLowerCase().trim()
    return allInventoryItems.filter((item) => {
      if (!item.purchaseId) return false
      const itemClientName = purchaseClientMap.get(String(item.purchaseId))
      return itemClientName?.toLowerCase() === clientNameLower
    })
  }, [debouncedClientName, allInventoryItems, purchaseClientMap])

  // Set selectedInventoryItemId when editing - only run once when initialData has itemName
  useEffect(() => {
    // Only run this effect once when editing, not on every keystroke
    if (!hasInitializedItemSelection.current && initialData?.sale?.itemName) {
      const itemName = initialData.sale.itemName
      // Search in all items (not filtered) to avoid dependency on clientName changes
      const matchingItem = allInventoryItems.find(item => 
        item.item.toLowerCase() === itemName.toLowerCase().trim()
      )
      if (matchingItem) {
        setSelectedInventoryItemId(matchingItem.id)
        hasInitializedItemSelection.current = true
      } else {
        // Mark as initialized even if no match to avoid retrying
        hasInitializedItemSelection.current = true
      }
    }
    // Reset flag when switching to a new record without itemName
    if (!initialData?.sale?.itemName) {
      hasInitializedItemSelection.current = false
    }
  }, [initialData?.sale?.itemName, allInventoryItems]) // Only depend on initialData.itemName and allInventoryItems

  // Update shouldShowDropdown based on debounced client name - only when it changes on blur
  useEffect(() => {
    if (debouncedClientName && filteredInventoryItems.length > 0) {
      setShouldShowDropdown(true)
    } else {
      setShouldShowDropdown(false)
    }
    
    // Clear selection if client name becomes empty
    const prevClientName = prevClientNameRef.current
    if (prevClientName && prevClientName.trim() !== '' && (!debouncedClientName || debouncedClientName.trim() === '')) {
      setSelectedInventoryItemId(null)
      setValue('sale.itemName', '', { shouldDirty: false })
      setValue('sale.rawMaterial', '', { shouldDirty: false })
      hasInitializedItemSelection.current = false
      setShouldShowDropdown(false)
    }
    
    // Update ref
    if (prevClientName !== debouncedClientName) {
      prevClientNameRef.current = debouncedClientName
    }
  }, [debouncedClientName, filteredInventoryItems.length, setValue])

  const toggleDesignOwnership = (option: typeof DESIGN_CHOICES[number]) => {
    const current = designOwnership || []
    const exists = current.includes(option)
    const updated = exists ? current.filter((value) => value !== option) : [...current, option]
    setValue('design.ownership', updated, { shouldDirty: true })
  }

  // Handle item selection
  const handleItemSelect = (itemId: string) => {
    const selectedItem = filteredInventoryItems.find(item => item.id === itemId)
    if (selectedItem) {
      setSelectedInventoryItemId(itemId)
      setValue('sale.itemName', selectedItem.item, { shouldDirty: true })
      // Auto-fill raw material with material grade and size
      const rawMaterialParts = []
      if (selectedItem.materialGrade) rawMaterialParts.push(selectedItem.materialGrade)
      if (selectedItem.size) rawMaterialParts.push(selectedItem.size)
      if (rawMaterialParts.length > 0) {
        setValue('sale.rawMaterial', rawMaterialParts.join(' / '), { shouldDirty: true })
      }
    }
  }

  const handleFormSubmit = async (data: JobCardFormData) => {
    // Reduce inventory stock if item and quantity are provided
    if (selectedInventoryItemId && data.sale.quantity) {
      const qty = parseFloat(data.sale.quantity)
      if (!isNaN(qty) && qty > 0) {
        // Reload inventory items to get fresh stock data
        const rawMaterialItems = loadInventoryItems('raw_material', false)
        const toolItems = loadInventoryItems('tool', false)
        const freshInventoryItems = [...rawMaterialItems, ...toolItems]
        const selectedItem = freshInventoryItems.find(item => item.id === selectedInventoryItemId)
        if (selectedItem) {
          if (selectedItem.availableStock < qty) {
            alert(`Insufficient stock for ${selectedItem.item}. Available: ${selectedItem.availableStock}, Requested: ${qty}`)
            return // Prevent form submission if insufficient stock
          }
          const success = reduceInventoryStock(selectedInventoryItemId, qty, selectedItem.type)
          if (!success) {
            alert(`Failed to reduce inventory stock for ${selectedItem.item}`)
            return // Prevent form submission if stock reduction fails
          }
        }
      }
    }
    
    await onSubmit(data)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2500)
  }

  const SectionCard = ({
    title,
    description,
    children,
  }: {
    title: string
    description?: string
    children: ReactNode
  }) => (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description && <p className="text-sm text-slate-600 mt-1">{description}</p>}
      </div>
      <div className="p-6 space-y-6">{children}</div>
    </section>
  )

  const TableHeaderCell = ({ children }: { children: ReactNode }) => (
    <th className="border border-slate-400 bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 text-left">
      {children}
    </th>
  )

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      <div className="rounded-3xl border border-orange-200 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-white/90">Keytex Machines</p>
            <h2 className="text-3xl font-semibold text-white">Job Card</h2>
            <p className="text-sm text-white/90 max-w-2xl">
              Modern planning sheet capturing sales, design, program, and machining milestones in one place.
            </p>
          </div>
          <div className="grid w-full gap-3 md:grid-cols-3 lg:w-auto">
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/85">Job Number</p>
              <p className="text-lg font-semibold text-white">{preview.jobNumber || '—'}</p>
              </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/85">Client</p>
              <p className="text-lg font-semibold text-white">
                {preview.sale?.clientName || preview.sale?.contactPerson || 'Not assigned'}
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/85">Status</p>
              <p className="text-lg font-semibold text-white">{watchedStatus}</p>
              </div>
            </div>
          </div>
        </div>

      <SectionCard title="Job Overview" description="Core metadata used across production, QA and planning.">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Sr. No.</Label>
            <Input placeholder="Auto / manual" {...register('srNumber')} />
            {errors.srNumber && <p className="text-xs text-destructive">{errors.srNumber.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Job Date</Label>
            <Input type="date" {...register('jobDate')} />
            {errors.jobDate && <p className="text-xs text-destructive">{errors.jobDate.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Job Order No.</Label>
            <Input placeholder="J2506-0001" {...register('jobOrderNumber')} />
            {errors.jobOrderNumber && <p className="text-xs text-destructive">{errors.jobOrderNumber.message}</p>}
          </div>
            <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Job Number</Label>
            <Input placeholder="JC-000123" {...register('jobNumber')} />
              {errors.jobNumber && <p className="text-xs text-destructive">{errors.jobNumber.message}</p>}
            </div>
            <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Quote No.</Label>
            <Input placeholder="QU/KM/01" {...register('quoteNumber')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Quotation ID</Label>
            <Input placeholder="Link to quotation record" {...register('quotationId')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Status</Label>
            <select
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              value={watchedStatus}
              onChange={(event) =>
                setValue('status', event.target.value as JobCardFormData['status'], { shouldDirty: true })
              }
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Sales Details" description="Customer info, commercial references, and order milestones.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Client Name</Label>
            <Input 
              placeholder="Company / customer" 
              {...register('sale.clientName', {
                onBlur: updatePreviewOnBlur
              })} 
            />
            {errors.sale?.clientName && <p className="text-xs text-destructive">{errors.sale.clientName.message}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Address</Label>
            <Input placeholder="Site / billing address" {...register('sale.address')} />
            </div>
            <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Contact Person</Label>
            <Input 
              placeholder="Primary contact" 
              {...register('sale.contactPerson', {
                onBlur: updatePreviewOnBlur
              })} 
            />
            </div>
            <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Contact Phone</Label>
            <Input placeholder="+91 98765 43210" {...register('sale.contactPhone')} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Item Name</Label>
            {shouldShowDropdown ? (
              <Select
                value={selectedInventoryItemId || ''}
                onValueChange={handleItemSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item from inventory">
                    {selectedInventoryItemId 
                      ? filteredInventoryItems.find(item => item.id === selectedInventoryItemId)?.item || "Select item from inventory"
                      : "Select item from inventory"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {filteredInventoryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.item} - {item.materialGrade || 'N/A'} - Stock: {item.availableStock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input 
                placeholder={debouncedClientName ? "No inventory items found for this client" : "Enter client name first"} 
                {...register('sale.itemName')} 
                disabled={!!debouncedClientName && filteredInventoryItems.length === 0}
              />
            )}
            </div>
              <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Item Description</Label>
            <Input placeholder="Short description" {...register('sale.itemDescription')} />
              </div>
              <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Quantity</Label>
            <Input placeholder="Qty" {...register('sale.quantity')} />
              </div>
              <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Raw Material</Label>
            <Input placeholder="Material / size" {...register('sale.rawMaterial')} />
              </div>
            </div>
        <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">P.O. Number & Date</Label>
            <Input placeholder="PO123 / 14-11-2025" {...register('sale.poNumberDate')} />
              </div>
              <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Confirm Order Date</Label>
            <Input type="date" {...register('sale.confirmOrderDate')} />
              </div>
              <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Delivery Date</Label>
            <Input type="date" {...register('sale.deliveryDate')} />
              </div>
              </div>
              <div className="space-y-1">
          <Label className="text-xs uppercase text-slate-500">RM Grade</Label>
          <Input placeholder="EN31, SS304, etc." {...register('sale.rmGrade')} />
        </div>
      </SectionCard>

      <SectionCard title="Design & Engineering" description="Ownership, drawing status, and design issue window.">
        <div className="flex flex-wrap gap-3">
          {DESIGN_CHOICES.map((option) => {
            const active = designOwnership?.includes(option)
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleDesignOwnership(option)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                  active
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 text-slate-600 hover:border-slate-400'
                }`}
              >
                {option}
              </button>
            )
          })}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Sample Received</Label>
            <Input placeholder="Sample status" {...register('design.sampleReceived')} />
              </div>
              <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Drawn By</Label>
            <Input placeholder="Designer / drafter" {...register('design.drawnBy')} />
              </div>
            </div>
            <div className="space-y-1">
          <Label className="text-xs uppercase text-slate-500">Design Comments</Label>
          <Textarea rows={3} placeholder="Notes, change requests, tooling info" {...register('design.comments')} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Design Issue Start</Label>
            <Input type="date" {...register('design.issueStart')} />
              </div>
              <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Design Issue End</Label>
            <Input type="date" {...register('design.issueEnd')} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Programming Schedule" description="CNC & VMC program tracking with estimates and outputs.">
        <div className="grid gap-6 lg:grid-cols-2">
          {(['cnc', 'vmc'] as const).map((machine) => (
            <div key={machine} className="rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-base font-semibold text-slate-900">{machine.toUpperCase()}</h4>
                <Input
                  placeholder="Programmed by"
                  className="md:w-56"
                  {...register(`program.${machine}.programmer` as const)}
                />
              </div>
              <div className="space-y-4">
                {PROGRAM_PATHS.map((pathKey, index) => (
                  <div key={pathKey} className="rounded-xl bg-slate-50/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-3">
                      Path {index + 1}
                    </p>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] uppercase text-slate-500">Program IN Date</Label>
                        <Input
                          type="datetime-local"
                          className="h-10"
                          {...register(`program.${machine}.${pathKey}.inDate` as const)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] uppercase text-slate-500">Estimate Time</Label>
                        <Input
                          placeholder="HH:MM"
                          {...register(`program.${machine}.${pathKey}.estimateTime` as const)}
                        />
              </div>
              <div className="space-y-1">
                        <Label className="text-[11px] uppercase text-slate-500">Program OUT Date</Label>
                        <Input
                          type="datetime-local"
                          className="h-10"
                          {...register(`program.${machine}.${pathKey}.outDate` as const)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Special Requirement</Label>
              <Textarea
                rows={3}
              placeholder="Fixture notes, tooling, CMM requirement..."
              {...register('program.specialRequirement')}
              />
            </div>
            <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Instruction</Label>
            <Textarea
              rows={3}
              placeholder="Process instructions, material alerts..."
              {...register('program.instruction')}
            />
          </div>
            </div>
            <div className="space-y-1">
          <Label className="text-xs uppercase text-slate-500">Work Center / Tool List Reference</Label>
          <Input placeholder="As per annexure or cell" {...register('workCenter')} />
        </div>
      </SectionCard>

      <SectionCard title="Operations Tracking" description="Record machining progress, set-up times and QC sign-offs.">
        {/* Job Card Template Selection */}
        <div className="space-y-2 border-b border-slate-200 pb-4">
          <Label className="text-sm font-semibold text-slate-700">Job Card Template</Label>
          <Select
            value={selectedTemplateId}
            onValueChange={handleTemplateChange}
          >
            <SelectTrigger className="h-10 w-full md:w-96">
              <SelectValue placeholder="Select job card template to load operations" />
            </SelectTrigger>
            <SelectContent>
              {jobCardTemplates.map((template: any) => (
                <SelectItem key={template.template_id} value={template.template_id}>
                  {template.template_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">
            Select a template to automatically populate the operations table below
          </p>
        </div>
        
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[960px] text-[12px]">
            <thead>
              <tr>
                <TableHeaderCell>Sr No</TableHeaderCell>
                <TableHeaderCell>Operation</TableHeaderCell>
                <TableHeaderCell>Start</TableHeaderCell>
                <TableHeaderCell>End</TableHeaderCell>
                <TableHeaderCell>Operator</TableHeaderCell>
                <TableHeaderCell>Est set time</TableHeaderCell>
                <TableHeaderCell>Actual set time</TableHeaderCell>
                <TableHeaderCell>Est P. time</TableHeaderCell>
                <TableHeaderCell>Actual P. time</TableHeaderCell>
                <TableHeaderCell>Diff</TableHeaderCell>
                <TableHeaderCell>Total</TableHeaderCell>
                <TableHeaderCell>Done By</TableHeaderCell>
                <TableHeaderCell>Q.C.</TableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {operationFields.map((field, index) => (
                <tr key={field.id} className="border-t border-slate-100">
                  <td className="border border-slate-100 px-2 py-2 text-center font-semibold">{index + 1}</td>
                  <td className="border border-slate-100 px-2 py-2 font-semibold text-slate-700">{field.operation}</td>
                  <td className="border border-slate-100 px-1 py-1">
                    <Input
                      type="datetime-local"
                      className="h-9"
                      {...register(`operations.${index}.start` as const)}
                    />
                  </td>
                  <td className="border border-slate-100 px-1 py-1">
                    <Input
                      type="datetime-local"
                      className="h-9"
                      {...register(`operations.${index}.end` as const)}
                    />
                  </td>
                  <td className="border border-slate-100 px-1 py-1">
                    <Input className="h-9" placeholder="Operator" {...register(`operations.${index}.operator` as const)} />
                  </td>
                  <td className="border border-slate-100 px-1 py-1">
                    <Input className="h-9" placeholder="00:00" {...register(`operations.${index}.estSetTime` as const)} />
                  </td>
                  <td className="border border-slate-100 px-1 py-1">
                    <Input className="h-9" placeholder="00:00" {...register(`operations.${index}.actualSetTime` as const)} />
                  </td>
                  <td className="border border-slate-100 px-1 py-1">
                    <Input
                      className="h-9"
                      placeholder="00:00"
                      {...register(`operations.${index}.estProcessTime` as const)}
                    />
                  </td>
                  <td className="border border-slate-100 px-1 py-1">
                    <Input
                      className="h-9"
                      placeholder="00:00"
                      {...register(`operations.${index}.actualProcessTime` as const)}
                    />
                  </td>
                  <td className="border border-slate-100 px-1 py-1">
                    <Input className="h-9" placeholder="+/-" {...register(`operations.${index}.diff` as const)} />
                  </td>
                  <td className="border border-slate-100 px-1 py-1">
                    <Input className="h-9" placeholder="Total" {...register(`operations.${index}.total` as const)} />
                  </td>
                  <td className="border border-slate-100 px-1 py-1">
                    <Input className="h-9" placeholder="Done by" {...register(`operations.${index}.doneBy` as const)} />
                  </td>
                  <td className="border border-slate-100 px-1 py-1">
                    <Input className="h-9" placeholder="QC" {...register(`operations.${index}.qc` as const)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
      </SectionCard>

      <SectionCard title="Final Inspection & Sign-off" description="Capture QC notes and responsible stakeholders.">
        <div className="space-y-1">
          <Label className="text-xs uppercase text-slate-500">Final Inspection Notes</Label>
            <Textarea
              rows={3}
            placeholder="Inspection summary, NCR, packing instruction..."
            {...register('finalInspection.notes')}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Prepared By</Label>
            <Input placeholder="Planner / engineer" {...register('finalInspection.preparedBy')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Checked By</Label>
            <Input placeholder="Supervisor" {...register('finalInspection.checkedBy')} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase text-slate-500">Approved By</Label>
            <Input placeholder="Approver / QA" {...register('finalInspection.approvedBy')} />
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end gap-3 pb-4">
        <Button type="submit" disabled={!isValid || isLoading} className="bg-slate-900 text-white hover:bg-slate-800">
              {isLoading ? 'Saving...' : submitted ? 'Saved' : 'Save Job Card'}
            </Button>
      </div>
    </form>
  )
}

