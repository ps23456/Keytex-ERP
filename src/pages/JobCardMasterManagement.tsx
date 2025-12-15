import { useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import { masterSchemas, masterLabels, MasterRecord, getMasterIdField, FieldSchema } from '../lib/schemas'
import { useMasters } from '../hooks/useMasters'
import MasterDataTable from '../components/MasterDataTable'
import MasterForm from '../components/MasterForm'
import SlideOver from '../components/SlideOver'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog'
import { Button } from '../components/ui/button'
import { Plus, ListChecks } from 'lucide-react'

const jobCardMasterTabs = [
  { key: 'job_card_template', label: masterLabels['job_card_template'] },
]

export default function JobCardMasterManagement() {
  const [activeTab, setActiveTab] = useState(jobCardMasterTabs[0].key)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MasterRecord | null>(null)
  const [viewingRecord, setViewingRecord] = useState<MasterRecord | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const currentSchema = masterSchemas[activeTab]
  const currentLabel = masterLabels[activeTab]

  const {
    records,
    isLoading,
    createRecord,
    updateRecord,
    deleteRecord,
    isCreating,
    isUpdating
  } = useMasters(activeTab)

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
    if (window.confirm(`Are you sure you want to delete this ${currentLabel.toLowerCase()}?`)) {
      try {
        const idField = getMasterIdField(activeTab)
        const recordId = record[idField]
        await deleteRecord(recordId)
        setSuccessMessage(`${currentLabel} deleted successfully!`)
        setTimeout(() => setSuccessMessage(null), 3000)
      } catch (error) {
        alert('Failed to delete record')
      }
    }
  }

  const handleFormSubmit = async (data: MasterRecord) => {
    try {
      if (editingRecord) {
        const idField = getMasterIdField(activeTab)
        const recordId = editingRecord[idField]
        await updateRecord({ id: recordId, data })
        setSuccessMessage(`${currentLabel} updated successfully!`)
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        await createRecord(data)
        setSuccessMessage(`${currentLabel} created successfully!`)
        setTimeout(() => setSuccessMessage(null), 3000)
      }
      setIsFormOpen(false)
      setEditingRecord(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to save record: ${errorMessage}`)
    }
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingRecord(null)
  }

  const renderFieldValue = (field: FieldSchema, record: MasterRecord) => {
    const value = record[field.key]
    if (value === null || value === undefined || value === '') return '-'

    if (field.key === 'operations') {
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value
        if (Array.isArray(parsed) && parsed.length > 0) {
          return (
            <div className="space-y-1">
              {parsed.map((op: any, index: number) => (
                <div key={`${op.key}-${index}`} className="flex justify-between text-sm rounded-lg bg-slate-50 px-3 py-2">
                  <span className="font-medium text-slate-700">{op.label || op.key}</span>
                  <span className="text-xs uppercase tracking-wide text-slate-500">{op.type}</span>
                </div>
              ))}
            </div>
          )
        }
        return 'No operations defined'
      } catch (error) {
        return 'No operations defined'
      }
    }

    switch (field.ui) {
      case 'date':
        return new Date(value).toLocaleDateString()
      case 'datetime':
        return new Date(value).toLocaleString()
      case 'checkbox':
        return value ? 'Yes' : 'No'
      default:
        return value.toString()
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Job Card Master</h1>
          <p className="text-gray-600 mt-1">Manage job card templates used in the Inquiry form</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 py-4 overflow-x-auto" aria-label="Tabs">
              {jobCardMasterTabs.map((tab) => {
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`
                      flex items-center space-x-2 px-1 py-2 border-b-2 font-medium text-sm whitespace-nowrap
                      ${isActive 
                        ? 'border-red-500 text-red-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <ListChecks className={`h-4 w-4 ${isActive ? 'text-red-600' : 'text-gray-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{currentLabel}</h2>
                <p className="text-gray-600">Manage {currentLabel.toLowerCase()} records</p>
              </div>
              <Button onClick={handleAdd} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add {currentLabel}</span>
              </Button>
            </div>

            <MasterDataTable
              masterKey={activeTab}
              schema={currentSchema}
              records={records}
              isLoading={isLoading}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </div>

        <SlideOver
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          title={editingRecord ? `Edit ${currentLabel}` : `Add New ${currentLabel}`}
          description={editingRecord ? 'Update the record information' : 'Fill in the details to create a new record'}
        >
          <MasterForm
            masterKey={activeTab}
            schema={currentSchema}
            initialData={editingRecord || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isCreating || isUpdating}
          />
        </SlideOver>

        <Dialog open={!!viewingRecord} onOpenChange={(open) => !open && setViewingRecord(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>View {currentLabel}</DialogTitle>
              <DialogDescription>Inspect the details of the selected record.</DialogDescription>
            </DialogHeader>
            {viewingRecord && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {schema
                    .filter((field) => field.ui !== 'auto' && field.ui !== 'image')
                    .map((field) => (
                      <div
                        key={field.key}
                        className={`rounded-lg border border-slate-200 bg-white p-4 ${
                          field.key === 'operations' ? 'md:col-span-2' : ''
                        }`}
                      >
                        <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                          {field.label}
                        </p>
                        <div className="text-sm text-slate-700">
                          {renderFieldValue(field, viewingRecord)}
                        </div>
                      </div>
                    ))}
                </div>
                <div className="flex justify-end">
                  <Button type="button" variant="outline" onClick={() => setViewingRecord(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}

