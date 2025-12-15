export interface RMInspectionParameter {
  parameter: string
  requiredValue: string
  observation: string
  status: string
  checkBy: string
  approveBy: string
}

export interface InProcessInspectionItem {
  srNo: number
  description: string
  actualValue: string
  toler: string
  acceptanceValueMin: string
  acceptanceValueMax: string
  measuredValue1: string
  measuredValue2: string
  measuredValue3: string
  measuredValue4: string
  instrUsed: string
  result: string
  checkBy: string
}

export interface QCInspectionReport {
  id: string
  createdAt: string
  
  // RM INSPECTION
  rmInspection: {
    parameters: RMInspectionParameter[]
    jobCardNo: string
    date: string
    materialSpecification: string
    remarks: string
  }
  
  // IN PROCESS INSPECTION
  inProcessInspection: {
    isoStandard: string
    orderQty: string
    checkedQty: string
    measurementUnit: string
    customer: string
    itemName: string
    material: string
    items: InProcessInspectionItem[]
  }
  
  // FINAL INSPECTION
  finalInspection: {
    items: InProcessInspectionItem[]
  }
  
  // FINAL RESULTS
  finalResults: {
    finalResult: string
    hardening: string
    grinding: string
    surfaceTreatment: string
    aestheticAppearance: string
  }
  
  remarks: string
  preparedBy: string
  approvedBy: string
}

const STORAGE_KEY = 'qc_inspection_reports'

export function loadQCReports(): QCInspectionReport[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error('Error loading QC reports:', error)
    return []
  }
}

export function saveQCReport(report: QCInspectionReport): void {
  try {
    const reports = loadQCReports()
    const existingIndex = reports.findIndex((r) => r.id === report.id)
    
    if (existingIndex >= 0) {
      reports[existingIndex] = report
    } else {
      reports.push(report)
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
  } catch (error) {
    console.error('Error saving QC report:', error)
    throw error
  }
}

export function deleteQCReport(id: string): QCInspectionReport[] {
  try {
    const reports = loadQCReports()
    const filtered = reports.filter((r) => r.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return filtered
  } catch (error) {
    console.error('Error deleting QC report:', error)
    throw error
  }
}

export function getQCReport(id: string): QCInspectionReport | null {
  const reports = loadQCReports()
  return reports.find((r) => r.id === id) || null
}

export function createQCReport(data: Omit<QCInspectionReport, 'id' | 'createdAt'>): QCInspectionReport {
  const report: QCInspectionReport = {
    ...data,
    id: `qc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  }
  saveQCReport(report)
  return report
}

