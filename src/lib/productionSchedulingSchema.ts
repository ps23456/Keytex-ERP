import { z } from 'zod'

export const productionSchedulingSchema = z.object({
  serialNumber: z.string().optional(),
  operatorName: z.string().min(1, 'Operator name is required'),
  date: z.string().min(1, 'Date is required'),
  shift: z.string().min(1, 'Shift is required'),
  productDescription: z.string().min(1, 'Product description is required'),
  totalShiftHours: z.coerce.number().nonnegative('Enter shift hours'),
  totalQty: z.coerce.number().nonnegative('Total qty required'),
  targetQty: z.coerce.number().nonnegative('Target qty required'),
  numberOfSetups: z.coerce.number().nonnegative().default(0),
  settingTimeMinutes: z.coerce.number().nonnegative().default(0),
  programSettingTimeMinutes: z.coerce.number().nonnegative().default(0),
  cycleTimeMinutes: z.coerce.number().nonnegative().default(0),
  loadingUnloadingTimeMinutes: z.coerce.number().nonnegative().default(0),
  lunchTimeMinutes: z.coerce.number().nonnegative().default(0),
  effectiveTimeHours: z.coerce.number().nonnegative().default(0),
  producedQty: z.coerce.number().nonnegative().default(0),
  reworkMaterialQty: z.coerce.number().nonnegative().default(0),
  rejectionMaterialQty: z.coerce.number().nonnegative().default(0),
  remarks: z.string().optional(),
})

export type ProductionSchedulingFormData = z.infer<typeof productionSchedulingSchema>

export interface ProductionSchedulingMetrics {
  balanceQty: number
  totalSettingTimeHour: number
  totalCycleTimeMinutes: number
  timePerPieceHour: number
  targetTimeHour: number
}

export const safeNumber = (value?: number) =>
  typeof value === 'number' && !Number.isNaN(value) ? value : 0

export const calculateSchedulingMetrics = (
  data: Partial<ProductionSchedulingFormData>
): ProductionSchedulingMetrics => {
  const totalQty = safeNumber(data.totalQty)
  const targetQty = safeNumber(data.targetQty)
  const settingTime = safeNumber(data.settingTimeMinutes)
  const programSettingTime = safeNumber(data.programSettingTimeMinutes)
  const cycleTime = safeNumber(data.cycleTimeMinutes)
  const loadingTime = safeNumber(data.loadingUnloadingTimeMinutes)

  const balanceQty = totalQty - targetQty
  const totalSettingTimeHour = (settingTime + programSettingTime) / 60
  const totalCycleTimeMinutes = cycleTime + loadingTime
  const timePerPieceHour = cycleTime / 60
  const targetTimeHour = targetQty * timePerPieceHour

  return {
    balanceQty,
    totalSettingTimeHour,
    totalCycleTimeMinutes,
    timePerPieceHour,
    targetTimeHour,
  }
}


