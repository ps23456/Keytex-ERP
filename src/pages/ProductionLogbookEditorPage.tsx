import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import ProductionLogbookForm, { ProductionLogFormData } from '../components/ProductionLogbookForm'
import { Button } from '../components/ui/button'
import { ArrowLeft } from 'lucide-react'
import {
  getProductionLogById,
  saveProductionLog,
  updateProductionLog,
} from '../lib/productionLogbookStorage'

export default function ProductionLogbookEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [initialData, setInitialData] = useState<ProductionLogFormData | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isEditing && id) {
      const record = getProductionLogById(id)
      if (record) {
        const { id: recordId, createdAt, updatedAt, ...rest } = record
        setInitialData(rest)
      } else {
        setError('Log entry not found.')
      }
    } else {
      setInitialData(undefined)
    }
  }, [isEditing, id])

  const handleSubmit = async (data: ProductionLogFormData) => {
    setIsSaving(true)
    try {
      if (isEditing && id) {
        updateProductionLog(id, data)
        navigate('/production-logbook', { state: { success: 'Production log updated successfully.' } })
      } else {
        saveProductionLog(data)
        navigate('/production-logbook', { state: { success: 'Production log created successfully.' } })
      }
    } catch (err) {
      console.error('Failed to save production log:', err)
      setError('Failed to save log entry. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const headerTitle = isEditing ? 'Edit Production Log' : 'Create Production Log'
  const helperText = isEditing
    ? 'Update the shift record and maintain accurate production history.'
    : 'Fill in the details below to capture a production shift.'

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
            onClick={() => navigate('/production-logbook')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Logbook</span>
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
          <ProductionLogbookForm initialData={initialData} onSubmit={handleSubmit} isLoading={isSaving} />
        ) : null}
      </div>
    </MainLayout>
  )
}

