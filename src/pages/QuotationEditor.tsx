import { useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import QuotationForm, { QuotationFormData } from '../components/QuotationForm'
import { useMasters } from '../hooks/useMasters'
import { Button } from '../components/ui/button'
import { SpecificationCostBreakdown, SpecificationOperationBreakdown } from '../types/specifications'

const parseNumericValue = (value: unknown): number => {
  if (value === undefined || value === null) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const cleaned = String(value).replace(/[^0-9.\-]/g, '')
  if (!cleaned) return 0
  const parsed = Number.parseFloat(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

const OPERATION_LABELS: Record<string, string> = {
  cncSide1: 'CNC turning side 1',
  cncSide2: 'CNC turning side 2',
  cncSide3: 'CNC turning side 3',
  vmcSide1: 'VMC side 1',
  vmcSide2: 'VMC side 2',
  vmcSide3: 'VMC side 3',
  axis4: '4th axis operations',
  axis5: '5th axis operations',
  hardening: 'Hardening requirements',
  grinding: 'Grinding specifications',
  coating: 'Coating requirements',
}

const calculatePriceFromSpecifications = (
  product: Record<string, unknown> | null | undefined
): SpecificationCostBreakdown | null => {
  if (!product) return null

  const rawMaterialSize = parseNumericValue(product.rawMaterialSize)
  const rawMaterialPrice = parseNumericValue(product.rawMaterialPrice)

  const materialCost =
    rawMaterialSize > 0 && rawMaterialPrice > 0
      ? rawMaterialSize * rawMaterialPrice
      : rawMaterialPrice

  const operations: SpecificationOperationBreakdown[] = Object.keys(OPERATION_LABELS).map((key) => {
    const value = parseNumericValue(product[key as keyof typeof product])
    return {
      key,
      label: OPERATION_LABELS[key],
      value,
    }
  })

  const operationsCost = operations.reduce((sum, operation) => sum + operation.value, 0)
  const totalCost = materialCost + operationsCost

  if (totalCost <= 0) {
    return {
      totalCost: 0,
      materialCost: 0,
      operationsCost: 0,
      rawMaterialSize,
      rawMaterialPrice,
      operations,
    }
  }

  return {
    totalCost,
    materialCost,
    operationsCost,
    rawMaterialSize,
    rawMaterialPrice,
    operations,
  }
}

export default function QuotationEditor() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const {
    records: quotations,
    createRecord,
    updateRecord,
    isCreating,
    isUpdating,
    isLoading,
  } = useMasters('quotation')

  const inquiryFromState: any = (location.state as any)?.inquiry || null

  const editingRecord = useMemo(() => {
    if (!isEdit) return null
    return quotations.find((record: any) => {
      const recordId = record.id || record.quotation_id || record.quotationId
      return recordId === id
    }) || null
  }, [quotations, isEdit, id])

  const specificationResults = useMemo(() => {
    if (!inquiryFromState || !Array.isArray(inquiryFromState.products)) return []
    return inquiryFromState.products.map((product: any) => ({
      product,
      cost: calculatePriceFromSpecifications(product),
    }))
  }, [inquiryFromState])

  const specificationCostDetails = useMemo<(SpecificationCostBreakdown | null)[]>(() => {
    return specificationResults.map((result) => result.cost)
  }, [specificationResults])

  const initialFromInquiry: Partial<QuotationFormData> | undefined = useMemo(() => {
    if (!inquiryFromState) return undefined
    return {
      companyName: inquiryFromState.companyName || '',
      contactPerson: inquiryFromState.contactPerson || '',
      contactPhone: inquiryFromState.contactNumber || '',
      contactEmail: inquiryFromState.email || '',
      address: inquiryFromState.address || '',
      items:
        specificationResults.length > 0
          ? specificationResults.map(({ product, cost }) => ({
              partName: product.itemName || '',
              material: product.material || '',
              quantity: product.quantity ? String(product.quantity) : '1',
              price: cost && cost.totalCost > 0 ? cost.totalCost.toFixed(2) : '0',
            }))
          : inquiryFromState.products?.map((product: any) => ({
              partName: product.itemName || '',
              material: product.material || '',
              quantity: product.quantity ? String(product.quantity) : '1',
              price: '0',
            })),
      notes: inquiryFromState.additionalDetails || '',
    }
  }, [inquiryFromState, specificationResults])

  const handleSubmit = async (formData: QuotationFormData & { totalAmount: number }) => {
    const followUpsCount = parseInt(formData.followUps || '0', 10) || 0
    // Include inquiry data (with job card template info) in quotation
    const quotationData = {
      ...formData,
      // Store inquiry data for reference (including job card templates)
      inquiryData: inquiryFromState ? {
        products: inquiryFromState.products?.map((product: any) => ({
          ...product,
          jobCardTemplateId: product.jobCardTemplateId,
          operationFields: product.operationFields || {},
        })) || [],
      } : undefined,
    }
    
    if (isEdit && editingRecord) {
      const recordId = editingRecord.id || editingRecord.quotation_id || editingRecord.quotationId
      await updateRecord({
        id: String(recordId),
        data: {
          ...editingRecord,
          ...quotationData,
          followUps: followUpsCount,
          totalAmount: formData.totalAmount,
          updatedAt: new Date().toISOString(),
        },
      })
    } else {
      await createRecord({
        ...quotationData,
        followUps: followUpsCount,
        totalAmount: formData.totalAmount,
        status: formData.status,
        createdAt: new Date().toISOString(),
        inquiryId: inquiryFromState?.inquiry_id || inquiryFromState?.id || null,
      })
    }
    navigate('/quotations')
  }

  const pageTitle = isEdit ? 'Edit Quotation' : 'Create Quotation'

  if (isEdit && isLoading && !editingRecord) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Loading quotation...</h1>
            <Button variant="outline" onClick={() => navigate('/quotations')}>Back</Button>
          </div>
          <div className="bg-white border rounded-lg shadow-sm p-6 text-muted-foreground">
            Please wait while we fetch the quotation details.
          </div>
        </div>
      </MainLayout>
    )
  }

  if (isEdit && !editingRecord && !isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Quotation Not Found</h1>
            <Button variant="outline" onClick={() => navigate('/quotations')}>Back to Quotations</Button>
          </div>
          <div className="bg-white border rounded-lg shadow-sm p-6 text-muted-foreground">
            The quotation you are trying to edit could not be found. It may have been deleted.
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{pageTitle}</h1>
            <p className="text-gray-600 mt-1">Fill in the details to {isEdit ? 'update' : 'create'} the quotation</p>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
        </div>

        <div className="bg-white border rounded-lg shadow-sm p-6">
          <QuotationForm
            key={editingRecord ? `edit-${id}` : inquiryFromState?.inquiry_id || 'new-quotation'}
            initialData={editingRecord || initialFromInquiry}
            onSubmit={handleSubmit}
            isLoading={isCreating || isUpdating}
            specCostDetails={!editingRecord ? specificationCostDetails : undefined}
          />
        </div>
      </div>
    </MainLayout>
  )
}
