export interface JobCardOperation {
  key: string
  label: string
  type: 'text' | 'number' | 'textarea'
  required?: boolean
}

export interface JobCardTemplate {
  template_id: string
  template_name: string
  template_code: string
  description: string
  operations: JobCardOperation[]
  status: 'Active' | 'Inactive'
}

// Define operations for each job card type based on the images
export const JOB_CARD_TEMPLATES: JobCardTemplate[] = [
  {
    template_id: 'common_job_card',
    template_name: 'Common Job Card',
    template_code: 'CJC',
    description: 'Standard job card with common operations',
    status: 'Active',
    operations: [
      { key: 'rmCutting', label: 'RM CUTTING', type: 'text' },
      { key: 'vmcSide1', label: 'VMC SIDE 1', type: 'text' },
      { key: 'vmcSide2', label: 'VMC SIDE 2', type: 'text' },
      { key: 'vmcSide3', label: 'VMC SIDE 3', type: 'text' },
      { key: 'vmcSide4', label: 'VMC SIDE 4', type: 'text' },
      { key: 'vmcSide5', label: 'VMC SIDE 5', type: 'text' },
      { key: 'oiling', label: 'OILING', type: 'text' },
      { key: 'outsource', label: 'OUTSOURCE', type: 'text' },
      { key: 'grinding', label: 'GRAINDING', type: 'text' },
      { key: 'manual', label: 'MANUAL', type: 'text' },
      { key: 'assembly', label: 'ASEMBLY', type: 'text' },
      { key: 'wireCutting', label: 'WIRE CUTTING', type: 'text' },
      { key: 'aesthetic', label: 'ASTHETIC', type: 'text' },
      { key: 'packing', label: 'PACKING', type: 'text' },
    ],
  },
  {
    template_id: 'double_body_die_cutting',
    template_name: 'Double Body Die Cutting Job Card',
    template_code: 'DBDC',
    description: 'Job card for double body die cutting operations',
    status: 'Active',
    operations: [
      { key: 'rawMaterial', label: 'RAW MATERIAL', type: 'text' },
      { key: 'latheR1', label: 'LATHE R1', type: 'text' },
      { key: 'latheR2', label: 'LATHE R2', type: 'text' },
      { key: 'cncSide1', label: 'CNC SIDE 1', type: 'text' },
      { key: 'cncSide2', label: 'CNC SIDE 2', type: 'text' },
      { key: 'vmcSide1', label: 'VMC SIDE 1', type: 'text' },
      { key: 'drillTapping', label: 'DRILL & TAPPING', type: 'text' },
      { key: 'outsource', label: 'OUTSOURCE', type: 'text' },
      { key: 'inductionHardening', label: 'INDUCTION HARDENING', type: 'text' },
      { key: 'cylindricalG1', label: 'CYLINDRICAL G1', type: 'text' },
      { key: 'vmcSide2', label: 'VMC SIDE 2', type: 'text' },
      { key: 'cylindricalG2', label: 'CYLINDRICAL G2', type: 'text' },
      { key: 'carving', label: 'CARVING', type: 'text' },
      { key: 'testing', label: 'TESTING', type: 'text' },
      { key: 'marking', label: 'MARKING', type: 'text' },
    ],
  },
  {
    template_id: 'double_body_die_sealing',
    template_name: 'Double Body Die Sealing Job Card',
    template_code: 'DBDS',
    description: 'Job card for double body die sealing operations',
    status: 'Active',
    operations: [
      { key: 'rawMaterial', label: 'RAW MATERIAL', type: 'text' },
      { key: 'lathe', label: 'LATHE', type: 'text' },
      { key: 'cncSide1', label: 'CNC SIDE 1', type: 'text' },
      { key: 'cncSide2', label: 'CNC SIDE 2', type: 'text' },
      { key: 'vmcSide1', label: 'VMC SIDE 1', type: 'text' },
      { key: 'drillTapping', label: 'DRILL & TAPPING', type: 'text' },
      { key: 'hardening', label: 'HARDNING', type: 'text' },
      { key: 'grinding', label: 'GRINDING', type: 'text' },
      { key: 'shrinkFit', label: 'SHRINK FIT (SHAFT)', type: 'text' },
      { key: 'cylindricalG1', label: 'CYLINDRICAL G1', type: 'text' },
      { key: 'vmcSide2', label: 'VMC SIDE 2', type: 'text' },
      { key: 'cylindricalG2', label: 'CYLINDRICAL G2', type: 'text' },
      { key: 'carving', label: 'CARVING', type: 'text' },
      { key: 'testing', label: 'TESTING', type: 'text' },
      { key: 'marking', label: 'MARKING', type: 'text' },
    ],
  },
  {
    template_id: 'single_body_die',
    template_name: 'Single Body Die Job Card',
    template_code: 'SBD',
    description: 'Job card for single body die operations',
    status: 'Active',
    operations: [
      { key: 'rawMaterial', label: 'RAW MATERIAL', type: 'text' },
      { key: 'lathe', label: 'LATHE', type: 'text' },
      { key: 'cncSide1', label: 'CNC SIDE 1', type: 'text' },
      { key: 'cncSide2', label: 'CNC SIDE 2', type: 'text' },
      { key: 'vmcSide1', label: 'VMC SIDE 1', type: 'text' },
      { key: 'drillTapping', label: 'DRILL & TAPPING', type: 'text' },
      { key: 'hardening', label: 'HARDNING', type: 'text' },
      { key: 'grinding', label: 'GRINDING', type: 'text' },
      { key: 'cylindricalG1', label: 'CYLINDRICAL G1', type: 'text' },
      { key: 'vmcSide2', label: 'VMC SIDE 2', type: 'text' },
      { key: 'cylindricalG2', label: 'CYLINDRICAL G2', type: 'text' },
      { key: 'carving', label: 'CARVING', type: 'text' },
      { key: 'testing', label: 'TESTING', type: 'text' },
      { key: 'marking', label: 'MARKING', type: 'text' },
    ],
  },
  {
    template_id: 'coller_single_die',
    template_name: 'Coller Single Die Job Card',
    template_code: 'CSD',
    description: 'Job card for coller single die operations',
    status: 'Active',
    operations: [
      { key: 'rawMaterial', label: 'RAW MATERIAL', type: 'text' },
      { key: 'lathe', label: 'LATHE', type: 'text' },
      { key: 'cncSide1', label: 'CNC SIDE 1', type: 'text' },
      { key: 'cncSide2', label: 'CNC SIDE 2', type: 'text' },
      { key: 'vmcSide1', label: 'VMC SIDE 1', type: 'text' },
      { key: 'drillTapping', label: 'DRILL & TAPPING', type: 'text' },
      { key: 'hardening', label: 'HARDENING', type: 'text' },
      { key: 'cncSide3', label: 'CNC SIDE 3', type: 'text' },
      { key: 'shrinkFit', label: 'SHRINK FIT', type: 'text' },
      { key: 'packing', label: 'PACKING', type: 'text' },
    ],
  },
]

// Initialize templates in localStorage if they don't exist
export const initializeJobCardTemplates = () => {
  const key = 'master_data_job_card_template'
  const existing = localStorage.getItem(key)
  
  if (!existing) {
    const templates = JOB_CARD_TEMPLATES.map((template) => ({
      ...template,
      operations: JSON.stringify(template.operations), // Store as JSON string
    }))
    localStorage.setItem(key, JSON.stringify(templates))
  }
}

// Get template by ID (from master data)
export const getJobCardTemplate = (templateId: string): JobCardTemplate | null => {
  const key = 'master_data_job_card_template'
  const data = localStorage.getItem(key)
  if (!data) {
    // If no master data, try to find in predefined templates
    const template = JOB_CARD_TEMPLATES.find(t => t.template_id === templateId)
    return template || null
  }
  
  const templates = JSON.parse(data)
  const template = templates.find((t: any) => (t.template_id === templateId) || (t.id === templateId))
  
  if (!template) {
    // Fallback to predefined templates
    const predefinedTemplate = JOB_CARD_TEMPLATES.find(t => t.template_id === templateId)
    return predefinedTemplate || null
  }
  
  let operations: any[] = []
  try {
    operations = typeof template.operations === 'string' 
      ? JSON.parse(template.operations) 
      : (template.operations || [])
  } catch (e) {
    console.error('Error parsing operations:', e)
  }
  
  return {
    template_id: template.template_id || template.id,
    template_name: template.template_name || '',
    template_code: template.template_code || '',
    description: template.description || '',
    operations: operations,
    status: template.status || 'Active',
  }
}

// Get all active templates
export const getActiveJobCardTemplates = (): JobCardTemplate[] => {
  const key = 'master_data_job_card_template'
  const data = localStorage.getItem(key)
  if (!data) {
    initializeJobCardTemplates()
    return JOB_CARD_TEMPLATES
  }
  
  const templates = JSON.parse(data)
  return templates
    .filter((t: any) => t.status === 'Active')
    .map((template: any) => ({
      ...template,
      operations: typeof template.operations === 'string' 
        ? JSON.parse(template.operations) 
        : template.operations,
    }))
}

