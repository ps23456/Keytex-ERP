import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { useMasters } from '../hooks/useMasters'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import {
  ArrowLeft,
  Send,
  FileDown,
  Calendar,
  Clock,
  Phone,
  Mail,
  Plus,
  ChevronDown,
  MessageCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { getJobCardTemplate, initializeJobCardTemplates } from '../lib/jobCardTemplates'

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-slate-100 text-slate-700',
  Sent: 'bg-blue-100 text-blue-700',
  Accepted: 'bg-green-100 text-green-700',
  Expired: 'bg-rose-100 text-rose-700',
}

const STATUS_OPTIONS = ['Draft', 'Sent', 'Accepted', 'Expired']

const FOLLOW_UP_TYPES = ['Phone Call', 'Email', 'Meeting', 'WhatsApp']

const FOLLOW_UP_ICONS: Record<string, JSX.Element> = {
  'Phone Call': <Phone className="h-4 w-4" />,
  Email: <Mail className="h-4 w-4" />,
  Meeting: <Calendar className="h-4 w-4" />,
  WhatsApp: <MessageCircle className="h-4 w-4" />,
}

export default function QuotationDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { records, updateRecord } = useMasters('quotation')

  // Initialize job card templates
  useEffect(() => {
    initializeJobCardTemplates()
  }, [])

  const quotation = useMemo(() => {
    return records.find((record: any) => {
      const recordId = record.id || record.quotation_id || record.quotationId
      return recordId === id
    })
  }, [records, id])

  if (!quotation) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Quotation Not Found</h1>
            <Button variant="outline" onClick={() => navigate('/quotations')}>
              Back to Quotations
            </Button>
          </div>
          <div className="bg-white border rounded-lg shadow-sm p-6 text-muted-foreground">
            The quotation you are looking for does not exist or may have been removed.
          </div>
        </div>
      </MainLayout>
    )
  }

  const amount = typeof quotation.totalAmount === 'number' ? quotation.totalAmount : 0
  const formattedDate = quotation.quotationDate ? format(new Date(quotation.quotationDate), 'MMM d, yyyy') : '-'
  const validUntil = quotation.validUntil ? format(new Date(quotation.validUntil), 'MMM d, yyyy') : '-'
  const recordId = quotation.id || quotation.quotation_id || quotation.quotationId

  const subtotal = Array.isArray(quotation.items)
    ? quotation.items.reduce((sum: number, item: any) => {
        const qty = parseFloat(item.quantity || '0') || 0
        const price = parseFloat(item.price || '0') || 0
        return sum + qty * price
      }, 0)
    : amount
  const gstAmount = subtotal * 0.18
  const totalAmount = subtotal + gstAmount

  const initialFollowUps = useMemo(() => {
    if (Array.isArray((quotation as any).followUpHistory)) {
      return (quotation as any).followUpHistory
    }
    return []
  }, [quotation])

  const [followUps, setFollowUps] = useState<any[]>(initialFollowUps)
  const [newFollowUp, setNewFollowUp] = useState({
    date: '',
    time: '',
    type: FOLLOW_UP_TYPES[0],
    description: '',
    nextAction: '',
  })

  useEffect(() => {
    setFollowUps(initialFollowUps)
  }, [initialFollowUps])

  const handleStatusChange = async (newStatus: string) => {
    if (!recordId || quotation.status === newStatus) return
    await updateRecord({
      id: String(recordId),
      data: {
        ...quotation,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      },
    })
  }

  const handleAddFollowUp = async () => {
    if (!recordId || !newFollowUp.date || !newFollowUp.time) return
    const entry = {
      ...newFollowUp,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    }
    const updatedHistory = [...followUps, entry]
    setFollowUps(updatedHistory)
    setNewFollowUp({
      date: '',
      time: '',
      type: FOLLOW_UP_TYPES[0],
      description: '',
      nextAction: '',
    })

    await updateRecord({
      id: String(recordId),
      data: {
        ...quotation,
        followUps: updatedHistory.length,
        followUpHistory: updatedHistory,
        updatedAt: new Date().toISOString(),
      },
    })
  }

  const followUpsCount = followUps.length || quotation.followUps || 0
  const statusLabel = quotation.status || 'Draft'
  const statusClasses = STATUS_COLORS[statusLabel] || STATUS_COLORS.Draft
  const isExpired = quotation.validUntil ? new Date(quotation.validUntil) < new Date() : false

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-900"
              onClick={() => navigate('/quotations')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Quotation #{quotation.quotationNumber || ''}
              </h1>
              <p className="text-gray-600 mt-1">Created on {formattedDate}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 px-4 flex items-center space-x-2">
                  <span>{statusLabel}</span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuRadioGroup value={statusLabel} onValueChange={handleStatusChange}>
                  {STATUS_OPTIONS.map((status) => (
                    <DropdownMenuRadioItem key={status} value={status} className="capitalize">
                      {status}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="default" className="h-10 px-4 flex items-center space-x-2">
              <Send className="h-4 w-4" />
              <span>Send</span>
            </Button>
            <Button variant="outline" className="h-10 px-4 flex items-center space-x-2">
              <FileDown className="h-4 w-4" />
              <span>PDF</span>
            </Button>
            <Button variant="outline" className="h-10 px-4" onClick={() => navigate(`/quotations/${id}/edit`)}>
              Edit
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[2fr_1fr] gap-6 items-start">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <p className="uppercase text-xs tracking-[0.3em] text-blue-100 font-semibold">Quotation</p>
                <h2 className="text-2xl font-bold">Quotation #{quotation.quotationNumber || ''}</h2>
                <div className="flex items-center space-x-3 text-sm text-blue-100 pt-2">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Date: {formattedDate}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Quote No: {quotation.quotationNumber || '-'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClasses}`}>
                  {statusLabel}
                </span>
                {isExpired && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                    Expired
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 space-y-2">
                  <div className="text-sm font-semibold text-emerald-700 flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>To:</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">{quotation.companyName || '-'}</p>
                  <p className="text-sm text-slate-600 whitespace-pre-line">{quotation.address || ''}</p>
                  {quotation.contactPerson && (
                    <p className="text-sm font-medium text-emerald-700">Kind Attn: {quotation.contactPerson}</p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                  <div className="text-sm font-semibold text-slate-700">Contact Details</div>
                  <div className="space-y-2 text-sm text-slate-600">
                    {quotation.contactPerson && <div>{quotation.contactPerson}</div>}
                    {quotation.contactPhone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>{quotation.contactPhone}</span>
                      </div>
                    )}
                    {quotation.contactEmail && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>{quotation.contactEmail}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Valid Until: {validUntil}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-blue-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-blue-600 text-white uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left w-12">Item No.</th>
                      <th className="px-4 py-3 text-left">Part Name</th>
                      <th className="px-4 py-3 text-left">Material</th>
                      <th className="px-4 py-3 text-left">Quantity</th>
                      <th className="px-4 py-3 text-left">Price/No INR</th>
                      <th className="px-4 py-3 text-left">Total INR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(quotation.items) &&
                      quotation.items.map((item: any, index: number) => {
                        const qty = parseFloat(item.quantity || '0') || 0
                        const price = parseFloat(item.price || '0') || 0
                        const lineTotal = qty * price
                        return (
                          <tr key={`${item.partName}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50/40'}>
                            <td className="px-4 py-3 font-medium">{index + 1}</td>
                            <td className="px-4 py-3">{item.partName || '-'}</td>
                            <td className="px-4 py-3">{item.material || '-'}</td>
                            <td className="px-4 py-3">{qty}</td>
                            <td className="px-4 py-3">
                              ₹ {price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              ₹ {lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4 py-4 border-t border-blue-100 gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-slate-600">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Subtotal:</span>
                      <span>
                        ₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">GST (18%):</span>
                      <span>
                        ₹ {gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-3 text-blue-700 font-semibold text-lg">
                    Total: ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-sm text-rose-600 font-medium">
                <Calendar className="h-4 w-4" />
                <span>Valid until: {validUntil}</span>
              </div>

              {Array.isArray(quotation.terms) && quotation.terms.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-slate-800 uppercase">Terms & Conditions</h3>
                  <div className="space-y-2 text-sm text-slate-700">
                    {quotation.terms.map((term: any, index: number) => (
                      <div key={`${term.title}-${index}`} className="flex space-x-3">
                        <span className="font-bold text-blue-700">{index + 1}.</span>
                        <div>
                          <span className="font-semibold">{term.title}:</span> {term.value || '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Job Card Template Information */}
              {quotation.inquiryData?.products && quotation.inquiryData.products.length > 0 && (
                <div className="space-y-4 border-t border-slate-200 pt-4">
                  <h3 className="text-lg font-semibold text-slate-800">Job Card Templates & Manufacturing Specifications</h3>
                  <div className="space-y-4">
                    {quotation.inquiryData.products.map((product: any, productIndex: number) => {
                      const template = product.jobCardTemplateId ? getJobCardTemplate(product.jobCardTemplateId) : null
                      const operationFields = product.operationFields || {}
                      
                      return (
                        <div key={productIndex} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <h4 className="font-semibold text-sm mb-3">
                            Product {productIndex + 1}: {product.itemName || quotation.items?.[productIndex]?.partName || '-'}
                          </h4>
                          {template ? (
                            <div className="space-y-3">
                              <div>
                                <span className="text-xs text-slate-500 font-medium uppercase">Job Card Template:</span>
                                <p className="text-sm font-semibold text-slate-700">{template.template_name}</p>
                              </div>
                              {Object.keys(operationFields).length > 0 && (
                                <div>
                                  <span className="text-xs text-slate-500 font-medium uppercase block mb-2">Operation Fields:</span>
                                  <div className="grid md:grid-cols-2 gap-3">
                                    {template.operations.map((op) => {
                                      const value = operationFields[op.key] || '-'
                                      return value !== '-' ? (
                                        <div key={op.key} className="text-sm">
                                          <span className="text-slate-600 font-medium">{op.label}:</span>
                                          <span className="ml-2 text-slate-700">{value}</span>
                                        </div>
                                      ) : null
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">No job card template selected</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {quotation.notes && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-800">Additional Notes</h3>
                  <p className="text-sm text-slate-600 whitespace-pre-line">{quotation.notes}</p>
                </div>
              )}

              <div className="text-center text-sm font-semibold text-slate-800 space-y-1 pt-2 border-t border-slate-200">
                <div>
                  The above offer are quite reasonable & inline with your requirement. Now we look forward to the pleasure
                  of receiving your valued order soon.
                </div>
                <div>Thanking You.</div>
                <div>FOR</div>
                <div>KEYTEX MACHINES</div>
                <div>ANKUR C. PATEL</div>
                <div>+91 99789 22288</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Follow-ups</h3>
                  <p className="text-sm text-slate-500">{followUpsCount} follow-up{followUpsCount === 1 ? '' : 's'}</p>
                </div>
                <Button variant="outline" size="sm" className="flex items-center space-x-2" onClick={handleAddFollowUp}>
                  <Plus className="h-4 w-4" />
                  <span>Add</span>
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500 font-medium uppercase">Date</Label>
                  <Input
                    type="date"
                    value={newFollowUp.date}
                    onChange={(e) => setNewFollowUp((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500 font-medium uppercase">Time</Label>
                  <Input
                    type="time"
                    value={newFollowUp.time}
                    onChange={(e) => setNewFollowUp((prev) => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500 font-medium uppercase">Type</Label>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newFollowUp.type}
                  onChange={(e) => setNewFollowUp((prev) => ({ ...prev, type: e.target.value }))}
                >
                  {FOLLOW_UP_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500 font-medium uppercase">Description</Label>
                <Textarea
                  rows={2}
                  value={newFollowUp.description}
                  onChange={(e) => setNewFollowUp((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the follow-up activity..."
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500 font-medium uppercase">Next Action</Label>
                <Input
                  placeholder="What needs to be done next?"
                  value={newFollowUp.nextAction}
                  onChange={(e) => setNewFollowUp((prev) => ({ ...prev, nextAction: e.target.value }))}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setNewFollowUp({
                      date: '',
                      time: '',
                      type: FOLLOW_UP_TYPES[0],
                      description: '',
                      nextAction: '',
                    })
                  }
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddFollowUp} disabled={!newFollowUp.date || !newFollowUp.time}>
                  Add Follow-up
                </Button>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-200">
                {followUps.length === 0 ? (
                  <div className="text-sm text-slate-500">No follow-ups recorded yet.</div>
                ) : (
                  followUps
                    .slice()
                    .reverse()
                    .map((followUp) => (
                      <div key={followUp.id} className="border border-slate-200 rounded-xl p-4 space-y-2 bg-slate-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700">
                              {FOLLOW_UP_ICONS[followUp.type] || <Phone className="h-4 w-4" />}
                            </span>
                            <span>{followUp.type}</span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center space-x-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {followUp.date}
                              {followUp.time ? ` at ${followUp.time}` : ''}
                            </span>
                          </div>
                        </div>
                        {followUp.description && (
                          <p className="text-sm text-slate-600">{followUp.description}</p>
                        )}
                        {followUp.nextAction && (
                          <p className="text-xs text-blue-600 font-medium">Next: {followUp.nextAction}</p>
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
