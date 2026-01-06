import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Package, Calendar } from 'lucide-react'
import { InventoryType } from '../lib/inventoryStorage'

const inventorySchema = z.object({
  item: z.string().min(1, 'Item is required'),
  materialGrade: z.string().min(1, 'Material Grade is required'),
  size: z.string().optional(),
  unit: z.string().optional(),
  availableStock: z.string().min(1, 'Available stock is required').refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0
  }, 'Available stock must be a valid number'),
  minimumStock: z.string().optional().refine((val) => {
    if (!val) return true
    const num = parseFloat(val)
    return !isNaN(num) && num >= 0
  }, 'Minimum stock must be a valid number'),
  lastPurchase: z.string().optional(),
})

export type InventoryFormData = z.infer<typeof inventorySchema>

interface InventoryFormProps {
  type: InventoryType
  initialData?: Partial<InventoryFormData & { id?: string }>
  onSubmit: (data: InventoryFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

// Common material grades for raw materials
const RAW_MATERIAL_GRADES = [
  'Mild Steel',
  'C45',
  'SS304',
  'SS316',
  'ALUMINUM',
  'BRASS',
  'COPPER',
  'EN8',
  'EN24',
  'WPS',
  'D2',
  'M2',
]

// Common material grades for tools
const TOOL_GRADES = [
  'CARBIDE',
  'HSS',
  'TNMG',
  'APMT',
]

export default function InventoryForm({ 
  type, 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: InventoryFormProps) {
  const defaultValues: InventoryFormData = useMemo(() => ({
    item: initialData?.item || '',
    materialGrade: initialData?.materialGrade || '',
    size: initialData?.size || '',
    unit: initialData?.unit || '',
    availableStock: initialData?.availableStock?.toString() || '0',
    minimumStock: initialData?.minimumStock?.toString() || '0',
    lastPurchase: initialData?.lastPurchase || '',
  }), [initialData])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    mode: 'onChange',
    defaultValues,
  })

  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  const handleFormSubmit = async (data: InventoryFormData) => {
    await onSubmit(data)
  }

  const materialGrades = type === 'raw_material' ? RAW_MATERIAL_GRADES : TOOL_GRADES
  const title = type === 'raw_material' ? 'Raw Material Inventory' : 'Tool Inventory'

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="rounded-2xl border border-slate-200 overflow-hidden">
        <div className={`bg-gradient-to-r ${type === 'raw_material' ? 'from-blue-700 to-blue-500' : 'from-purple-700 to-purple-500'} text-white px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4`}>
          <div className="flex items-start space-x-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Package className="h-8 w-8" />
            </div>
            <div>
              <p className="uppercase tracking-[0.3em] text-xs font-semibold text-white/80">{title}</p>
              <h2 className="text-2xl font-bold mt-1">
                {initialData?.id ? 'Edit Inventory Item' : 'Add New Inventory Item'}
              </h2>
              <div className="flex flex-wrap gap-6 text-sm text-white/80 mt-3">
                {watch('lastPurchase') && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Last Purchase: {watch('lastPurchase') || '--'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6 bg-white">
          {/* Item Name */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Item</Label>
            <Input placeholder="Enter item name" {...register('item')} />
            {errors.item && <p className="text-xs text-destructive">{errors.item.message}</p>}
          </div>

          {/* Material Grade */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Material Grade</Label>
            <Select
              value={watch('materialGrade')}
              onValueChange={(value) => setValue('materialGrade', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select material grade" />
              </SelectTrigger>
              <SelectContent>
                {materialGrades.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.materialGrade && <p className="text-xs text-destructive">{errors.materialGrade.message}</p>}
          </div>

          {/* Size and Unit */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Size</Label>
              <Input placeholder="e.g., Dia 50 x 550, 300x200x52mm" {...register('size')} />
              {errors.size && <p className="text-xs text-destructive">{errors.size.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold uppercase text-slate-500">Unit</Label>
              <Select
                value={watch('unit')}
                onValueChange={(value) => setValue('unit', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mm">mm</SelectItem>
                  <SelectItem value="NO">NO</SelectItem>
                  <SelectItem value="no">no</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="m">m</SelectItem>
                  <SelectItem value="cm">cm</SelectItem>
                  <SelectItem value="piece">piece</SelectItem>
                </SelectContent>
              </Select>
              {errors.unit && <p className="text-xs text-destructive">{errors.unit.message}</p>}
            </div>
          </div>

          {/* Stock Information */}
          <div className={`rounded-xl border ${type === 'raw_material' ? 'border-blue-200 bg-blue-50' : 'border-purple-200 bg-purple-50'}`}>
            <div className={`px-5 py-3 border-b ${type === 'raw_material' ? 'border-blue-200' : 'border-purple-200'} flex items-center space-x-2 ${type === 'raw_material' ? 'text-blue-700' : 'text-purple-700'} font-semibold`}>
              <Package className="h-4 w-4" />
              <span>Stock Information</span>
            </div>
            <div className="px-5 py-5 grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className={`text-xs font-semibold uppercase ${type === 'raw_material' ? 'text-blue-700' : 'text-purple-700'}`}>Available Stock</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  {...register('availableStock')}
                />
                {errors.availableStock && <p className="text-xs text-destructive">{errors.availableStock.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className={`text-xs font-semibold uppercase ${type === 'raw_material' ? 'text-blue-700' : 'text-purple-700'}`}>Minimum Stock</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  {...register('minimumStock')}
                />
                {errors.minimumStock && <p className="text-xs text-destructive">{errors.minimumStock.message}</p>}
              </div>
            </div>
          </div>

          {/* Last Purchase Date */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase text-slate-500">Last Purchase Date</Label>
            <Input type="date" {...register('lastPurchase')} />
            {errors.lastPurchase && <p className="text-xs text-destructive">{errors.lastPurchase.message}</p>}
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
              className={type === 'raw_material' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}
            >
              {isLoading ? 'Saving...' : initialData?.id ? 'Update Inventory' : 'Add to Inventory'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

