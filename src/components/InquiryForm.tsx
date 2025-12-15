import { useState, useEffect, useMemo } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
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
import { Plus, X, Upload } from 'lucide-react'
import { getJobCardTemplate, initializeJobCardTemplates, JobCardTemplate } from '../lib/jobCardTemplates'
import { useMasters } from '../hooks/useMasters'

const productSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  material: z.string().min(1, 'Material is required'),
  deliveryTime: z.string().min(1, 'Delivery time is required'),
  designFileName: z.string().optional(),
  designFileData: z.string().optional(),
  // Job Card Template Selection
  jobCardTemplateId: z.string().optional(),
  // Manufacturing Specifications per product (dynamic based on job card template)
  rawMaterialSize: z.string().optional(),
  rawMaterialPrice: z.string().optional(),
  // Dynamic operation fields will be stored in a flexible object
  operationFields: z.record(z.string()).optional(),
  // Legacy fields for backward compatibility
  cncSide1: z.string().optional(),
  cncSide2: z.string().optional(),
  cncSide3: z.string().optional(),
  vmcSide1: z.string().optional(),
  vmcSide2: z.string().optional(),
  vmcSide3: z.string().optional(),
  axis4: z.string().optional(),
  axis5: z.string().optional(),
  hardening: z.string().optional(),
  grinding: z.string().optional(),
  coating: z.string().optional(),
  qcRequired: z.boolean().optional().default(false),
  specialReq: z.string().optional(),
  additionalDetails: z.string().optional(),
})

const inquirySchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  contactNumber: z.string().min(1, 'Contact number is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  source: z.string().optional(),
  clientProvidesMaterial: z.enum(['company', 'client']).default('company'),
  products: z.array(productSchema).min(1, 'Add at least one product'),
})

export type InquiryFormData = z.infer<typeof inquirySchema>

interface InquiryFormProps {
  initialData?: InquiryFormData
  onSubmit: (data: InquiryFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export default function InquiryForm({ initialData, onSubmit, onCancel, isLoading = false }: InquiryFormProps) {
  const [submitted, setSubmitted] = useState(false)
  
  // Initialize job card templates
  useEffect(() => {
    initializeJobCardTemplates()
  }, [])

  // Fetch job card templates from master data
  const { records: templateRecords, isLoading: isLoadingTemplates } = useMasters('job_card_template')
  
  // Convert master records to JobCardTemplate format
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
        } as JobCardTemplate
      })
  }, [templateRecords])

  const { register, handleSubmit, control, watch, setValue, getValues, formState: { errors, isValid } } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    mode: 'onChange',
    defaultValues: initialData || {
      companyName: '',
      contactPerson: '',
      contactNumber: '',
      email: '',
      address: '',
      source: '',
      clientProvidesMaterial: 'company',
      products: [{
        itemName: '',
        quantity: '',
        material: '',
        deliveryTime: '',
        designFileName: '',
        designFileData: '',
        jobCardTemplateId: '',
        rawMaterialSize: '',
        rawMaterialPrice: '',
        operationFields: {},
        cncSide1: '',
        cncSide2: '',
        cncSide3: '',
        vmcSide1: '',
        vmcSide2: '',
        vmcSide3: '',
        axis4: '',
        axis5: '',
        hardening: '',
        grinding: '',
        coating: '',
        qcRequired: false,
        specialReq: '',
        additionalDetails: '',
      }],
    }
  })

  const { fields: productFields, append, remove } = useFieldArray({ control, name: 'products' })

  const companyComplete = !!watch('companyName') && !!watch('contactPerson') && !!watch('contactNumber')
  const clientProvidesMaterial = watch('clientProvidesMaterial')
  const products = watch('products')
  const productsComplete = Array.isArray(products) && products.length > 0 && products.every(p => p.itemName && p.quantity && p.material && p.deliveryTime)
  const specsComplete = true
  const canShowReview = companyComplete && productsComplete && specsComplete

  useEffect(() => {
    if (clientProvidesMaterial === 'client') {
      const currentProducts = getValues('products') || []
      currentProducts.forEach((_, index) => {
        setValue(`products.${index}.rawMaterialSize`, '')
        setValue(`products.${index}.rawMaterialPrice`, '')
      })
    }
  }, [clientProvidesMaterial, getValues, setValue])

  const handleFile = async (file: File, index: number) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setValue(`products.${index}.designFileName`, file.name)
      setValue(`products.${index}.designFileData`, result)
    }
    reader.readAsDataURL(file)
  }

  const handleFormSubmit = async (data: InquiryFormData) => {
    const submitData = {
      ...data,
      status: (data as any).status || 'new',
      priority: (data as any).priority || 'low',
      followUps: (data as any).followUps || 0,
      createdAt: new Date().toISOString()
    }
    await onSubmit(submitData as InquiryFormData)
    setSubmitted(true)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Company Information */}
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Company Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Company Name <span className="text-destructive">*</span></Label>
            <Input placeholder="Enter company name" {...register('companyName')} />
            {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Contact Person Name <span className="text-destructive">*</span></Label>
            <Input placeholder="Enter contact person name" {...register('contactPerson')} />
            {errors.contactPerson && <p className="text-xs text-destructive">{errors.contactPerson.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Contact Number <span className="text-destructive">*</span></Label>
            <Input placeholder="Enter contact number" {...register('contactNumber')} />
            {errors.contactNumber && <p className="text-xs text-destructive">{errors.contactNumber.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Email Address</Label>
            <Input placeholder="Enter email address" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Address</Label>
            <Textarea placeholder="Enter complete address" {...register('address')} />
          </div>
          <div className="space-y-1">
            <Label>Source</Label>
            <Select
              value={watch('source') || ''}
              onValueChange={(value) => setValue('source', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="social-media">Social Media</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone-call">Phone Call</SelectItem>
                <SelectItem value="walk-in">Walk-in</SelectItem>
                <SelectItem value="trade-show">Trade Show</SelectItem>
                <SelectItem value="tradeindia">TradeIndia</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Material Supply</Label>
            <Select
              value={clientProvidesMaterial || 'company'}
              onValueChange={(value) => setValue('clientProvidesMaterial', value as 'company' | 'client')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Who provides material?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company">We will supply the material</SelectItem>
                <SelectItem value="client">Client will supply the material</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Product Details</h3>
          <Button type="button" onClick={() => append({
            itemName: '',
            quantity: '',
            material: '',
            deliveryTime: '',
            designFileName: '',
            designFileData: '',
            jobCardTemplateId: '',
            rawMaterialSize: '',
            rawMaterialPrice: '',
            operationFields: {},
            cncSide1: '',
            cncSide2: '',
            cncSide3: '',
            vmcSide1: '',
            vmcSide2: '',
            vmcSide3: '',
            axis4: '',
            axis5: '',
            hardening: '',
            grinding: '',
            coating: '',
            qcRequired: false,
            specialReq: '',
            additionalDetails: '',
          })}>
            <Plus className="h-4 w-4 mr-1" /> Add Product
          </Button>
        </div>

        {productFields.map((field, index) => (
          <div key={field.id} className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Product {index + 1}</h4>
              {productFields.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(index)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Item Name <span className="text-destructive">*</span></Label>
                <Input placeholder="Enter item name" {...register(`products.${index}.itemName` as const)} />
                {errors.products?.[index]?.itemName && <p className="text-xs text-destructive">{errors.products[index]?.itemName?.message as string}</p>}
              </div>
              <div className="space-y-1">
                <Label>Quantity Required <span className="text-destructive">*</span></Label>
                <Input placeholder="Enter quantity" {...register(`products.${index}.quantity` as const)} />
                {errors.products?.[index]?.quantity && <p className="text-xs text-destructive">{errors.products[index]?.quantity?.message as string}</p>}
              </div>
              <div className="space-y-1">
                <Label>Material <span className="text-destructive">*</span></Label>
                <Input placeholder="Enter material type" {...register(`products.${index}.material` as const)} />
                {errors.products?.[index]?.material && <p className="text-xs text-destructive">{errors.products[index]?.material?.message as string}</p>}
              </div>
              <div className="space-y-1">
                <Label>Delivery Time <span className="text-destructive">*</span></Label>
                <Input placeholder="Enter required delivery time" {...register(`products.${index}.deliveryTime` as const)} />
                {errors.products?.[index]?.deliveryTime && <p className="text-xs text-destructive">{errors.products[index]?.deliveryTime?.message as string}</p>}
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Design File</Label>
                <div className="border-2 border-dashed rounded-md p-6 flex items-center justify-center text-muted-foreground">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Upload className="h-4 w-4" />
                    <span>Click to upload design file</span>
                    <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, index) }} />
                  </label>
                </div>
                {watch(`products.${index}.designFileName`) && (
                  <p className="text-xs mt-1">Selected: {watch(`products.${index}.designFileName`)}</p>
                )}
              </div>
            </div>

            {/* Manufacturing Specifications per Product */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4 border-t mt-4">
              <h4 className="font-semibold text-sm">Manufacturing Specifications</h4>
              
              {/* Job Card Template Selection */}
              <div className="space-y-1">
                <Label className="text-sm">Job Card Template <span className="text-destructive">*</span></Label>
                <Select
                  value={watch(`products.${index}.jobCardTemplateId`) || ''}
                  onValueChange={(value) => {
                    setValue(`products.${index}.jobCardTemplateId`, value)
                    // Initialize operation fields when template is selected
                    const template = getJobCardTemplate(value)
                    if (template) {
                      const initialFields: Record<string, string> = {}
                      template.operations.forEach((op) => {
                        initialFields[op.key] = ''
                      })
                      setValue(`products.${index}.operationFields`, initialFields)
                    }
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select job card template" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobCardTemplates.map((template) => (
                      <SelectItem key={template.template_id} value={template.template_id}>
                        {template.template_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Raw Material Fields */}
              {clientProvidesMaterial === 'client' ? (
                <div className="text-sm text-muted-foreground bg-white border border-dashed rounded-md p-3">
                  Client is supplying the material, so size and price are not required.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm">Raw Material Size</Label>
                    <Input placeholder="Enter raw material size" {...register(`products.${index}.rawMaterialSize` as const)} className="h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">Raw Material Price</Label>
                    <Input placeholder="Enter raw material price" {...register(`products.${index}.rawMaterialPrice` as const)} className="h-9" />
                  </div>
                </div>
              )}

              {/* Dynamic Operation Fields based on selected Job Card Template */}
              {(() => {
                const selectedTemplateId = watch(`products.${index}.jobCardTemplateId`)
                const selectedTemplate = selectedTemplateId ? getJobCardTemplate(selectedTemplateId) : null
                
                if (!selectedTemplate) {
                  return (
                    <div className="text-sm text-muted-foreground p-4 bg-white rounded border border-dashed">
                      Please select a job card template to see operation fields
                    </div>
                  )
                }

                return (
                  <div className="space-y-4">
                    <div className="border-t pt-4">
                      <h5 className="font-medium text-sm mb-3">Operation Fields ({selectedTemplate.template_name})</h5>
                      <div className="grid md:grid-cols-2 gap-4">
                        {selectedTemplate.operations.map((operation) => (
                          <div key={operation.key} className="space-y-1">
                            <Label className="text-sm">{operation.label}</Label>
                            {operation.type === 'textarea' ? (
                              <Textarea
                                placeholder={`Enter ${operation.label.toLowerCase()}`}
                                {...register(`products.${index}.operationFields.${operation.key}` as const)}
                                className="min-h-[80px]"
                              />
                            ) : (
                              <Input
                                placeholder={`Enter ${operation.label.toLowerCase()}`}
                                {...register(`products.${index}.operationFields.${operation.key}` as const)}
                                className="h-9"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Additional Fields */}
              <div className="grid md:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-1 md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <input id={`qcRequired-${index}`} type="checkbox" {...register(`products.${index}.qcRequired` as const)} />
                    <Label htmlFor={`qcRequired-${index}`} className="text-sm">Q.C. Report Required</Label>
                  </div>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-sm">Special Requirements</Label>
                  <Textarea placeholder="Any special requirements" {...register(`products.${index}.specialReq` as const)} className="min-h-[80px]" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-sm">Additional Details</Label>
                  <Textarea placeholder="More details about the product or requirements" {...register(`products.${index}.additionalDetails` as const)} className="min-h-[80px]" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* Review & Submit - gated */}
      {canShowReview && (
        <div className="bg-white border rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold">Review & Submit</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold">Company Information</h4>
              <div className="text-sm">Company: {watch('companyName') || '-'}</div>
              <div className="text-sm">Contact Person: {watch('contactPerson') || '-'}</div>
              <div className="text-sm">Phone: {watch('contactNumber') || '-'}</div>
              <div className="text-sm">Email: {watch('email') || '-'}</div>
              <div className="text-sm">Source: {watch('source') ? watch('source').charAt(0).toUpperCase() + watch('source').slice(1).replace('-', ' ') : '-'}</div>
                <div className="text-sm">
                  Material Supply: {clientProvidesMaterial === 'client' ? 'Client supplied' : 'We supply'}
                </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Products Summary</h4>
              {watch('products').map((p, i) => (
                <div key={i} className="text-sm">
                  <div>Product {i + 1}: {p.itemName || '-'}</div>
                  <div>Quantity: {p.quantity || '-'}</div>
                  <div>Material: {p.material || '-'}</div>
                  <div>Delivery: {p.deliveryTime || '-'}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={!isValid || isLoading}>{isLoading ? 'Saving...' : submitted ? 'Submitted' : 'Submit Inquiry'}</Button>
          </div>
        </div>
      )}
    </form>
  )
}


