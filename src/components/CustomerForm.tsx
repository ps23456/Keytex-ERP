import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMasterOptions } from '../hooks/useMasters'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Textarea } from './ui/textarea'
import { Checkbox } from './ui/checkbox'
import { X, Plus } from 'lucide-react'

// Indian states list
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
]

const SALUTATIONS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.']

// Industries (can be expanded later)
const INDUSTRIES = [
  'Manufacturing', 'Automotive', 'Electronics', 'Textiles', 'Pharmaceuticals',
  'FMCG', 'Metals & Mining', 'Construction', 'IT & Software', 'Telecommunications',
  'Energy & Power', 'Healthcare', 'Agriculture', 'Real Estate', 'Retail',
  'Banking & Finance', 'Education', 'Hospitality', 'Transportation', 'Other'
]

// Territories (can be expanded or converted to master later)
const TERRITORIES = [
  'North India', 'South India', 'East India', 'West India', 'Central India',
  'International', 'Export', 'Domestic'
]

// Market Segments (can be expanded or converted to master later)
const MARKET_SEGMENTS = [
  'OEM', 'Aftermarket', 'Export', 'Domestic', 'Institutional', 'Retail',
  'Government', 'Private', 'B2B', 'B2C'
]

// Zod schema
const branchSchema = z.object({
  branch_name: z.string().min(1, 'Branch name is required'),
  branch_code: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  primary_branch: z.boolean().default(false)
})

const contactSchema = z.object({
  salutation: z.string().optional(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().optional(),
  designation: z.string().optional(),
  email: z.string().email('Invalid email').min(1, 'Email is required'),
  mobile_number: z.string().min(1, 'Mobile number is required'),
  whatsapp_number: z.string().optional(),
  primary_contact: z.boolean().default(false)
})

const customerSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  company_name: z.string().optional(),
  customer_type: z.string().optional(),
  industry: z.string().optional(),
  gst_number: z.string().optional(),
  pan_number: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  territory: z.string().optional(),
  market_segment: z.string().optional(),
  status: z.string().default('Active'),
  number_of_employees: z.number().optional().or(z.literal('')),
  annual_revenue: z.number().optional().or(z.literal('')),
  branches: z.array(branchSchema).default([]),
  contacts: z.array(contactSchema).default([])
})

type CustomerFormData = z.infer<typeof customerSchema>

interface CustomerFormProps {
  initialData?: CustomerFormData
  onSubmit: (data: CustomerFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export default function CustomerForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}: CustomerFormProps) {
  const { options: customerTypes, isLoading: isLoadingCustomerTypes } = useMasterOptions('customer_type')
  const { options: companies, isLoading: isLoadingCompanies } = useMasterOptions('company')
  const { options: designations, isLoading: isLoadingDesignations } = useMasterOptions('designation')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
    reset
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData || {
      customer_name: '',
      company_name: '',
      customer_type: '',
      industry: '',
      gst_number: '',
      pan_number: '',
      website: '',
      email: '',
      phone: '',
      territory: '',
      market_segment: '',
      status: 'Active',
      number_of_employees: 0,
      annual_revenue: 0,
      branches: [],
      contacts: []
    }
  })

  const {
    fields: branchFields,
    append: appendBranch,
    remove: removeBranch
  } = useFieldArray({
    control,
    name: 'branches'
  })

  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact
  } = useFieldArray({
    control,
    name: 'contacts'
  })

  // Initialize branches and contacts when editing
  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        branches: initialData.branches && initialData.branches.length > 0 
          ? initialData.branches 
          : [],
        contacts: initialData.contacts && initialData.contacts.length > 0 
          ? initialData.contacts 
          : []
      })
    }
  }, [initialData, reset])

  const handleFormSubmit = async (data: CustomerFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
      throw error
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Company Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Company Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="customer_name" className="text-sm font-medium">
              Customer Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customer_name"
              {...register('customer_name')}
              placeholder="Enter customer name"
              className="h-9"
            />
            {errors.customer_name && (
              <p className="text-xs text-destructive">{errors.customer_name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="company_name" className="text-sm font-medium">
              Company Name
            </Label>
            <Select
              onValueChange={(value) => setValue('company_name', value)}
              defaultValue={watch('company_name')}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select Company" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingCompanies ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : companies.length === 0 ? (
                  <SelectItem value="no-options" disabled>No companies available</SelectItem>
                ) : (
                  companies.map((company) => {
                    const id = company.company_id || company.id
                    const name = company.company_name || company.name || id
                    return (
                      <SelectItem key={id} value={String(id)}>
                        {name}
                      </SelectItem>
                    )
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="customer_type" className="text-sm font-medium">
              Customer Type
            </Label>
            <Select
              onValueChange={(value) => setValue('customer_type', value)}
              defaultValue={watch('customer_type')}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select Customer Type" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingCustomerTypes ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : customerTypes.length === 0 ? (
                  <SelectItem value="no-options" disabled>No options available</SelectItem>
                ) : (
                  customerTypes.map((type) => {
                    const id = type.customer_type_id || type.id
                    const name = type.customer_type || type.name || id
                    return (
                      <SelectItem key={id} value={String(id)}>
                        {name}
                      </SelectItem>
                    )
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="industry" className="text-sm font-medium">
              Industry
            </Label>
            <Select
              onValueChange={(value) => setValue('industry', value)}
              defaultValue={watch('industry')}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select Industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="gst_number" className="text-sm font-medium">
              GST Number
            </Label>
            <Input
              id="gst_number"
              {...register('gst_number')}
              placeholder="Enter GST number"
              className="h-9"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="pan_number" className="text-sm font-medium">
              PAN Number
            </Label>
            <Input
              id="pan_number"
              {...register('pan_number')}
              placeholder="Enter PAN number"
              className="h-9"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="website" className="text-sm font-medium">
              Website
            </Label>
            <Input
              id="website"
              type="url"
              {...register('website')}
              placeholder="Enter website URL"
              className="h-9"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="Enter email"
              className="h-9"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone
            </Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="Enter phone number"
              className="h-9"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="territory" className="text-sm font-medium">
              Territory
            </Label>
            <Select
              onValueChange={(value) => setValue('territory', value)}
              defaultValue={watch('territory')}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select Territory" />
              </SelectTrigger>
              <SelectContent>
                {TERRITORIES.map((territory) => (
                  <SelectItem key={territory} value={territory}>
                    {territory}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="market_segment" className="text-sm font-medium">
              Market Segment
            </Label>
            <Select
              onValueChange={(value) => setValue('market_segment', value)}
              defaultValue={watch('market_segment')}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select Segment" />
              </SelectTrigger>
              <SelectContent>
                {MARKET_SEGMENTS.map((segment) => (
                  <SelectItem key={segment} value={segment}>
                    {segment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="status" className="text-sm font-medium">
              Status
            </Label>
            <Select
              onValueChange={(value) => setValue('status', value)}
              defaultValue={watch('status') || 'Active'}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Organization Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Organization Details</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="number_of_employees" className="text-sm font-medium">
              Number of Employees
            </Label>
            <Input
              id="number_of_employees"
              type="number"
              {...register('number_of_employees', { valueAsNumber: true })}
              placeholder="0"
              className="h-9"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="annual_revenue" className="text-sm font-medium">
              Annual Revenue (₹)
            </Label>
            <Input
              id="annual_revenue"
              type="number"
              {...register('annual_revenue', { valueAsNumber: true })}
              placeholder="0"
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Branches */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Branches</h3>
          <Button
            type="button"
            variant="link"
            onClick={() => appendBranch({
              branch_name: '',
              branch_code: '',
              phone: '',
              email: '',
              address_line1: '',
              address_line2: '',
              city: '',
              state: '',
              pincode: '',
              primary_branch: false
            })}
            className="text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Branch
          </Button>
        </div>

        {branchFields.map((field, index) => (
          <div key={field.id} className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Branch {index + 1}</h4>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeBranch(index)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-sm font-medium">
                  Branch Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...register(`branches.${index}.branch_name` as const)}
                  placeholder="Enter branch name"
                  className="h-9"
                />
                {errors.branches?.[index]?.branch_name && (
                  <p className="text-xs text-destructive">
                    {errors.branches[index]?.branch_name?.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">Branch Code</Label>
                <Input
                  {...register(`branches.${index}.branch_code` as const)}
                  placeholder="Enter branch code"
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">Phone</Label>
                <Input
                  {...register(`branches.${index}.phone` as const)}
                  placeholder="Enter phone number"
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">Email</Label>
                <Input
                  type="email"
                  {...register(`branches.${index}.email` as const)}
                  placeholder="Enter email"
                  className="h-9"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label className="text-sm font-medium">Address Line 1</Label>
                <Input
                  {...register(`branches.${index}.address_line1` as const)}
                  placeholder="Enter address"
                  className="h-9"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label className="text-sm font-medium">Address Line 2</Label>
                <Input
                  {...register(`branches.${index}.address_line2` as const)}
                  placeholder="Enter address"
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">City</Label>
                <Input
                  {...register(`branches.${index}.city` as const)}
                  placeholder="Enter city"
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">State</Label>
                <Select
                  onValueChange={(value) => setValue(`branches.${index}.state`, value)}
                  defaultValue={watch(`branches.${index}.state`)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">Pincode</Label>
                <Input
                  {...register(`branches.${index}.pincode` as const)}
                  placeholder="Enter pincode"
                  className="h-9"
                />
              </div>

              <div className="space-y-1 flex items-center space-x-2">
                <Checkbox
                  id={`branch-primary-${index}`}
                  checked={watch(`branches.${index}.primary_branch`) || false}
                  onCheckedChange={(checked) => 
                    setValue(`branches.${index}.primary_branch`, checked as boolean)
                  }
                />
                <Label htmlFor={`branch-primary-${index}`} className="text-sm font-medium">
                  Primary Branch
                </Label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Contacts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Contacts</h3>
          <Button
            type="button"
            variant="link"
            onClick={() => appendContact({
              salutation: 'Mr.',
              first_name: '',
              last_name: '',
              designation: '',
              email: '',
              mobile_number: '',
              whatsapp_number: '',
              primary_contact: false
            })}
            className="text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Contact
          </Button>
        </div>

        {contactFields.map((field, index) => (
          <div key={field.id} className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Contact {index + 1}</h4>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeContact(index)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Salutation</Label>
                <Select
                  onValueChange={(value) => setValue(`contacts.${index}.salutation`, value)}
                  defaultValue={watch(`contacts.${index}.salutation`) || 'Mr.'}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SALUTATIONS.map((sal) => (
                      <SelectItem key={sal} value={sal}>
                        {sal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...register(`contacts.${index}.first_name` as const)}
                  placeholder="Enter first name"
                  className="h-9"
                />
                {errors.contacts?.[index]?.first_name && (
                  <p className="text-xs text-destructive">
                    {errors.contacts[index]?.first_name?.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">Last Name</Label>
                <Input
                  {...register(`contacts.${index}.last_name` as const)}
                  placeholder="Enter last name"
                  className="h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">Designation</Label>
                <Select
                  onValueChange={(value) => setValue(`contacts.${index}.designation`, value)}
                  defaultValue={watch(`contacts.${index}.designation`)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select Designation" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingDesignations ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : designations.length === 0 ? (
                      <SelectItem value="no-options" disabled>No designations available</SelectItem>
                    ) : (
                      designations.map((designation) => {
                        const id = designation.designation_id || designation.id
                        const name = designation.designation_name || designation.name || id
                        return (
                          <SelectItem key={id} value={String(id)}>
                            {name}
                          </SelectItem>
                        )
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  {...register(`contacts.${index}.email` as const)}
                  placeholder="Enter email"
                  className="h-9"
                />
                {errors.contacts?.[index]?.email && (
                  <p className="text-xs text-destructive">
                    {errors.contacts[index]?.email?.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">
                  Mobile Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...register(`contacts.${index}.mobile_number` as const)}
                  placeholder="Enter mobile number"
                  className="h-9"
                />
                {errors.contacts?.[index]?.mobile_number && (
                  <p className="text-xs text-destructive">
                    {errors.contacts[index]?.mobile_number?.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">WhatsApp Number</Label>
                <Input
                  {...register(`contacts.${index}.whatsapp_number` as const)}
                  placeholder="Enter WhatsApp number"
                  className="h-9"
                />
              </div>

              <div className="space-y-1 flex items-center space-x-2">
                <Checkbox
                  id={`contact-primary-${index}`}
                  checked={watch(`contacts.${index}.primary_contact`) || false}
                  onCheckedChange={(checked) => 
                    setValue(`contacts.${index}.primary_contact`, checked as boolean)
                  }
                />
                <Label htmlFor={`contact-primary-${index}`} className="text-sm font-medium">
                  Primary Contact
                </Label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update Customer' : 'Save Customer'}
        </Button>
      </div>
    </form>
  )
}
