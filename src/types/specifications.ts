export interface SpecificationOperationBreakdown {
  key: string
  label: string
  value: number
}

export interface SpecificationCostBreakdown {
  totalCost: number
  materialCost: number
  operationsCost: number
  rawMaterialSize: number
  rawMaterialPrice: number
  operations: SpecificationOperationBreakdown[]
}

