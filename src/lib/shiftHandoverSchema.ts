import { z } from 'zod'

export const shiftHandoverLineItemSchema = z.object({
  machineName: z.string().min(1, 'Machine name is required'),
  shift: z.string().min(1, 'Shift is required'),
  operatorName: z.string().min(1, 'Operator name is required'),
  runningItemDescription: z.string().min(1, 'Running item is required'),
  targetQty: z.string().min(1, 'Target quantity is required'),
  completedQty: z.string().min(1, 'Completed quantity is required'),
  manualWorkDone: z.string().optional(),
  issue: z.string().optional(),
  nextAction: z.string().optional(),
  operatorSign: z.string().optional(),
})

export const shiftHandoverSchema = z.object({
  reportNumber: z.string().min(1, 'Report number is required'),
  date: z.string().min(1, 'Date is required'),
  productionShift: z.enum(['Day', 'Night', 'General']).default('Day'),
  items: z.array(shiftHandoverLineItemSchema).min(1, 'Add at least one line'),
  note: z.string().optional(),
  dayShiftInCharge: z.string().optional(),
  nightShiftInCharge: z.string().optional(),
  productionManager: z.string().optional(),
})

export type ShiftHandoverFormData = z.infer<typeof shiftHandoverSchema>
export type ShiftHandoverLineItem = z.infer<typeof shiftHandoverLineItemSchema>

export const generateShiftHandoverNumber = () => `SH-${Date.now().toString().slice(-6)}`








