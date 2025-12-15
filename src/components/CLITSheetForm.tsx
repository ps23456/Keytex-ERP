import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Button } from './ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Checkbox } from './ui/checkbox'
import { Plus, Trash2, X } from 'lucide-react'
import { CLITTask, CLITSheetFormData } from '../lib/clitSheetStorage'
import { getTasksByStep, loadMaintenanceMasters } from '../lib/maintenanceMasterStorage'

const clitSheetSchema = z.object({
  month: z.string().min(1, 'Month is required'),
  machineName: z.string().min(1, 'Machine name is required'),
  tasks: z.array(
    z.object({
      step: z.string().min(1, 'Step is required'),
      task: z.string().min(1, 'Task is required'),
      frequency: z.string().min(1, 'Frequency is required'),
      methodImage: z.string().optional(),
      shift: z.enum(['Day', 'Night']),
      dayTracking: z.record(z.boolean()).optional(),
    })
  ).min(1, 'At least one task is required'),
  operatorSignature: z.string().optional(),
  supervisorSignature: z.string().optional(),
  hodSignature: z.string().optional(),
})

export type CLITSheetFormDataType = z.infer<typeof clitSheetSchema>

interface CLITSheetFormProps {
  initialData?: Partial<CLITSheetFormData>
  onSubmit: (data: CLITSheetFormData) => Promise<void> | void
  isLoading?: boolean
}

export default function CLITSheetForm({ initialData, onSubmit, isLoading = false }: CLITSheetFormProps) {
  const [tasks, setTasks] = useState<CLITTask[]>(initialData?.tasks || [])
  const [imagePreviews, setImagePreviews] = useState<Record<number, string>>({})

  const defaultValues = useMemo<CLITSheetFormDataType>(() => ({
    month: initialData?.month || new Date().toISOString().slice(0, 7),
    machineName: initialData?.machineName || '',
    tasks: initialData?.tasks || [],
    operatorSignature: initialData?.operatorSignature || '',
    supervisorSignature: initialData?.supervisorSignature || '',
    hodSignature: initialData?.hodSignature || '',
  }), [initialData])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CLITSheetFormDataType>({
    resolver: zodResolver(clitSheetSchema),
    defaultValues,
    mode: 'onChange',
  })

  useEffect(() => {
    reset(defaultValues)
    if (initialData?.tasks) {
      setTasks(initialData.tasks)
      // Load image previews
      const previews: Record<number, string> = {}
      initialData.tasks.forEach((task, index) => {
        if (task.methodImage) {
          previews[index] = task.methodImage
        }
      })
      setImagePreviews(previews)
    }
  }, [defaultValues, reset, initialData])

  useEffect(() => {
    setValue('tasks', tasks)
  }, [tasks, setValue])

  const handleFormSubmit = async (data: CLITSheetFormDataType) => {
    const formData: CLITSheetFormData = {
      month: data.month,
      machineName: data.machineName,
      tasks: tasks,
      operatorSignature: data.operatorSignature,
      supervisorSignature: data.supervisorSignature,
      hodSignature: data.hodSignature,
    }
    await onSubmit(formData)
  }

  const addTask = () => {
    const newTask: CLITTask = {
      step: 'Cleaning',
      task: '',
      frequency: 'Daily',
      shift: 'Day',
      dayTracking: {},
    }
    setTasks([...tasks, newTask])
  }

  const removeTask = (index: number) => {
    const updated = tasks.filter((_, i) => i !== index)
    setTasks(updated)
    // Remove image preview
    const newPreviews = { ...imagePreviews }
    delete newPreviews[index]
    setImagePreviews(newPreviews)
  }

  const updateTask = (index: number, field: keyof CLITTask, value: any) => {
    const updated = tasks.map((task, i) => {
      if (i === index) {
        const updatedTask = { ...task, [field]: value }
        // If step is changed, clear the task name
        if (field === 'step') {
          updatedTask.task = ''
        }
        return updatedTask
      }
      return task
    })
    setTasks(updated)
  }

  // Get tasks for a specific step from maintenance master
  const getTasksForStep = (step: string) => {
    return getTasksByStep(step)
  }

  const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreviews({ ...imagePreviews, [index]: result })
        updateTask(index, 'methodImage', result)
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleDayTracking = (taskIndex: number, day: number) => {
    const updated = tasks.map((task, i) => {
      if (i === taskIndex) {
        const currentTracking = task.dayTracking || {}
        return {
          ...task,
          dayTracking: {
            ...currentTracking,
            [day]: !currentTracking[day],
          },
        }
      }
      return task
    })
    setTasks(updated)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="rounded-3xl border border-teal-200 bg-gradient-to-r from-teal-600 via-cyan-500 to-blue-500 p-8 text-white shadow-xl">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-white/90">Keytex Machines</p>
          <h2 className="text-3xl font-semibold text-white">CLIT Sheet - Autonomous Maintenance</h2>
          <p className="text-sm text-white/90 max-w-3xl">
            Cleaning, Lubrication, Inspection, and Tightening schedule for autonomous maintenance.
          </p>
        </div>
      </div>

      {/* Header Fields */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="month" className="text-sm font-medium">
              Month <span className="text-destructive">*</span>
            </Label>
            <Input
              id="month"
              type="month"
              {...register('month')}
              className="h-10"
            />
            {errors.month && (
              <p className="text-xs text-destructive">{errors.month.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="machineName" className="text-sm font-medium">
              Machine Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="machineName"
              {...register('machineName')}
              placeholder="Enter machine name"
              className="h-10"
            />
            {errors.machineName && (
              <p className="text-xs text-destructive">{errors.machineName.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Tasks</h3>
            <p className="text-sm text-slate-600">Add maintenance tasks with their schedules</p>
          </div>
          <Button
            type="button"
            onClick={addTask}
            className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </Button>
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No tasks added yet. Click "Add Task" to get started.
          </div>
        )}

        <div className="space-y-6">
          {tasks.map((task, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-slate-900">Task {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTask(index)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Step */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Step</Label>
                  <Select
                    value={task.step}
                    onValueChange={(value) => updateTask(index, 'step', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cleaning">Cleaning</SelectItem>
                      <SelectItem value="Lubrication">Lubrication</SelectItem>
                      <SelectItem value="Inspection">Inspection</SelectItem>
                      <SelectItem value="Tightening">Tightening</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Task Name */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Task Name</Label>
                  <Select
                    key={`${index}-${task.step}`}
                    value={task.task}
                    onValueChange={(value) => updateTask(index, 'task', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select task name" />
                    </SelectTrigger>
                    <SelectContent>
                      {getTasksForStep(task.step).length === 0 ? (
                        <SelectItem value="" disabled>No tasks available for {task.step}</SelectItem>
                      ) : (
                        getTasksForStep(task.step).map((maintenanceTask) => (
                          <SelectItem key={maintenanceTask.id} value={maintenanceTask.taskName}>
                            {maintenanceTask.taskName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Frequency */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Frequency</Label>
                  <Select
                    value={task.frequency}
                    onValueChange={(value) => updateTask(index, 'frequency', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Shift */}
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Shift</Label>
                  <Select
                    value={task.shift}
                    onValueChange={(value: 'Day' | 'Night') => updateTask(index, 'shift', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Day">Day</SelectItem>
                      <SelectItem value="Night">Night</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Method Image */}
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-sm font-medium">Method Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(index, e)}
                    className="h-10"
                  />
                  {imagePreviews[index] && (
                    <div className="relative mt-2 inline-block">
                      <img
                        src={imagePreviews[index]}
                        alt="Method preview"
                        className="h-24 w-24 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => {
                          const newPreviews = { ...imagePreviews }
                          delete newPreviews[index]
                          setImagePreviews(newPreviews)
                          updateTask(index, 'methodImage', undefined)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Day Tracking Grid */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Day Tracking (1-31)</Label>
                <div className="grid grid-cols-8 md:grid-cols-16 gap-2 p-3 bg-slate-50 rounded-lg">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <div key={day} className="flex flex-col items-center space-y-1">
                      <Label className="text-xs text-slate-600">{day}</Label>
                      <Checkbox
                        checked={task.dayTracking?.[day] || false}
                        onCheckedChange={() => toggleDayTracking(index, day)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {errors.tasks && (
          <p className="text-xs text-destructive">{errors.tasks.message}</p>
        )}
      </div>

      {/* Signatures Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Signatures</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="operatorSignature" className="text-sm font-medium">
              Operator Signature
            </Label>
            <Input
              id="operatorSignature"
              {...register('operatorSignature')}
              placeholder="Operator name"
              className="h-10"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="supervisorSignature" className="text-sm font-medium">
              Supervisor Signature
            </Label>
            <Input
              id="supervisorSignature"
              {...register('supervisorSignature')}
              placeholder="Supervisor name"
              className="h-10"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="hodSignature" className="text-sm font-medium">
              HOD Signature
            </Label>
            <Input
              id="hodSignature"
              {...register('hodSignature')}
              placeholder="HOD name"
              className="h-10"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="submit" disabled={isLoading} className="bg-teal-600 hover:bg-teal-700">
          {isLoading ? 'Saving...' : initialData ? 'Update CLIT Sheet' : 'Create CLIT Sheet'}
        </Button>
      </div>
    </form>
  )
}

