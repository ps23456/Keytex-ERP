import { z } from 'zod'

export const rejectionLogbookLineItemSchema = z.object({
  serialNumber: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  machineType: z.string().min(1, 'Machine type is required'),
  machineName: z.string().min(1, 'Machine name is required'),
  productionOrderNo: z.string().min(1, 'Production order number is required'),
  productDescription: z.string().min(1, 'Product description is required'),
  orderQty: z.string().min(1, 'Order quantity is required'),
  producedQty: z.string().min(1, 'Produced quantity is required'),
  rejectionQty: z.string().min(1, 'Rejection quantity is required'),
  rejectionReason: z.string().optional(),
  reworkQty: z.string().optional(),
  reworkTime: z.string().optional(),
  scrapQty: z.string().optional(),
  processStage: z.string().optional(),
  rejectionType: z.string().optional(),
  issueDescription: z.string().optional(),
  responsibility: z.string().optional(),
  remarks: z.string().optional(),
  approvedHODSign: z.string().optional(),
})

export const rejectionLogbookSchema = z.object({
  logbookNumber: z.string().min(1, 'Logbook number is required'),
  date: z.string().min(1, 'Date is required'),
  items: z.array(rejectionLogbookLineItemSchema).min(1, 'Add at least one entry'),
})

export type RejectionLogbookFormData = z.infer<typeof rejectionLogbookSchema>
export type RejectionLogbookLineItem = z.infer<typeof rejectionLogbookLineItemSchema>

export const generateRejectionLogbookNumber = () => `RL-${Date.now().toString().slice(-6)}`








