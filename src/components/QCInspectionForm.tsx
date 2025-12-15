import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { QCInspectionReport, createQCReport } from '../lib/qcStorage'

const qcFormSchema = z.object({
  rmInspection: z.object({
    parameters: z.array(z.object({
      parameter: z.string(),
      requiredValue: z.string(),
      observation: z.string(),
      status: z.string(),
      checkBy: z.string(),
      approveBy: z.string(),
    })),
    jobCardNo: z.string(),
    date: z.string(),
    materialSpecification: z.string(),
    remarks: z.string(),
  }),
  inProcessInspection: z.object({
    isoStandard: z.string(),
    orderQty: z.string(),
    checkedQty: z.string(),
    measurementUnit: z.string(),
    customer: z.string(),
    itemName: z.string(),
    material: z.string(),
    items: z.array(z.object({
      srNo: z.number(),
      description: z.string(),
      actualValue: z.string(),
      toler: z.string(),
      acceptanceValueMin: z.string(),
      acceptanceValueMax: z.string(),
      measuredValue1: z.string(),
      measuredValue2: z.string(),
      measuredValue3: z.string(),
      measuredValue4: z.string(),
      instrUsed: z.string(),
      result: z.string(),
      checkBy: z.string(),
    })),
  }),
  finalInspection: z.object({
    items: z.array(z.object({
      srNo: z.number(),
      description: z.string(),
      actualValue: z.string(),
      toler: z.string(),
      acceptanceValueMin: z.string(),
      acceptanceValueMax: z.string(),
      measuredValue1: z.string(),
      measuredValue2: z.string(),
      measuredValue3: z.string(),
      measuredValue4: z.string(),
      instrUsed: z.string(),
      result: z.string(),
      checkBy: z.string(),
    })),
  }),
  finalResults: z.object({
    finalResult: z.string(),
    hardening: z.string(),
    grinding: z.string(),
    surfaceTreatment: z.string(),
    aestheticAppearance: z.string(),
  }),
  remarks: z.string(),
  preparedBy: z.string(),
  approvedBy: z.string(),
})

type QCFormData = z.infer<typeof qcFormSchema>

interface QCInspectionFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function QCInspectionForm({ onSuccess, onCancel }: QCInspectionFormProps) {
  const { register, handleSubmit, control, formState: { errors }, setValue, watch } = useForm<QCFormData>({
    resolver: zodResolver(qcFormSchema),
    defaultValues: {
      rmInspection: {
        parameters: [
          { parameter: 'Length', requiredValue: '', observation: '', status: '', checkBy: '', approveBy: '' },
          { parameter: 'Width', requiredValue: '', observation: '', status: '', checkBy: '', approveBy: '' },
          { parameter: 'Thickness', requiredValue: '', observation: '', status: '', checkBy: '', approveBy: '' },
          { parameter: 'OD', requiredValue: '', observation: '', status: '', checkBy: '', approveBy: '' },
          { parameter: 'ID', requiredValue: '', observation: '', status: '', checkBy: '', approveBy: '' },
        ],
        jobCardNo: '',
        date: new Date().toISOString().split('T')[0],
        materialSpecification: '',
        remarks: '',
      },
      inProcessInspection: {
        isoStandard: '',
        orderQty: '',
        checkedQty: '',
        measurementUnit: '',
        customer: '',
        itemName: '',
        material: '',
        items: [],
      },
      finalInspection: {
        items: [],
      },
      finalResults: {
        finalResult: '',
        hardening: '',
        grinding: '',
        surfaceTreatment: '',
        aestheticAppearance: '',
      },
      remarks: '',
      preparedBy: '',
      approvedBy: '',
    },
  })

  const {
    fields: rmParameterFields,
    append: appendRMParameter,
    remove: removeRMParameter,
  } = useFieldArray({
    control,
    name: 'rmInspection.parameters',
  })

  const {
    fields: inProcessFields,
    append: appendInProcess,
    remove: removeInProcess,
  } = useFieldArray({
    control,
    name: 'inProcessInspection.items',
  })

  const {
    fields: finalFields,
    append: appendFinal,
    remove: removeFinal,
  } = useFieldArray({
    control,
    name: 'finalInspection.items',
  })

  const onSubmit = (data: QCFormData) => {
    const report = createQCReport({
      rmInspection: data.rmInspection,
      inProcessInspection: data.inProcessInspection,
      finalInspection: data.finalInspection,
      finalResults: data.finalResults,
      remarks: data.remarks,
      preparedBy: data.preparedBy,
      approvedBy: data.approvedBy,
    })
    console.log('QC Report created:', report)
    onSuccess()
  }

  const addInProcessItem = () => {
    appendInProcess({
      srNo: inProcessFields.length + 1,
      description: '',
      actualValue: '',
      toler: '',
      acceptanceValueMin: '',
      acceptanceValueMax: '',
      measuredValue1: '',
      measuredValue2: '',
      measuredValue3: '',
      measuredValue4: '',
      instrUsed: '',
      result: '',
      checkBy: '',
    })
  }

  const addFinalItem = () => {
    appendFinal({
      srNo: finalFields.length + 1,
      description: '',
      actualValue: '',
      toler: '',
      acceptanceValueMin: '',
      acceptanceValueMax: '',
      measuredValue1: '',
      measuredValue2: '',
      measuredValue3: '',
      measuredValue4: '',
      instrUsed: '',
      result: '',
      checkBy: '',
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* RM INSPECTION Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-bold mb-4 text-center">RM INSPECTION</h2>
        <div className="space-y-4">
          <div className="mb-4">
            <Label>MATERIAL SPECIFICATION:-</Label>
            <Input {...register('rmInspection.materialSpecification')} placeholder="Enter material specification" />
          </div>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label>JOB CARD NO:-</Label>
              <Input {...register('rmInspection.jobCardNo')} />
            </div>
            <div className="flex-1">
              <Label>DATE:-</Label>
              <Input type="date" {...register('rmInspection.date')} />
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="p-2 text-left border-r">PARAMETER</th>
                  <th className="p-2 text-left border-r">REQUIRED VALUE</th>
                  <th className="p-2 text-left border-r">OBSERVATION</th>
                  <th className="p-2 text-left border-r">STATUS</th>
                  <th className="p-2 text-left border-r">CHECK BY</th>
                  <th className="p-2 text-left border-r">APPROVE BY</th>
                  <th className="p-2 text-left">REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {rmParameterFields.map((field, index) => (
                  <tr key={field.id} className="border-b last:border-b-0">
                    <td className="p-2 border-r">
                      <Input
                        {...register(`rmInspection.parameters.${index}.parameter`)}
                        className="font-medium border-0 focus-visible:ring-0"
                        readOnly
                      />
                    </td>
                    <td className="p-2 border-r">
                      <Input {...register(`rmInspection.parameters.${index}.requiredValue`)} className="border-0 focus-visible:ring-0" />
                    </td>
                    <td className="p-2 border-r">
                      <Input {...register(`rmInspection.parameters.${index}.observation`)} className="border-0 focus-visible:ring-0" />
                    </td>
                    <td className="p-2 border-r">
                      <Input {...register(`rmInspection.parameters.${index}.status`)} className="border-0 focus-visible:ring-0" />
                    </td>
                    <td className="p-2 border-r">
                      <Input {...register(`rmInspection.parameters.${index}.checkBy`)} className="border-0 focus-visible:ring-0" />
                    </td>
                    <td className="p-2 border-r">
                      <Input {...register(`rmInspection.parameters.${index}.approveBy`)} className="border-0 focus-visible:ring-0" />
                    </td>
                    {index === 0 && (
                      <td className="p-2 align-top" rowSpan={rmParameterFields.length}>
                        <Textarea
                          {...register('rmInspection.remarks')}
                          className="h-full min-h-[150px] border-0 focus-visible:ring-0 resize-none"
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* IN PROCESS INSPECTION Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-bold mb-4 text-center">IN PROCESS INSPECTION</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>ISO STANDARD</Label>
              <Input {...register('inProcessInspection.isoStandard')} />
            </div>
            <div>
              <Label>ORDER QTY</Label>
              <Input {...register('inProcessInspection.orderQty')} />
            </div>
            <div>
              <Label>CHECKED QTY</Label>
              <Input {...register('inProcessInspection.checkedQty')} />
            </div>
            <div>
              <Label>MEASUREMENT UNIT</Label>
              <Input {...register('inProcessInspection.measurementUnit')} />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>CUSTOMER</Label>
              <Input {...register('inProcessInspection.customer')} />
            </div>
            <div>
              <Label>ITEM NAME</Label>
              <Input {...register('inProcessInspection.itemName')} />
            </div>
            <div>
              <Label>MATERIAL</Label>
              <Input {...register('inProcessInspection.material')} />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Inspection Items</h3>
              <Button type="button" onClick={addInProcessItem} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            
            {inProcessFields.length > 0 && (
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-2 border" rowSpan={2}>Sr. No</th>
                      <th className="p-2 border" colSpan={2} rowSpan={2}>DESCRIPTION</th>
                      <th className="p-2 border" rowSpan={2}>ACTUAL VALUE</th>
                      <th className="p-2 border" rowSpan={2}>TOLER</th>
                      <th className="p-2 border" colSpan={2}>ACCEPTANCE VALUE</th>
                      <th className="p-2 border" colSpan={4}>MEASURED VALUE</th>
                      <th className="p-2 border" rowSpan={2}>INSTR. USED</th>
                      <th className="p-2 border" rowSpan={2}>RESULT</th>
                      <th className="p-2 border" rowSpan={2}>CHECK BY</th>
                      <th className="p-2 border" rowSpan={2}>Actions</th>
                    </tr>
                    <tr>
                      <th className="p-2 border">MIN</th>
                      <th className="p-2 border">MAX</th>
                      <th className="p-2 border">1</th>
                      <th className="p-2 border">2</th>
                      <th className="p-2 border">3</th>
                      <th className="p-2 border">4</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inProcessFields.map((field, index) => (
                      <tr key={field.id}>
                        <td className="p-2 border">
                          <Input
                            type="number"
                            {...register(`inProcessInspection.items.${index}.srNo`, { valueAsNumber: true })}
                            className="w-16 border-0 focus-visible:ring-0"
                          />
                        </td>
                        <td className="p-2 border" colSpan={2}>
                          <Input {...register(`inProcessInspection.items.${index}.description`)} className="border-0 focus-visible:ring-0" />
                        </td>
                        <td className="p-2 border">
                          <Input {...register(`inProcessInspection.items.${index}.actualValue`)} className="border-0 focus-visible:ring-0" />
                        </td>
                        <td className="p-2 border">
                          <Input {...register(`inProcessInspection.items.${index}.toler`)} className="border-0 focus-visible:ring-0" />
                        </td>
                        <td className="p-2 border">
                          <Input {...register(`inProcessInspection.items.${index}.acceptanceValueMin`)} placeholder="MIN" className="border-0 focus-visible:ring-0" />
                        </td>
                        <td className="p-2 border">
                          <Input {...register(`inProcessInspection.items.${index}.acceptanceValueMax`)} placeholder="MAX" className="border-0 focus-visible:ring-0" />
                        </td>
                        <td className="p-2 border">
                          <Input {...register(`inProcessInspection.items.${index}.measuredValue1`)} className="w-16 border-0 focus-visible:ring-0" />
                        </td>
                        <td className="p-2 border">
                          <Input {...register(`inProcessInspection.items.${index}.measuredValue2`)} className="w-16 border-0 focus-visible:ring-0" />
                        </td>
                        <td className="p-2 border">
                          <Input {...register(`inProcessInspection.items.${index}.measuredValue3`)} className="w-16 border-0 focus-visible:ring-0" />
                        </td>
                        <td className="p-2 border">
                          <Input {...register(`inProcessInspection.items.${index}.measuredValue4`)} className="w-16 border-0 focus-visible:ring-0" />
                        </td>
                        <td className="p-2 border">
                          <Input {...register(`inProcessInspection.items.${index}.instrUsed`)} className="border-0 focus-visible:ring-0" />
                        </td>
                        <td className="p-2 border">
                          <Input {...register(`inProcessInspection.items.${index}.result`)} className="border-0 focus-visible:ring-0" />
                        </td>
                        <td className="p-2 border">
                          <Input {...register(`inProcessInspection.items.${index}.checkBy`)} className="border-0 focus-visible:ring-0" />
                        </td>
                        <td className="p-2 border">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInProcess(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FINAL INSPECTION Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-bold mb-4 text-center bg-slate-100 p-2">FINAL INSPECTION</h2>
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Final Inspection Items</h3>
            <Button type="button" onClick={addFinalItem} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>
          
          {finalFields.length > 0 && (
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-2 border" rowSpan={2}>Sr. No</th>
                    <th className="p-2 border" colSpan={2} rowSpan={2}>DESCRIPTION</th>
                    <th className="p-2 border" rowSpan={2}>ACTUAL VALUE</th>
                    <th className="p-2 border" rowSpan={2}>TOLER</th>
                    <th className="p-2 border" colSpan={2}>ACCEPTANCE VALUE</th>
                    <th className="p-2 border" colSpan={4}>MEASURED VALUE</th>
                    <th className="p-2 border" rowSpan={2}>INSTR. USED</th>
                    <th className="p-2 border" rowSpan={2}>RESULT</th>
                    <th className="p-2 border" rowSpan={2}>CHECK BY</th>
                    <th className="p-2 border" rowSpan={2}>Actions</th>
                  </tr>
                  <tr>
                    <th className="p-2 border">MIN</th>
                    <th className="p-2 border">MAX</th>
                    <th className="p-2 border">1</th>
                    <th className="p-2 border">2</th>
                    <th className="p-2 border">3</th>
                    <th className="p-2 border">4</th>
                  </tr>
                </thead>
                <tbody>
                  {finalFields.map((field, index) => (
                    <tr key={field.id}>
                      <td className="p-2 border">
                        <Input
                          type="number"
                          {...register(`finalInspection.items.${index}.srNo`, { valueAsNumber: true })}
                          className="w-16 border-0 focus-visible:ring-0"
                        />
                      </td>
                      <td className="p-2 border" colSpan={2}>
                        <Input {...register(`finalInspection.items.${index}.description`)} className="border-0 focus-visible:ring-0" />
                      </td>
                      <td className="p-2 border">
                        <Input {...register(`finalInspection.items.${index}.actualValue`)} className="border-0 focus-visible:ring-0" />
                      </td>
                      <td className="p-2 border">
                        <Input {...register(`finalInspection.items.${index}.toler`)} className="border-0 focus-visible:ring-0" />
                      </td>
                      <td className="p-2 border">
                        <Input {...register(`finalInspection.items.${index}.acceptanceValueMin`)} placeholder="MIN" className="border-0 focus-visible:ring-0" />
                      </td>
                      <td className="p-2 border">
                        <Input {...register(`finalInspection.items.${index}.acceptanceValueMax`)} placeholder="MAX" className="border-0 focus-visible:ring-0" />
                      </td>
                      <td className="p-2 border">
                        <Input {...register(`finalInspection.items.${index}.measuredValue1`)} className="w-16 border-0 focus-visible:ring-0" />
                      </td>
                      <td className="p-2 border">
                        <Input {...register(`finalInspection.items.${index}.measuredValue2`)} className="w-16 border-0 focus-visible:ring-0" />
                      </td>
                      <td className="p-2 border">
                        <Input {...register(`finalInspection.items.${index}.measuredValue3`)} className="w-16 border-0 focus-visible:ring-0" />
                      </td>
                      <td className="p-2 border">
                        <Input {...register(`finalInspection.items.${index}.measuredValue4`)} className="w-16 border-0 focus-visible:ring-0" />
                      </td>
                      <td className="p-2 border">
                        <Input {...register(`finalInspection.items.${index}.instrUsed`)} className="border-0 focus-visible:ring-0" />
                      </td>
                      <td className="p-2 border">
                        <Input {...register(`finalInspection.items.${index}.result`)} className="border-0 focus-visible:ring-0" />
                      </td>
                      <td className="p-2 border">
                        <Input {...register(`finalInspection.items.${index}.checkBy`)} className="border-0 focus-visible:ring-0" />
                      </td>
                      <td className="p-2 border">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFinal(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* FINAL RESULTS Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="font-bold mb-4">FINAL RESULTS</h3>
        <div className="grid grid-cols-5 gap-4">
          <div>
            <Label>FINAL RESULT</Label>
            <Input {...register('finalResults.finalResult')} />
          </div>
          <div>
            <Label>HARDENING</Label>
            <Input {...register('finalResults.hardening')} />
          </div>
          <div>
            <Label>GRINDING</Label>
            <Input {...register('finalResults.grinding')} />
          </div>
          <div>
            <Label>SURFACE TREATMENT</Label>
            <Input {...register('finalResults.surfaceTreatment')} />
          </div>
          <div>
            <Label>AESTHETIC APPEARANCE</Label>
            <Input {...register('finalResults.aestheticAppearance')} />
          </div>
        </div>
      </div>

      {/* REMARKS */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <Label>REMARK</Label>
        <Textarea {...register('remarks')} className="mt-2" rows={3} />
      </div>

      {/* PREPARED BY / APPROVED BY */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>PREPARED BY</Label>
            <Input {...register('preparedBy')} />
          </div>
          <div>
            <Label>APPROVED BY</Label>
            <Input {...register('approvedBy')} />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Submit Report
        </Button>
      </div>
    </form>
  )
}

