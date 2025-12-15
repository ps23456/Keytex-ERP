import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import CLITSheetForm from '../components/CLITSheetForm'
import { Button } from '../components/ui/button'
import { ArrowLeft } from 'lucide-react'
import {
  getCLITSheetById,
  saveCLITSheet,
  updateCLITSheet,
  CLITSheetFormData,
} from '../lib/clitSheetStorage'

export default function CLITSheetEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [initialData, setInitialData] = useState<CLITSheetFormData | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isEditing && id) {
      const record = getCLITSheetById(id)
      if (record) {
        const { id: recordId, createdAt, updatedAt, ...rest } = record
        setInitialData(rest)
      } else {
        setError('CLIT sheet not found.')
      }
    } else {
      setInitialData(undefined)
    }
  }, [isEditing, id])

  const handleSubmit = async (data: CLITSheetFormData) => {
    setIsSaving(true)
    try {
      if (isEditing && id) {
        updateCLITSheet(id, data)
        navigate('/clit-sheet', { state: { success: 'CLIT sheet updated successfully.' } })
      } else {
        saveCLITSheet(data)
        navigate('/clit-sheet', { state: { success: 'CLIT sheet created successfully.' } })
      }
    } catch (err) {
      console.error('Failed to save CLIT sheet:', err)
      setError('Failed to save CLIT sheet. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const headerTitle = isEditing ? 'Edit CLIT Sheet' : 'Create CLIT Sheet'
  const helperText = isEditing
    ? 'Update the CLIT sheet and maintain accurate maintenance records.'
    : 'Fill in the details below to create a new CLIT sheet for autonomous maintenance.'

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
            onClick={() => navigate('/clit-sheet')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to CLIT Sheets</span>
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
          <CLITSheetForm initialData={initialData} onSubmit={handleSubmit} isLoading={isSaving} />
        ) : null}
      </div>
    </MainLayout>
  )
}

