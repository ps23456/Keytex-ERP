import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Plus, X, Upload, CheckCircle } from 'lucide-react'

const productSchema = z.object({
  itemName: z.string().min(1, 'Item name is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  material: z.string().min(1, 'Material is required'),
  designFileName: z.string().optional(),
  designFileData: z.string().optional(),
})

const publicInquirySchema = z.object({
  contactPerson: z.string().min(1, 'Contact person name is required'),
  companyName: z.string().min(1, 'Company name is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  emailAddress: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  products: z.array(productSchema).min(1, 'Add at least one product'),
})

export type PublicInquiryFormData = z.infer<typeof publicInquirySchema>

interface PublicInquiryFormProps {
  onSubmit: (data: PublicInquiryFormData) => Promise<void>
  isLoading?: boolean
}

export default function PublicInquiryForm({ onSubmit, isLoading = false }: PublicInquiryFormProps) {
  const [submitted, setSubmitted] = useState(false)

  const { register, handleSubmit, control, watch, setValue, formState: { errors, isValid } } = useForm<PublicInquiryFormData>({
    resolver: zodResolver(publicInquirySchema),
    mode: 'onChange',
    defaultValues: {
      contactPerson: '',
      companyName: '',
      phoneNumber: '',
      emailAddress: '',
      address: '',
      products: [{
        itemName: '',
        quantity: '',
        material: '',
        designFileName: '',
        designFileData: '',
      }],
    }
  })

  const { fields: productFields, append, remove } = useFieldArray({ control, name: 'products' })

  const handleFile = async (file: File, index: number) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setValue(`products.${index}.designFileName`, file.name)
      setValue(`products.${index}.designFileData`, result)
    }
    reader.readAsDataURL(file)
  }

  const handleFormSubmit = async (data: PublicInquiryFormData) => {
    const submitData = {
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    await onSubmit(submitData as any)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Inquiry Submitted Successfully!</h2>
        <p className="text-gray-600 mb-6">Thank you for your inquiry. We will get back to you soon.</p>
        <Button onClick={() => window.location.reload()}>Submit Another Inquiry</Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Contact Information */}
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Contact Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Contact Person Name <span className="text-destructive">*</span></Label>
            <Input placeholder="Enter contact person name" {...register('contactPerson')} />
            {errors.contactPerson && <p className="text-xs text-destructive">{errors.contactPerson.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Company Name <span className="text-destructive">*</span></Label>
            <Input placeholder="Enter company name" {...register('companyName')} />
            {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Phone Number <span className="text-destructive">*</span></Label>
            <Input placeholder="Enter phone number" {...register('phoneNumber')} />
            {errors.phoneNumber && <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Email Address</Label>
            <Input placeholder="Enter email address" type="email" {...register('emailAddress')} />
            {errors.emailAddress && <p className="text-xs text-destructive">{errors.emailAddress.message}</p>}
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Address</Label>
            <Textarea placeholder="Enter complete address" {...register('address')} />
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
            designFileName: '',
            designFileData: '',
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
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="submit" disabled={!isValid || isLoading} size="lg" className="px-8">
          {isLoading ? 'Submitting...' : 'Submit Inquiry'}
        </Button>
      </div>
    </form>
  )
}

