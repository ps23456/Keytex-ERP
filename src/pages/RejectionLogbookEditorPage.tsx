import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import RejectionLogbookForm, {
  RejectionLogbookFormData,
} from '../components/RejectionLogbookForm'
import { Button } from '../components/ui/button'
import { ArrowLeft } from 'lucide-react'
import {
  getRejectionLogbookById,
  saveRejectionLogbook,
  updateRejectionLogbook,
} from '../lib/rejectionLogbookStorage'

export default function RejectionLogbookEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [initialData, setInitialData] = useState<RejectionLogbookFormData | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isEditing && id) {
      const record = getRejectionLogbookById(id)
      if (record) {
        const {
          id: _recordId,
          createdAt: _createdAt,
          updatedAt: _updatedAt,
          ...rest
        } = record
        setInitialData(rest)
      } else {
        setError('Rejection logbook entry not found.')
      }
    } else {
      setInitialData(undefined)
    }
  }, [isEditing, id])

  const handleSubmit = async (data: RejectionLogbookFormData) => {
    setIsSaving(true)
    try {
      if (isEditing && id) {
        updateRejectionLogbook(id, data)
        navigate('/rejection-logbook', { state: { success: 'Rejection logbook entry updated successfully.' } })
      } else {
        saveRejectionLogbook(data)
        navigate('/rejection-logbook', { state: { success: 'Rejection logbook entry created successfully.' } })
      }
    } catch (err) {
      console.error('Failed to save rejection logbook entry:', err)
      setError('Failed to save logbook entry. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const headerTitle = isEditing ? 'Edit Rejection & Rework Logbook' : 'Add Rejection & Rework Logbook Entry'
  const helperText = isEditing
    ? 'Update rejection quantities, rework activities, and quality tracking information.'
    : 'Record rejection quantities, rework activities, and quality issues for production tracking.'

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
            onClick={() => navigate('/rejection-logbook')}
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
          <RejectionLogbookForm initialData={initialData} onSubmit={handleSubmit} isLoading={isSaving} />
        ) : null}
      </div>
    </MainLayout>
  )
}








