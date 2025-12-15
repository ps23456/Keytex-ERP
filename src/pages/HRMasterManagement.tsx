import { useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import { masterSchemas, masterLabels, MasterRecord, getMasterIdField } from '../lib/schemas'
import { useMasters } from '../hooks/useMasters'
import MasterDataTable from '../components/MasterDataTable'
import MasterForm from '../components/MasterForm'
import SlideOver from '../components/SlideOver'
import { Button } from '../components/ui/button'
import { Plus, Users, TrendingUp, Calendar, Clock, Award, DollarSign, CalendarDays } from 'lucide-react'

const hrTabs = [
  { key: 'designation', label: 'Designation Master', icon: Users },
  { key: 'grade', label: 'Grade / Level Master', icon: TrendingUp },
  { key: 'leave_type', label: 'Leave Type Master', icon: Calendar },
  { key: 'shift', label: 'Shift Master', icon: Clock },
  { key: 'skill_matrix', label: 'Skill Matrix Master', icon: Award },
  { key: 'salary_structure', label: 'Salary Structure Master', icon: DollarSign },
  { key: 'holiday_list', label: 'Holiday List Master', icon: CalendarDays }
]

export default function HRMasterManagement() {
  const [activeTab, setActiveTab] = useState('designation')
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
        console.log(`🗑️ Deleting ${activeTab} record:`, { idField, recordId, record })
        await deleteRecord(recordId)
        console.log(`✅ Successfully deleted ${activeTab} record:`, recordId)
        setSuccessMessage(`${currentLabel} deleted successfully!`)
        setTimeout(() => setSuccessMessage(null), 3000)
      } catch (error) {
        console.error(`❌ Error deleting ${activeTab} record:`, error)
        alert('Failed to delete record')
      }
    }
  }

  const handleFormSubmit = async (data: MasterRecord) => {
    try {
      if (editingRecord) {
        const idField = getMasterIdField(activeTab)
        const recordId = editingRecord[idField]
        console.log(`✏️ Updating ${activeTab} record:`, { idField, recordId, data, editingRecord })
        await updateRecord({ id: recordId, data })
        console.log(`✅ Successfully updated ${activeTab} record:`, recordId)
        setSuccessMessage(`${currentLabel} updated successfully!`)
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        console.log(`➕ Creating new ${activeTab} record:`, data)
        await createRecord(data)
        console.log(`✅ Successfully created ${activeTab} record`)
        setSuccessMessage(`${currentLabel} created successfully!`)
        setTimeout(() => setSuccessMessage(null), 3000)
      }
      setIsFormOpen(false)
      setEditingRecord(null)
    } catch (error) {
      console.error('Form submission error:', error)
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

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">HR & Payroll Masters</h1>
          <p className="text-gray-600 mt-1">Manage designations, grades, leave types, shifts, skill matrix, salary structures, and holiday lists</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 py-4 overflow-x-auto" aria-label="Tabs">
              {hrTabs.map((tab) => {
                const Icon = tab.icon
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
                    <Icon className={`h-4 w-4 ${isActive ? 'text-red-600' : 'text-gray-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
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

        {/* Add/Edit Form Slide-over */}
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

        {/* View Modal */}
        <SlideOver
          open={!!viewingRecord}
          onOpenChange={(open) => !open && setViewingRecord(null)}
          title={`View ${currentLabel}`}
          description="Record details"
        >
          {viewingRecord && (
            <div className="space-y-4">
              {currentSchema.map((field) => (
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
