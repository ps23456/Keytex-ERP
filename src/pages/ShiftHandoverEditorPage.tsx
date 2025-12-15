import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import ShiftHandoverForm from '../components/ShiftHandoverForm'
import { Button } from '../components/ui/button'
import { ArrowLeft } from 'lucide-react'
import {
  getShiftHandoverById,
  saveShiftHandover,
  updateShiftHandover,
} from '../lib/shiftHandoverStorage'
import { ShiftHandoverFormData } from '../lib/shiftHandoverSchema'

export default function ShiftHandoverEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [initialData, setInitialData] = useState<ShiftHandoverFormData | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isEditing && id) {
      const record = getShiftHandoverById(id)
      if (record) {
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = record
        setInitialData(rest)
      } else {
        setError('Shift handover sheet not found.')
      }
    } else {
      setInitialData(undefined)
    }
  }, [isEditing, id])

  const handleSubmit = async (data: ShiftHandoverFormData) => {
    setIsSaving(true)
    try {
      if (isEditing && id) {
        updateShiftHandover(id, data)
        navigate('/shift-handovers', { state: { success: 'Shift handover sheet updated successfully.' } })
      } else {
        saveShiftHandover(data)
        navigate('/shift-handovers', { state: { success: 'Shift handover sheet created successfully.' } })
      }
    } catch (err) {
      console.error('Failed to save shift handover sheet:', err)
      setError('Failed to save shift handover sheet. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const headerTitle = isEditing ? 'Edit Shift Handover Sheet' : 'Create Shift Handover Sheet'
  const helperText = isEditing
    ? 'Update machine level status, carry-forward work, or approvals.'
    : 'Capture the outgoing shift status, machine progress, and pending actions.'

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
            onClick={() => navigate('/shift-handovers')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Shift Handover</span>
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
          <ShiftHandoverForm initialData={initialData} onSubmit={handleSubmit} isLoading={isSaving} />
        ) : null}
      </div>
    </MainLayout>
  )
}

