import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FieldSchema, MasterRecord } from '../lib/schemas'
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
import { X, Plus, Trash2 } from 'lucide-react'

interface MasterFormProps {
  masterKey: string
  schema: FieldSchema[]
  initialData?: MasterRecord
  onSubmit: (data: MasterRecord) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export default function MasterForm({
  masterKey,
  schema,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}: MasterFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Generate Zod schema from field schema
  const generateZodSchema = (fields: FieldSchema[]) => {
    const shape: Record<string, any> = {}
    
    fields.forEach(field => {
      if (field.ui === 'auto' || field.ui === 'computed') return // Skip auto-generated and computed fields
      
      let fieldSchema: any
      
      try {
        switch (field.type) {
          case 'string':
            fieldSchema = z.string().nullable().optional()
            if (field.ui === 'email') {
              fieldSchema = z.string().email('Invalid email address').nullable().optional()
            }
            break
          case 'number':
            fieldSchema = z.union([z.number(), z.string()]).transform(val => {
              if (typeof val === 'string') {
                const num = Number(val)
                return isNaN(num) ? (field.required ? 0 : undefined) : num
              }
              return val
            }).nullable().optional()
            break
          case 'date':
          case 'datetime':
            fieldSchema = z.string().nullable().optional()
            break
          case 'boolean':
            fieldSchema = z.boolean().or(z.string().transform(val => val === 'true' || val === '1')).nullable().optional()
            break
          default:
            fieldSchema = z.string().nullable().optional()
        }
        
        // All fields are now optional by default
        if (!field.required) {
          fieldSchema = fieldSchema.optional()
        }
        
        shape[field.key] = fieldSchema
      } catch (error) {
        console.error(`Error creating schema for field ${field.key}:`, error)
        // Fallback to optional string
        shape[field.key] = z.string().optional()
      }
    })
    
    console.log('🔍 MasterForm: Generated Zod schema:', { masterKey, shape })
    console.log('🔍 MasterForm: Pin code field schema:', shape.pin_code)
    return z.object(shape)
  }

  const zodSchema = generateZodSchema(schema)
  type FormData = z.infer<typeof zodSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<FormData>({
    resolver: zodResolver(zodSchema),
    defaultValues: initialData || {}
  })

  // Log form errors for debugging
  console.log('🔍 MasterForm: Form errors:', { masterKey, errors })

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset(initialData)
    }
  }, [initialData, reset])

  const handleFormSubmit = async (data: FormData) => {
    try {
      console.log('📝 MasterForm: Submitting form data:', { masterKey, data, initialData })
      console.log('📝 MasterForm: Pin code value:', { pin_code: data.pin_code, type: typeof data.pin_code })
      
      // Clean the data before submission
      const cleanedData = { ...data }
      
      // Remove empty strings and convert them to null/undefined
      Object.keys(cleanedData).forEach(key => {
        const value = cleanedData[key]
        if (value === '' || value === null || value === undefined) {
          delete cleanedData[key]
        }
      })
      
      // Ensure pin_code is a string
      if (cleanedData.pin_code !== undefined) {
        cleanedData.pin_code = String(cleanedData.pin_code)
      }
      
      console.log('🧹 MasterForm: Cleaned data:', cleanedData)
      
      // Check for validation errors
      if (Object.keys(errors).length > 0) {
        console.error('❌ MasterForm: Validation errors found:', errors)
        throw new Error(`Form validation failed: ${Object.keys(errors).join(', ')}`)
      }
      
      await onSubmit(cleanedData)
      console.log('✅ MasterForm: Form submitted successfully')
    } catch (error) {
      console.error('❌ MasterForm: Form submission error:', error)
      // Re-throw the error so the parent component can handle it
      throw error
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const renderField = (field: FieldSchema) => {
    if (field.ui === 'auto') return null

    const error = errors[field.key as keyof FormData]

    try {
      switch (field.ui) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
            </Label>
            <Input
              id={field.key}
              type={field.ui === 'email' ? 'email' : field.ui === 'url' ? 'url' : 'text'}
              {...register(field.key as keyof FormData)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              className="h-9"
            />
            {error && (
              <p className="text-xs text-destructive">{String(error?.message || '')}</p>
            )}
          </div>
        )

      case 'password':
        return (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
            </Label>
            <Input
              id={field.key}
              type="password"
              {...register(field.key as keyof FormData)}
              placeholder="Enter password"
              className="h-9"
            />
            {error && (
              <p className="text-xs text-destructive">{String(error?.message || '')}</p>
            )}
          </div>
        )

      case 'number':
        return (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
            </Label>
            <Input
              id={field.key}
              type="number"
              {...register(field.key as keyof FormData, { valueAsNumber: true })}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              className="h-9"
            />
            {error && (
              <p className="text-xs text-destructive">{String(error?.message || '')}</p>
            )}
          </div>
        )

      case 'textarea':
        return (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
            </Label>
            <Textarea
              id={field.key}
              {...register(field.key as keyof FormData)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              rows={2}
              className="resize-none"
            />
            {error && (
              <p className="text-xs text-destructive">{String(error?.message || '')}</p>
            )}
          </div>
        )

      case 'operations_table':
        return (
          <div key={field.key} className="col-span-full md:col-span-2 lg:col-span-3">
            <OperationsTableField
              field={field}
              value={watch(field.key as keyof FormData) as string}
              setValue={setValue}
              error={error}
            />
          </div>
        )

            case 'select':
              if (field.relation) {
                return <RelationSelect key={field.key} field={field} setValue={setValue} error={error} initialData={initialData} />
              }
        return (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
            </Label>
            <Select onValueChange={(value) => setValue(field.key as keyof FormData, value)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {!field.options || field.options.length === 0 ? (
                  <SelectItem value="no-options" disabled>No options available</SelectItem>
                ) : (
                  field.options.filter(option => option && option.trim() !== '').map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {error && (
              <p className="text-xs text-destructive">{String(error?.message || '')}</p>
            )}
          </div>
        )

      case 'date':
        return (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
            </Label>
            <Input
              id={field.key}
              type="date"
              value={watch(field.key as keyof FormData) ? 
                new Date(watch(field.key as keyof FormData) as string).toISOString().split('T')[0] : 
                ''
              }
              onChange={(e) => setValue(field.key as keyof FormData, e.target.value)}
              className="h-9"
            />
            {error && (
              <p className="text-xs text-destructive">{String(error?.message || '')}</p>
            )}
          </div>
        )

      case 'time':
        return (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
            </Label>
            <Input
              id={field.key}
              type="time"
              {...register(field.key as keyof FormData)}
              className="h-9"
            />
            {error && (
              <p className="text-xs text-destructive">{String(error?.message || '')}</p>
            )}
          </div>
        )

      case 'checkbox':
        return (
          <div key={field.key} className="flex items-center space-x-2">
            <Checkbox
              id={field.key}
              checked={watch(field.key as keyof FormData) || false}
              onCheckedChange={(checked) => setValue(field.key as keyof FormData, checked)}
            />
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
            </Label>
            {error && (
              <p className="text-xs text-destructive">{String(error?.message || '')}</p>
            )}
          </div>
        )

      case 'multiselect':
        return (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
            </Label>
            <Select onValueChange={(value) => setValue(field.key as keyof FormData, value)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {!field.options || field.options.length === 0 ? (
                  <SelectItem value="no-options" disabled>No options available</SelectItem>
                ) : (
                  field.options.filter(option => option && option.trim() !== '').map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {error && (
              <p className="text-xs text-destructive">{String(error?.message || '')}</p>
            )}
          </div>
        )

      case 'datetime':
        return (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
            </Label>
            <Input
              id={field.key}
              type="datetime-local"
              value={watch(field.key as keyof FormData) ? 
                new Date(watch(field.key as keyof FormData) as string).toISOString().slice(0, 16) : 
                ''
              }
              onChange={(e) => setValue(field.key as keyof FormData, e.target.value)}
              className="h-9"
            />
            {error && (
              <p className="text-xs text-destructive">{String(error?.message || '')}</p>
            )}
          </div>
        )

      case 'computed':
        return (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={field.key} className="text-sm font-medium text-muted-foreground">
              {field.label} (Auto-calculated)
            </Label>
            <Input
              id={field.key}
              type="text"
              disabled
              className="h-9 bg-muted"
              placeholder="Auto-calculated field"
            />
          </div>
        )

      case 'image':
        return (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
            </Label>
            <Input
              id={field.key}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="h-9"
            />
            {imagePreview && (
              <div className="relative w-24 h-24 border rounded-lg overflow-hidden">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-5 w-5"
                  onClick={() => setImagePreview(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            {error && (
              <p className="text-xs text-destructive">{String(error?.message || '')}</p>
            )}
          </div>
        )

      default:
        return (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label}
            </Label>
            <Input
              id={field.key}
              {...register(field.key as keyof FormData)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              className="h-9"
            />
            {error && (
              <p className="text-xs text-destructive">{String(error?.message || '')}</p>
            )}
          </div>
        )
    }
    } catch (error) {
      console.error(`Error rendering field ${field.key} with ui type ${field.ui}:`, error)
      return (
        <div key={field.key} className="space-y-1">
          <Label htmlFor={field.key} className="text-sm font-medium text-destructive">
            {field.label} (Error)
          </Label>
          <Input
            id={field.key}
            type="text"
            disabled
            className="h-9 bg-destructive/10"
            placeholder="Field rendering error"
          />
          <p className="text-xs text-destructive">Unable to render this field</p>
        </div>
      )
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-muted rounded text-xs">
          <strong>Debug:</strong> Master: {masterKey}, Fields: {schema.length}, 
          Initial Data: {initialData ? 'Yes' : 'No'}
        </div>
      )}
      
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {schema.map(renderField)}
        </div>
        
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : initialData ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  )
}

// Component for operations table
function OperationsTableField({
  field,
  value,
  setValue,
  error
}: {
  field: FieldSchema
  value: string | undefined
  setValue: (key: string, value: any) => void
  error: any
}) {
  // Parse operations from JSON string
  const parseOperations = (jsonStr: string | undefined): Array<{ key: string; label: string; type: string }> => {
    if (!jsonStr || jsonStr.trim() === '') return []
    try {
      const parsed = JSON.parse(jsonStr)
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      return []
    }
  }

  // Convert operations to JSON string
  const stringifyOperations = (ops: Array<{ key: string; label: string; type: string }>): string => {
    return JSON.stringify(ops)
  }

  const [operations, setOperations] = useState<Array<{ key: string; label: string; type: string }>>(() => {
    return parseOperations(value)
  })

  useEffect(() => {
    const parsed = parseOperations(value)
    setOperations(parsed)
  }, [value])

  const updateOperations = (newOperations: Array<{ key: string; label: string; type: string }>) => {
    setOperations(newOperations)
    setValue(field.key, stringifyOperations(newOperations))
  }

  const addOperation = () => {
    const newOp = {
      key: `operation_${Date.now()}`,
      label: '',
      type: 'text'
    }
    updateOperations([...operations, newOp])
  }

  const removeOperation = (index: number) => {
    updateOperations(operations.filter((_, i) => i !== index))
  }

  const updateOperation = (index: number, fieldName: 'key' | 'label' | 'type', newValue: string) => {
    const updated = operations.map((op, i) => {
      if (i === index) {
        return { ...op, [fieldName]: newValue }
      }
      return op
    })
    updateOperations(updated)
  }

  // Generate key from label if key is empty
  const generateKeyFromLabel = (label: string): string => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
  }

  const handleLabelChange = (index: number, label: string) => {
    const currentOp = operations[index]
    const newKey = currentOp.key.startsWith('operation_') || currentOp.key === '' 
      ? generateKeyFromLabel(label) 
      : currentOp.key
    updateOperation(index, 'label', label)
    if (newKey !== currentOp.key) {
      updateOperation(index, 'key', newKey)
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Label className="text-sm font-semibold tracking-wide text-slate-800">
          {field.label}
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addOperation}
          className="flex items-center space-x-1 rounded-full border border-slate-300 bg-slate-900 text-white hover:bg-slate-800 px-4"
        >
          <Plus className="h-4 w-4" />
          <span>Add Operation</span>
        </Button>
      </div>
      <div className="rounded-2xl border border-slate-100 bg-slate-50/60">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left w-20">Sr. No.</th>
                <th className="px-4 py-3 text-left min-w-[220px]">Operation Name</th>
                <th className="px-4 py-3 text-left w-32">Type</th>
                <th className="px-4 py-3 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody>
              {operations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500 text-sm bg-white">
                    No operations added yet. Click “Add Operation” to start building your template.
                  </td>
                </tr>
              ) : (
                operations.map((op, index) => (
                  <tr key={index} className="border-t border-slate-200 bg-white">
                    <td className="px-4 py-3 text-slate-600 font-semibold">{index + 1}</td>
                    <td className="px-4 py-3">
                      <Input
                        value={op.label}
                        onChange={(e) => handleLabelChange(index, e.target.value)}
                        placeholder="e.g., RM CUTTING"
                        className="h-9 rounded-lg bg-slate-50 focus:bg-white"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={op.type}
                        onValueChange={(value) => updateOperation(index, 'type', value)}
                      >
                        <SelectTrigger className="h-9 rounded-lg bg-slate-50 focus:bg-white">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="textarea">Textarea</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOperation(index)}
                        className="h-8 w-8 text-slate-400 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {error && (
        <p className="text-xs text-destructive">{String(error?.message || '')}</p>
      )}
      <p className="text-xs text-slate-500">
        Operation keys are auto-generated from the name and stored internally as JSON for use across the app.
      </p>
    </div>
  )
}

// Component for relation selects
function RelationSelect({ 
  field, 
  setValue, 
  error,
  initialData
}: { 
  field: FieldSchema
  setValue: (key: string, value: any) => void
  error: any
  initialData?: MasterRecord
}) {
  const { options, isLoading } = useMasterOptions(field.relation!)

  // Additional safety check
  const safeOptions = Array.isArray(options) ? options : []

  // Get the correct ID field for the relation
  const getIdField = (relationKey: string) => {
    const idFields: Record<string, string> = {
      company: 'company_id',
      branch: 'branch_id', 
      department: 'department_id',
      user: 'user_id',
      role: 'role_id',
      employee: 'employee_id',
      machine: 'machine_id',
      tool: 'tool_id',
      shift: 'shift_id',
      currency: 'currency_code',
      tax: 'tax_id',
      customer_type: 'customer_type_id'
    }
    return idFields[relationKey] || `${relationKey}_id`
  }

  // Get the correct name field for the relation
  const getNameField = (relationKey: string) => {
    const nameFields: Record<string, string> = {
      company: 'company_name',
      branch: 'branch_name',
      department: 'department_name', 
      user: 'full_name',
      role: 'role_name',
      employee: 'employee_name',
      machine: 'machine_name',
      tool: 'tool_name',
      shift: 'shift_name',
      currency: 'currency_name',
      tax: 'tax_name',
      customer_type: 'customer_type'
    }
    return nameFields[relationKey] || `${relationKey}_name`
  }

  const idField = getIdField(field.relation!)
  const nameField = getNameField(field.relation!)

  console.log(`🔗 RelationSelect: ${field.relation} -> ID: ${idField}, Name: ${nameField}`, { options: safeOptions })

  return (
    <div className="space-y-1">
      <Label htmlFor={field.key} className="text-sm font-medium">
        {field.label}
      </Label>
      <Select onValueChange={(value) => setValue(field.key, value)} defaultValue={initialData?.[field.key]}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>Loading...</SelectItem>
          ) : safeOptions.length === 0 ? (
            <SelectItem value="no-options" disabled>No options available</SelectItem>
          ) : (
            safeOptions
              .filter(option => {
                const id = option[idField]
                return id && id.toString().trim() !== ''
              })
              .map((option) => {
                const id = option[idField]
                const name = option[nameField] || option.name || option[`${field.relation}_code`] || id
                return (
                  <SelectItem key={id} value={id.toString()}>
                    {name}
                  </SelectItem>
                )
              })
          )}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-xs text-destructive">{error.message}</p>
      )}
    </div>
  )
}
