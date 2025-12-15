export interface MaintenanceTask {
  id: string
  taskName: string
  step: string // Cleaning, Lubrication, Inspection, Tightening
  createdAt?: string
  updatedAt?: string
}

export interface MaintenanceMasterData {
  id: string
  step: string
  tasks: MaintenanceTask[]
  createdAt: string
  updatedAt?: string
}

const STORAGE_KEY = 'maintenance_master_records'

// Initialize with default data
const DEFAULT_DATA: MaintenanceMasterData[] = [
  {
    id: 'cleaning_1',
    step: 'Cleaning',
    tasks: [
      { id: 'task_1', taskName: 'Machine inside cleaning Telescopic Cover,chucks,turret – Chips Cleaning', step: 'Cleaning' },
      { id: 'task_2', taskName: 'Door – Clean with Air/Cloth', step: 'Cleaning' },
      { id: 'task_3', taskName: 'Tool Pocket – Clean Chips', step: 'Cleaning' },
      { id: 'task_4', taskName: 'Cooling Filter – Clean', step: 'Cleaning' },
      { id: 'task_5', taskName: 'ATC Arm cleaning with Air Gun', step: 'Cleaning' },
      { id: 'task_6', taskName: 'ATC Arm cleaning with Cloth', step: 'Cleaning' },
      { id: 'task_7', taskName: 'Turret Cleaning', step: 'Cleaning' },
      { id: 'task_8', taskName: 'Deep cleaning of Coolant Tank - Chip Removal', step: 'Cleaning' },
      { id: 'task_9', taskName: 'Spindle Taper – Clean & Grease', step: 'Cleaning' },
      { id: 'task_10', taskName: 'Coolant Tank - Chip Removal at side nets', step: 'Cleaning' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'lubrication_1',
    step: 'Lubrication',
    tasks: [
      { id: 'task_11', taskName: 'Lubrication oil level', step: 'Lubrication' },
      { id: 'task_12', taskName: 'Hydraulic Oil Level', step: 'Lubrication' },
      { id: 'task_13', taskName: 'Chuck grease filling', step: 'Lubrication' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'inspection_1',
    step: 'Inspection',
    tasks: [
      { id: 'task_14', taskName: 'Hydraulic Oil Level', step: 'Inspection' },
      { id: 'task_15', taskName: 'Spindle Taper', step: 'Inspection' },
      { id: 'task_16', taskName: '4th & 5th Axis Devices - Check oil level', step: 'Inspection' },
      { id: 'task_17', taskName: 'Axis – Smooth Running Check', step: 'Inspection' },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tightening_1',
    step: 'Tightening',
    tasks: [],
    createdAt: new Date().toISOString(),
  },
]

export const loadMaintenanceMasters = (): MaintenanceMasterData[] => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) {
      return JSON.parse(existing)
    } else {
      // Initialize with default data
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA))
      return DEFAULT_DATA
    }
  } catch (error) {
    console.error('Failed to load maintenance masters:', error)
    return DEFAULT_DATA
  }
}

export const getMaintenanceMasterByStep = (step: string): MaintenanceMasterData | null => {
  const masters = loadMaintenanceMasters()
  return masters.find((m) => m.step === step) || null
}

export const getTasksByStep = (step: string): MaintenanceTask[] => {
  const master = getMaintenanceMasterByStep(step)
  return master?.tasks || []
}

export const saveMaintenanceMaster = (data: Omit<MaintenanceMasterData, 'id' | 'createdAt'>): MaintenanceMasterData => {
  const master: MaintenanceMasterData = {
    ...data,
    id: `maintenance_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }

  try {
    const existing = loadMaintenanceMasters()
    existing.push(master)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  } catch (error) {
    console.error('Failed to save maintenance master:', error)
  }

  return master
}

export const updateMaintenanceMaster = (id: string, data: Partial<MaintenanceMasterData>): MaintenanceMasterData[] => {
  try {
    const existing = loadMaintenanceMasters()
    const updated = existing.map((master) =>
      master.id === id
        ? {
            ...master,
            ...data,
            id,
            createdAt: master.createdAt,
            updatedAt: new Date().toISOString(),
          }
        : master
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (error) {
    console.error('Failed to update maintenance master:', error)
    return loadMaintenanceMasters()
  }
}

export const deleteMaintenanceMaster = (id: string): MaintenanceMasterData[] => {
  try {
    const existing = loadMaintenanceMasters()
    const filtered = existing.filter((master) => master.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return filtered
  } catch (error) {
    console.error('Failed to delete maintenance master:', error)
    return loadMaintenanceMasters()
  }
}

export const addTaskToStep = (step: string, taskName: string): MaintenanceMasterData[] => {
  try {
    const existing = loadMaintenanceMasters()
    const updated = existing.map((master) => {
      if (master.step === step) {
        const newTask: MaintenanceTask = {
          id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          taskName,
          step,
          createdAt: new Date().toISOString(),
        }
        return {
          ...master,
          tasks: [...(master.tasks || []), newTask],
          updatedAt: new Date().toISOString(),
        }
      }
      return master
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (error) {
    console.error('Failed to add task:', error)
    return loadMaintenanceMasters()
  }
}

export const updateTask = (step: string, taskId: string, taskName: string): MaintenanceMasterData[] => {
  try {
    const existing = loadMaintenanceMasters()
    const updated = existing.map((master) => {
      if (master.step === step) {
        return {
          ...master,
          tasks: master.tasks.map((task) =>
            task.id === taskId ? { ...task, taskName, updatedAt: new Date().toISOString() } : task
          ),
          updatedAt: new Date().toISOString(),
        }
      }
      return master
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (error) {
    console.error('Failed to update task:', error)
    return loadMaintenanceMasters()
  }
}

export const deleteTask = (step: string, taskId: string): MaintenanceMasterData[] => {
  try {
    const existing = loadMaintenanceMasters()
    const updated = existing.map((master) => {
      if (master.step === step) {
        return {
          ...master,
          tasks: master.tasks.filter((task) => task.id !== taskId),
          updatedAt: new Date().toISOString(),
        }
      }
      return master
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch (error) {
    console.error('Failed to delete task:', error)
    return loadMaintenanceMasters()
  }
}

