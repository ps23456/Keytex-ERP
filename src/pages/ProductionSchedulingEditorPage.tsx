import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import ProductionSchedulingForm, {
  ProductionSchedulingFormData,
} from '../components/ProductionSchedulingForm'
import { Button } from '../components/ui/button'
import { ArrowLeft } from 'lucide-react'
import {
  getProductionScheduleById,
  saveProductionSchedule,
  updateProductionSchedule,
} from '../lib/productionSchedulingStorage'

export default function ProductionSchedulingEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [initialData, setInitialData] = useState<ProductionSchedulingFormData | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isEditing && id) {
      const record = getProductionScheduleById(id)
      if (record) {
        const {
          id: _recordId,
          createdAt: _createdAt,
          updatedAt: _updatedAt,
          balanceQty: _balanceQty,
          totalSettingTimeHour: _totalSettingTimeHour,
          totalCycleTimeMinutes: _totalCycleTimeMinutes,
          timePerPieceHour: _timePerPieceHour,
          targetTimeHour: _targetTimeHour,
          ...rest
        } = record
        setInitialData(rest)
      } else {
        setError('Scheduling sheet not found.')
      }
    } else {
      setInitialData(undefined)
    }
  }, [isEditing, id])

  const handleSubmit = async (data: ProductionSchedulingFormData) => {
    setIsSaving(true)
    try {
      if (isEditing && id) {
        updateProductionSchedule(id, data)
        navigate('/production-scheduling', { state: { success: 'Scheduling sheet updated successfully.' } })
      } else {
        saveProductionSchedule(data)
        navigate('/production-scheduling', { state: { success: 'Scheduling sheet created successfully.' } })
      }
    } catch (err) {
      console.error('Failed to save production scheduling sheet:', err)
      setError('Failed to save scheduling sheet. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const headerTitle = isEditing ? 'Edit Production Scheduling Sheet' : 'Add Production Scheduling Sheet'
  const helperText = isEditing
    ? 'Update takt calculations, shift targets, and recent production feedback.'
    : 'Capture a 3-day production plan with takt, load/unload, and target computations.'

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
            onClick={() => navigate('/production-scheduling')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Scheduling</span>
          </Button>
          <div className="text-right">
            <p className="text-lg font-semibold text-slate-900">{headerTitle}</p>
            <p className="text-sm text-slate-500">{helperText}</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {(!isEditing || initialData) && !error ? (
          <ProductionSchedulingForm initialData={initialData} onSubmit={handleSubmit} isLoading={isSaving} />
        ) : null}
      </div>
    </MainLayout>
  )
}


