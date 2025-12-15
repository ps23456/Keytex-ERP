import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import JobCardForm, { JobCardFormData } from '../components/JobCardForm'
import { Button } from '../components/ui/button'
import {
  getJobCardById,
  markQuotationInProduction,
  saveJobCard,
  updateJobCard,
} from '../lib/jobCardStorage'

const buildPrefillFromQuotation = (quotation: any): Partial<JobCardFormData> => {
  if (!quotation) return {}
  const firstItem = Array.isArray(quotation.items) ? quotation.items[0] || {} : {}
  
  // Get job card template from quotation's inquiryData
  const firstProduct = quotation.inquiryData?.products?.[0]
  const jobCardTemplateId = firstProduct?.jobCardTemplateId || ''

  const deriveQuantity = () => {
    if (firstItem?.quantity) return String(firstItem.quantity)
    if (Array.isArray(quotation.items)) {
      const total = quotation.items.reduce((sum: number, item: any) => {
        const qty = parseFloat(item?.quantity || '0')
        return sum + (isNaN(qty) ? 0 : qty)
      }, 0)
      return total > 0 ? String(total) : ''
    }
    return ''
  }

  return {
    quotationId: quotation.id || quotation.quotation_id || quotation.quotationId || '',
    quoteNumber: quotation.quotationNumber || '',
    jobOrderNumber: quotation.quotationNumber || '',
    jobDate: quotation.quotationDate || '',
    jobCardTemplateId: jobCardTemplateId, // Include template ID
    sale: {
      clientName: quotation.companyName || '',
      address: quotation.address || '',
      contactPerson: quotation.contactPerson || '',
      contactPhone: quotation.contactPhone || '',
      itemName: firstItem?.partName || '',
      itemDescription: firstItem?.description || '',
      quantity: deriveQuantity(),
      rawMaterial: firstItem?.material || '',
    },
    design: {
      comments: quotation.notes || '',
    },
    program: {
      specialRequirement: quotation.specialNotes || quotation.notes || '',
    },
  }
}

const PREFILL_STORAGE_KEY = 'job_card_prefill'

const consumeCachedQuotation = () => {
  try {
    const raw = sessionStorage.getItem(PREFILL_STORAGE_KEY)
    if (!raw) return null
    sessionStorage.removeItem(PREFILL_STORAGE_KEY)
    return JSON.parse(raw)
  } catch (error) {
    console.error('Failed to parse cached quotation:', error)
    sessionStorage.removeItem(PREFILL_STORAGE_KEY)
    return null
  }
}

export default function JobCardEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const location = useLocation()
  const [initialData, setInitialData] = useState<Partial<JobCardFormData> | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isEditing && id) {
      const record = getJobCardById(id)
      if (record) {
        setInitialData(record)
      } else {
        setError('Job card not found.')
      }
      return
    }

    const stateQuotation = (location.state as any)?.quotation
    const cachedQuotation = consumeCachedQuotation()
    const quotation = stateQuotation || cachedQuotation

    if (quotation) {
      setInitialData(buildPrefillFromQuotation(quotation))
      if (stateQuotation) {
        navigate(location.pathname, { replace: true })
      }
    } else if (!initialData) {
      setInitialData(undefined)
    }
  }, [id, isEditing, location.pathname, location.state, navigate, initialData])

  const handleSubmit = async (data: JobCardFormData) => {
    setIsSaving(true)
    try {
      if (isEditing && id) {
        updateJobCard(id, data)
        if (data.quotationId) {
          markQuotationInProduction(data.quotationId)
        }
        navigate('/job-cards', {
          state: { success: 'Job card updated successfully.' },
        })
      } else {
        saveJobCard(data)
        if (data.quotationId) {
          markQuotationInProduction(data.quotationId)
        }
        navigate('/job-cards', {
          state: { success: 'Job card created successfully.' },
        })
      }
    } catch (err) {
      console.error('Failed to save job card:', err)
      setError('Failed to save job card. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const headerTitle = isEditing ? 'Edit Job Card' : 'Create Job Card'
  const helperText = isEditing
    ? 'Update machining plan, schedule, and approvals in one place.'
    : 'Fill in the details below to create a new job card.'

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900"
            onClick={() => navigate('/job-cards')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Job Cards</span>
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
          <JobCardForm initialData={initialData} onSubmit={handleSubmit} isLoading={isSaving} />
        ) : null}
      </div>
    </MainLayout>
  )
}

