import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { Button } from '../components/ui/button'
import { ArrowLeft, Pencil } from 'lucide-react'
import { getCLITSheetById, CLITSheetEntry } from '../lib/clitSheetStorage'

export default function CLITSheetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [record, setRecord] = useState<CLITSheetEntry | null>(null)

  useEffect(() => {
    if (id) {
      const sheet = getCLITSheetById(id)
      if (sheet) {
        setRecord(sheet)
      }
    }
  }, [id])

  if (!record) {
    return (
      <MainLayout>
        <div className="text-center py-10">
          <p className="text-slate-600">CLIT sheet not found.</p>
          <Button
            variant="outline"
            onClick={() => navigate('/clit-sheet')}
            className="mt-4"
          >
            Back to CLIT Sheets
          </Button>
        </div>
      </MainLayout>
    )
  }

  const formatMonth = (month: string) => {
    if (!month) return '-'
    try {
      const [year, monthNum] = month.split('-')
      const date = new Date(parseInt(year), parseInt(monthNum) - 1)
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    } catch {
      return month
    }
  }

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
          <Button
            onClick={() => navigate(`/clit-sheet/${id}/edit`)}
            className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Pencil className="h-4 w-4" />
            <span>Edit</span>
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          {/* Header */}
          <div className="border-b pb-4">
            <h1 className="text-2xl font-bold text-slate-900">CLIT Sheet Details</h1>
            <p className="text-sm text-slate-600 mt-1">
              Created: {new Date(record.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-slate-600">Month</Label>
              <p className="text-lg font-semibold text-slate-900">{formatMonth(record.month)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-600">Machine Name</Label>
              <p className="text-lg font-semibold text-slate-900">{record.machineName}</p>
            </div>
          </div>

          {/* Tasks */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Tasks</h3>
            <div className="space-y-4">
              {record.tasks?.map((task, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <Label className="text-xs text-slate-600">Step</Label>
                      <p className="font-medium">{task.step}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Task</Label>
                      <p className="font-medium">{task.task}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Frequency</Label>
                      <p className="font-medium">{task.frequency}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600">Shift</Label>
                      <p className="font-medium">{task.shift}</p>
                    </div>
                  </div>
                  {task.methodImage && (
                    <div className="mb-4">
                      <Label className="text-xs text-slate-600">Method Image</Label>
                      <img
                        src={task.methodImage}
                        alt="Method"
                        className="mt-2 h-32 w-32 object-cover rounded border"
                      />
                    </div>
                  )}
                  {task.dayTracking && Object.keys(task.dayTracking).length > 0 && (
                    <div>
                      <Label className="text-xs text-slate-600">Day Tracking</Label>
                      <div className="grid grid-cols-8 md:grid-cols-16 gap-2 mt-2">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <div
                            key={day}
                            className={`text-center p-1 rounded text-xs ${
                              task.dayTracking?.[day]
                                ? 'bg-teal-100 text-teal-800 font-semibold'
                                : 'bg-slate-50 text-slate-400'
                            }`}
                          >
                            {day}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Signatures */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Signatures</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-600">Operator</Label>
                <p className="text-slate-900">{record.operatorSignature || '-'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-600">Supervisor</Label>
                <p className="text-slate-900">{record.supervisorSignature || '-'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-600">HOD</Label>
                <p className="text-slate-900">{record.hodSignature || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}

