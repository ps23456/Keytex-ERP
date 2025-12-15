import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import MainLayout from '../layouts/MainLayout'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import { Plus, X, Upload } from 'lucide-react'
import { useState } from 'react'

const productSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  material: z.string().min(1, 'Material is required'),
  deliveryTime: z.string().min(1, 'Delivery time is required'),
  designFileName: z.string().optional(),
  designFileData: z.string().optional(),
})

const inquirySchema = z.object({
  // Company Information
  companyName: z.string().min(1, 'Company name is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  contactNumber: z.string().min(1, 'Contact number is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),

  // Product Details
  products: z.array(productSchema).min(1, 'Add at least one product'),

  // Manufacturing Specifications
  rawMaterialSize: z.string().optional(),
  rawMaterialPrice: z.string().optional(),
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

type InquiryFormData = z.infer<typeof inquirySchema>

export default function InquiryPage() {
  const [submitted, setSubmitted] = useState(false)

  const { register, handleSubmit, control, watch, setValue, formState: { errors, isValid } } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    mode: 'onChange',
    defaultValues: {
      companyName: '',
      contactPerson: '',
      contactNumber: '',
      email: '',
      address: '',
      products: [{ itemName: '', quantity: '', material: '', deliveryTime: '', designFileName: '', designFileData: '' }],
      qcRequired: false,
    }
  })

  const { fields: productFields, append, remove } = useFieldArray({ control, name: 'products' })

  const onSubmit = (data: InquiryFormData) => {
    console.log('Inquiry submitted', data)
    setSubmitted(true)
  }

  const companyComplete = !!watch('companyName') && !!watch('contactPerson') && !!watch('contactNumber')
  const products = watch('products')
  const productsComplete = Array.isArray(products) && products.length > 0 && products.every(p => p.itemName && p.quantity && p.material && p.deliveryTime)
  const specsComplete = true // Specs have no required fields in the screenshots
  const canShowReview = companyComplete && productsComplete && specsComplete

  const handleFile = async (file: File, index: number) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setValue(`products.${index}.designFileName`, file.name)
      setValue(`products.${index}.designFileData`, result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <MainLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Company Information */}
        <section className="bg-white border rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-semibold">Company Information</span>
          </div>
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
          </div>
        </section>

        {/* Product Details */}
        <section className="bg-white border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xl font-semibold">Product Details</span>
            <Button type="button" onClick={() => append({ itemName: '', quantity: '', material: '', deliveryTime: '', designFileName: '', designFileData: '' })}>
              <Plus className="h-4 w-4 mr-1" /> Add Product
            </Button>
          </div>

          {productFields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Product {index + 1}</h3>
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
            </div>
          ))}
        </section>

        {/* Manufacturing Specifications */}
        <section className="bg-white border rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-semibold">Manufacturing Specifications</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Raw Material Size</Label>
              <Input placeholder="Enter raw material size" {...register('rawMaterialSize')} />
            </div>
            <div className="space-y-1">
              <Label>Raw Material Price</Label>
              <Input placeholder="Enter raw material price" {...register('rawMaterialPrice')} />
            </div>
            <div className="space-y-1">
              <Label>CNC Turning side 1</Label>
              <Input placeholder="CNC turning side 1" {...register('cncSide1')} />
            </div>
            <div className="space-y-1">
              <Label>CNC Turning side 2</Label>
              <Input placeholder="CNC turning side 2" {...register('cncSide2')} />
            </div>
            <div className="space-y-1">
              <Label>CNC Turning side 3</Label>
              <Input placeholder="CNC turning side 3" {...register('cncSide3')} />
            </div>
            <div className="space-y-1">
              <Label>VMC side 1</Label>
              <Input placeholder="VMC side 1" {...register('vmcSide1')} />
            </div>
            <div className="space-y-1">
              <Label>VMC side 2</Label>
              <Input placeholder="VMC side 2" {...register('vmcSide2')} />
            </div>
            <div className="space-y-1">
              <Label>VMC side 3</Label>
              <Input placeholder="VMC side 3" {...register('vmcSide3')} />
            </div>
            <div className="space-y-1">
              <Label>4th axis operations</Label>
              <Input placeholder="4th axis operations" {...register('axis4')} />
            </div>
            <div className="space-y-1">
              <Label>5th axis operations</Label>
              <Input placeholder="5th axis operations" {...register('axis5')} />
            </div>
            <div className="space-y-1">
              <Label>Hardening requirements</Label>
              <Input placeholder="Hardening requirements" {...register('hardening')} />
            </div>
            <div className="space-y-1">
              <Label>Grinding specifications</Label>
              <Input placeholder="Grinding specifications" {...register('grinding')} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Coating requirements</Label>
              <Input placeholder="Coating requirements" {...register('coating')} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <div className="flex items-center space-x-2">
                <input id="qcRequired" type="checkbox" {...register('qcRequired')} />
                <Label htmlFor="qcRequired">Q.C. Report Required</Label>
              </div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Special Requirements</Label>
              <Textarea placeholder="Any special requirements" {...register('specialReq')} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Additional Details</Label>
              <Textarea placeholder="More details about the product or requirements" {...register('additionalDetails')} />
            </div>
          </div>
        </section>

        {/* Review & Submit - gated */}
        {canShowReview && (
          <section className="bg-white border rounded-lg p-6 space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-semibold">Review & Submit</span>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold">Company Information</h4>
                <div className="text-sm">Company: {watch('companyName') || '-'}</div>
                <div className="text-sm">Contact Person: {watch('contactPerson') || '-'}</div>
                <div className="text-sm">Phone: {watch('contactNumber') || '-'}</div>
                <div className="text-sm">Email: {watch('email') || '-'}</div>
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
            <div className="flex justify-end">
              <Button type="submit" disabled={!isValid}>{submitted ? 'Submitted' : 'Submit Inquiry'}</Button>
            </div>
          </section>
        )}
      </form>
    </MainLayout>
  )
}


