import { useState, useEffect } from 'react'
import MainLayout from '../layouts/MainLayout'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import {
  loadMaintenanceMasters,
  addTaskToStep,
  updateTask,
  deleteTask,
  MaintenanceMasterData,
  MaintenanceTask,
} from '../lib/maintenanceMasterStorage'
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react'

const STEPS = ['Cleaning', 'Lubrication', 'Inspection', 'Tightening']

export default function MaintenanceMasterManagement() {
  const [masters, setMasters] = useState<MaintenanceMasterData[]>(() => loadMaintenanceMasters())
  const [selectedStep, setSelectedStep] = useState<string>('Cleaning')
  const [editingTask, setEditingTask] = useState<{ step: string; task: MaintenanceTask } | null>(null)
  const [newTaskName, setNewTaskName] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const currentMaster = masters.find((m) => m.step === selectedStep)
  const currentTasks = currentMaster?.tasks || []

  const handleAddTask = () => {
    if (!newTaskName.trim()) return

    try {
      addTaskToStep(selectedStep, newTaskName.trim())
      setMasters(loadMaintenanceMasters())
      setNewTaskName('')
      setSuccessMessage('Task added successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      alert('Failed to add task')
    }
  }

  const handleEditTask = (task: MaintenanceTask) => {
    setEditingTask({ step: selectedStep, task })
    setNewTaskName(task.taskName)
  }

  const handleSaveTask = () => {
    if (!editingTask || !newTaskName.trim()) return

    try {
      updateTask(editingTask.step, editingTask.task.id, newTaskName.trim())
      setMasters(loadMaintenanceMasters())
      setEditingTask(null)
      setNewTaskName('')
      setSuccessMessage('Task updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      alert('Failed to update task')
    }
  }

  const handleCancelEdit = () => {
    setEditingTask(null)
    setNewTaskName('')
  }

  const handleDeleteTask = (task: MaintenanceTask) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        deleteTask(selectedStep, task.id)
        setMasters(loadMaintenanceMasters())
        setSuccessMessage('Task deleted successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
      } catch (error) {
        alert('Failed to delete task')
      }
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Maintenance Master</h1>
          <p className="text-gray-600 mt-1">Manage maintenance steps and their associated tasks</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Step Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 py-4 overflow-x-auto" aria-label="Tabs">
              {STEPS.map((step) => {
                const isActive = selectedStep === step
                const stepMaster = masters.find((m) => m.step === step)
                const taskCount = stepMaster?.tasks?.length || 0

                return (
                  <button
                    key={step}
                    onClick={() => {
                      setSelectedStep(step)
                      setEditingTask(null)
                      setNewTaskName('')
                    }}
                    className={`
                      flex items-center space-x-2 px-1 py-2 border-b-2 font-medium text-sm whitespace-nowrap
                      ${isActive
                        ? 'border-teal-500 text-teal-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <span>{step}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        isActive
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {taskCount}
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {selectedStep} - Tasks
              </h2>
              <p className="text-sm text-gray-600">
                Manage tasks for the {selectedStep} step. These tasks will appear in the CLIT Sheet form when this step is selected.
              </p>
            </div>

            {/* Add Task Form */}
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Label className="text-sm font-medium text-gray-700">
                    {editingTask ? 'Edit Task Name' : 'New Task Name'}
                  </Label>
                  <Input
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="Enter task name"
                    className="mt-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (editingTask) {
                          handleSaveTask()
                        } else {
                          handleAddTask()
                        }
                      }
                    }}
                  />
                </div>
                {editingTask ? (
                  <>
                    <Button
                      onClick={handleSaveTask}
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleAddTask}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                )}
              </div>
            </div>

            {/* Tasks Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Task Name</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                        No tasks added yet. Add a task using the form above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentTasks.map((task, index) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{task.taskName}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditTask(task)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTask(task)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

