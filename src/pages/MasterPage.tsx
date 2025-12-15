import { useState } from 'react'
import { useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { masterSchemas, masterLabels, MasterRecord, getMasterIdField } from '../lib/schemas'
import { useMasters } from '../hooks/useMasters'
import MasterDataTable from '../components/MasterDataTable'
import MasterForm from '../components/MasterForm'
import SlideOver from '../components/SlideOver'
import { Button } from '../components/ui/button'
import { Plus } from 'lucide-react'

export default function MasterPage() {
  const { masterKey } = useParams<{ masterKey: string }>()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MasterRecord | null>(null)
  const [viewingRecord, setViewingRecord] = useState<MasterRecord | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  if (!masterKey || !masterSchemas[masterKey]) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-destructive">Master Not Found</h1>
          <p className="text-muted-foreground">The requested master data type does not exist.</p>
        </div>
      </MainLayout>
    )
  }

  const schema = masterSchemas[masterKey]
  const masterLabel = masterLabels[masterKey]
  
  const {
    records,
    isLoading,
    createRecord,
    updateRecord,
    deleteRecord,
    isCreating,
    isUpdating
  } = useMasters(masterKey)

  const handleAdd = () => {
    setEditingRecord(null)
    setIsFormOpen(true)
  }

  const handleEdit = (record: MasterRecord) => {
    setEditingRecord(record)
    setIsFormOpen(true)
  }

  const handleView = (record: MasterRecord) => {
    setViewingRecord(record)
  }

  const handleDelete = async (record: MasterRecord) => {
    if (window.confirm(`Are you sure you want to delete this ${masterLabel.toLowerCase()}?`)) {
      try {
        const idField = getMasterIdField(masterKey)
        const recordId = record[idField]
        console.log(`🗑️ Deleting ${masterKey} record:`, { idField, recordId, record })
        await deleteRecord(recordId)
        console.log(`✅ Successfully deleted ${masterKey} record:`, recordId)
        setSuccessMessage(`${masterLabel} deleted successfully!`)
        setTimeout(() => setSuccessMessage(null), 3000)
      } catch (error) {
        console.error('Delete error:', error)
        alert('Failed to delete record')
      }
    }
  }

  const handleFormSubmit = async (data: MasterRecord) => {
    try {
      if (editingRecord) {
        const idField = getMasterIdField(masterKey)
        const recordId = editingRecord[idField]
        console.log(`✏️ Updating ${masterKey} record:`, { idField, recordId, data, editingRecord })
        await updateRecord({ id: recordId, data })
        console.log(`✅ Successfully updated ${masterKey} record:`, recordId)
        setSuccessMessage(`${masterLabel} updated successfully!`)
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        console.log(`➕ Creating new ${masterKey} record:`, data)
        await createRecord(data)
        console.log(`✅ Successfully created ${masterKey} record`)
        setSuccessMessage(`${masterLabel} created successfully!`)
        setTimeout(() => setSuccessMessage(null), 3000)
      }
      setIsFormOpen(false)
      setEditingRecord(null)
    } catch (error) {
      console.error('Form submission error:', error)
      // More specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to save record: ${errorMessage}`)
    }
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingRecord(null)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{masterLabel}</h1>
            <p className="text-muted-foreground">
              Manage {masterLabel.toLowerCase()} records
            </p>
          </div>
          <Button onClick={handleAdd} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add {masterLabel}</span>
          </Button>
        </div>

        <MasterDataTable
          masterKey={masterKey}
          schema={schema}
          records={records}
          isLoading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Add/Edit Form Slide-over */}
        <SlideOver
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          title={editingRecord ? `Edit ${masterLabel}` : `Add New ${masterLabel}`}
          description={editingRecord ? 'Update the record information' : 'Fill in the details to create a new record'}
        >
          <MasterForm
            masterKey={masterKey}
            schema={schema}
            initialData={editingRecord || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isCreating || isUpdating}
          />
        </SlideOver>

        {/* View Modal */}
        <SlideOver
          open={!!viewingRecord}
          onOpenChange={(open) => !open && setViewingRecord(null)}
          title={`View ${masterLabel}`}
          description="Record details"
        >
          {viewingRecord && (
            <div className="space-y-4">
              {schema.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    {field.label}
                  </label>
                  <div className="text-sm">
                    {viewingRecord[field.key] || '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SlideOver>
      </div>
    </MainLayout>
  )
}
