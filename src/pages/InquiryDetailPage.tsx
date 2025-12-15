import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { useMasters } from '../hooks/useMasters'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { ArrowLeft, Building, Package, Phone, Mail, MapPin, Clock, CheckCircle2, Trash2, Plus, ChevronDown } from 'lucide-react'
import { InquiryFormData } from '../components/InquiryForm'
import { getJobCardTemplate, initializeJobCardTemplates } from '../lib/jobCardTemplates'

const STATUS_OPTIONS = ['new', 'in-progress', 'quoted', 'accepted', 'rejected', 'completed']
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent']
const FOLLOWUP_TYPES = ['Call', 'Quote', 'Email', 'Meeting', 'Note']

interface FollowUp {
  id: string
  type: string
  dateTime: string
  description: string
  nextStep: string
  status: 'pending' | 'completed'
}

export default function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { records, updateRecord } = useMasters('inquiry')
  const [inquiry, setInquiry] = useState<any>(null)
  const [isFollowUpDialogOpen, setIsFollowUpDialogOpen] = useState(false)
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null)

  useEffect(() => {
    if (id && records) {
      const found = records.find((r: any) => {
        const recordId = r.id || r.inquiry_id || r.inquiryId
        return String(recordId) === String(id)
      })
      if (found) {
        setInquiry({
          ...found,
          followUps: Array.isArray(found.followUps) ? found.followUps : []
        })
      }
    }
  }, [id, records])

  const formatDate = (date: any) => {
    if (!date) return '-'
    try {
      const d = new Date(date)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + 
             ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return date
    }
  }

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || 'new'
    if (s === 'new') return 'bg-blue-100 text-blue-800'
    if (s === 'in-progress') return 'bg-yellow-100 text-yellow-800'
    if (s === 'quoted') return 'bg-purple-100 text-purple-800'
    if (s === 'accepted') return 'bg-green-100 text-green-800'
    if (s === 'rejected') return 'bg-red-100 text-red-800'
    if (s === 'completed') return 'bg-gray-100 text-gray-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: string) => {
    const p = priority?.toLowerCase() || 'low'
    if (p === 'urgent' || p === 'high') return 'bg-red-100 text-red-800'
    if (p === 'medium') return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!inquiry) return
    try {
      const recordId = inquiry.id || inquiry.inquiry_id || inquiry.inquiryId
      const updated = { ...inquiry, status: newStatus }
      await updateRecord({ id: String(recordId), data: updated })
      setInquiry(updated)
    } catch (error) {
      alert('Failed to update status')
    }
  }

  const handlePriorityChange = async (newPriority: string) => {
    if (!inquiry) return
    try {
      const recordId = inquiry.id || inquiry.inquiry_id || inquiry.inquiryId
      const updated = { ...inquiry, priority: newPriority }
      await updateRecord({ id: String(recordId), data: updated })
      setInquiry(updated)
    } catch (error) {
      alert('Failed to update priority')
    }
  }

  const handleAddFollowUp = () => {
    setEditingFollowUp(null)
    setIsFollowUpDialogOpen(true)
  }

  const handleEditFollowUp = (followUp: FollowUp) => {
    setEditingFollowUp(followUp)
    setIsFollowUpDialogOpen(true)
  }

  const handleDeleteFollowUp = async (followUpId: string) => {
    if (!inquiry) return
    try {
      const recordId = inquiry.id || inquiry.inquiry_id || inquiry.inquiryId
      const updatedFollowUps = (inquiry.followUps || []).filter((f: FollowUp) => f.id !== followUpId)
      const updated = { ...inquiry, followUps: updatedFollowUps, followUpsCount: updatedFollowUps.length }
      await updateRecord({ id: String(recordId), data: updated })
      setInquiry(updated)
    } catch (error) {
      alert('Failed to delete follow-up')
    }
  }

  const handleSaveFollowUp = async (followUpData: FollowUp) => {
    if (!inquiry) return
    try {
      const recordId = inquiry.id || inquiry.inquiry_id || inquiry.inquiryId
      const existingFollowUps = inquiry.followUps || []
      let updatedFollowUps: FollowUp[]
      
      if (editingFollowUp) {
        updatedFollowUps = existingFollowUps.map((f: FollowUp) => 
          f.id === editingFollowUp.id ? followUpData : f
        )
      } else {
        updatedFollowUps = [...existingFollowUps, { ...followUpData, id: `followup_${Date.now()}` }]
      }
      
      const updated = { 
        ...inquiry, 
        followUps: updatedFollowUps,
        followUpsCount: updatedFollowUps.length
      }
      await updateRecord({ id: String(recordId), data: updated })
      setInquiry(updated)
      setIsFollowUpDialogOpen(false)
      setEditingFollowUp(null)
    } catch (error) {
      alert('Failed to save follow-up')
    }
  }

  const toggleFollowUpStatus = async (followUpId: string) => {
    if (!inquiry) return
    try {
      const recordId = inquiry.id || inquiry.inquiry_id || inquiry.inquiryId
      const updatedFollowUps = (inquiry.followUps || []).map((f: FollowUp) => 
        f.id === followUpId ? { ...f, status: f.status === 'completed' ? 'pending' : 'completed' } : f
      )
      const updated = { ...inquiry, followUps: updatedFollowUps }
      await updateRecord({ id: String(recordId), data: updated })
      setInquiry(updated)
    } catch (error) {
      alert('Failed to update follow-up status')
    }
  }

  if (!inquiry) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading inquiry...</p>
        </div>
      </MainLayout>
    )
  }

  const inquiryNumber = inquiry.inquiryNumber || `#${id}`
  const followUps = inquiry.followUps || []

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/inquiries')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{inquiryNumber}</h1>
              <p className="text-muted-foreground">{formatDate(inquiry.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={inquiry.status || 'new'} onValueChange={handleStatusChange}>
              <SelectTrigger className={`h-9 w-32 ${getStatusColor(inquiry.status)} border-0 rounded-full`}>
                <SelectValue />
                <ChevronDown className="h-4 w-4 ml-auto" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={inquiry.priority || 'low'} onValueChange={handlePriorityChange}>
              <SelectTrigger className={`h-9 w-32 ${getPriorityColor(inquiry.priority)} border-0 rounded-full`}>
                <SelectValue />
                <ChevronDown className="h-4 w-4 ml-auto" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Company Information */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Building className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Company Information</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Company Name</Label>
                  <p className="font-medium">{inquiry.companyName || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Contact Person</Label>
                  <p className="font-medium">{inquiry.contactPerson || '-'}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p>{inquiry.contactNumber || '-'}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p>{inquiry.email || '-'}</p>
                </div>
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <p>{inquiry.address || '-'}</p>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Package className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Products ({Array.isArray(inquiry.products) ? inquiry.products.length : 0})</h2>
              </div>
              <div className="space-y-6">
                {Array.isArray(inquiry.products) && inquiry.products.length > 0 ? (
                  inquiry.products.map((product: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <h3 className="font-semibold text-lg">Product {index + 1}: {product.itemName || '-'}</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">Quantity</Label>
                          <p>{product.quantity || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Material</Label>
                          <p>{product.material || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Delivery Time</Label>
                          <p>{product.deliveryTime || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Raw Material Size</Label>
                          <p>{product.rawMaterialSize || inquiry.rawMaterialSize || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Raw Material Price</Label>
                          <p>{product.rawMaterialPrice || inquiry.rawMaterialPrice || '-'}</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-3">Manufacturing Specifications</h4>
                        
                        {/* Job Card Template Information */}
                        {product.jobCardTemplateId && (() => {
                          initializeJobCardTemplates()
                          const template = getJobCardTemplate(product.jobCardTemplateId)
                          const operationFields = product.operationFields || {}
                          
                          return template ? (
                            <div className="space-y-3 mb-4">
                              <div>
                                <span className="text-xs text-muted-foreground font-medium uppercase">Job Card Template:</span>
                                <p className="text-sm font-semibold">{template.template_name}</p>
                              </div>
                              {Object.keys(operationFields).length > 0 && (
                                <div>
                                  <span className="text-xs text-muted-foreground font-medium uppercase block mb-2">Operation Fields:</span>
                                  <div className="grid md:grid-cols-2 gap-3">
                                    {template.operations.map((op: any) => {
                                      const value = operationFields[op.key] || '-'
                                      return value !== '-' ? (
                                        <div key={op.key} className="text-sm">
                                          <span className="text-muted-foreground font-medium">{op.label}:</span>
                                          <span className="ml-2">{value}</span>
                                        </div>
                                      ) : null
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : null
                        })()}
                        
                        {/* Legacy fields for backward compatibility */}
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div><span className="text-muted-foreground">CNC Side 1:</span> {product.cncSide1 || inquiry.cncSide1 || '-'}</div>
                          <div><span className="text-muted-foreground">CNC Side 2:</span> {product.cncSide2 || inquiry.cncSide2 || '-'}</div>
                          <div><span className="text-muted-foreground">CNC Side 3:</span> {product.cncSide3 || inquiry.cncSide3 || '-'}</div>
                          <div><span className="text-muted-foreground">VMC Side 1:</span> {product.vmcSide1 || inquiry.vmcSide1 || '-'}</div>
                          <div><span className="text-muted-foreground">VMC Side 2:</span> {product.vmcSide2 || inquiry.vmcSide2 || '-'}</div>
                          <div><span className="text-muted-foreground">VMC Side 3:</span> {product.vmcSide3 || inquiry.vmcSide3 || '-'}</div>
                          <div><span className="text-muted-foreground">4th Axis:</span> {product.axis4 || inquiry.axis4 || '-'}</div>
                          <div><span className="text-muted-foreground">5th Axis:</span> {product.axis5 || inquiry.axis5 || '-'}</div>
                          <div><span className="text-muted-foreground">Hardening:</span> {product.hardening || inquiry.hardening || '-'}</div>
                          <div><span className="text-muted-foreground">Grinding:</span> {product.grinding || inquiry.grinding || '-'}</div>
                          <div><span className="text-muted-foreground">Coating:</span> {product.coating || inquiry.coating || '-'}</div>
                          <div><span className="text-muted-foreground">Q.C. Required:</span> {product.qcRequired || inquiry.qcRequired ? 'Yes' : 'No'}</div>
                        </div>
                      </div>
                      {(product.specialReq || inquiry.specialReq) && (
                        <div className="pt-4 border-t">
                          <Label className="text-sm text-muted-foreground">Special Requirements</Label>
                          <p>{product.specialReq || inquiry.specialReq}</p>
                        </div>
                      )}
                      {(product.additionalDetails || inquiry.additionalDetails) && (
                        <div className="pt-4 border-t">
                          <Label className="text-sm text-muted-foreground">Additional Details</Label>
                          <p>{product.additionalDetails || inquiry.additionalDetails}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No products</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Follow-ups */}
          <div className="bg-white border rounded-lg p-6 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Follow-ups</h2>
              <Button onClick={handleAddFollowUp} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
              {followUps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No follow-ups yet</p>
              ) : (
                followUps.map((followUp: FollowUp) => (
                  <div key={followUp.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {followUp.type === 'Call' && <Phone className="h-4 w-4 text-blue-600" />}
                        {followUp.type === 'Quote' && <Package className="h-4 w-4 text-green-600" />}
                        <span className="font-medium">{followUp.type}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => toggleFollowUpStatus(followUp.id)}
                        >
                          {followUp.status === 'completed' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive"
                          onClick={() => handleDeleteFollowUp(followUp.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{followUp.dateTime}</div>
                    <p className="text-sm">{followUp.description}</p>
                    {followUp.nextStep && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => handleEditFollowUp(followUp)}
                      >
                        Next: {followUp.nextStep}
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Follow-up Dialog */}
      <FollowUpDialog
        open={isFollowUpDialogOpen}
        onClose={() => {
          setIsFollowUpDialogOpen(false)
          setEditingFollowUp(null)
        }}
        onSave={handleSaveFollowUp}
        followUp={editingFollowUp}
      />
    </MainLayout>
  )
}

interface FollowUpDialogProps {
  open: boolean
  onClose: () => void
  onSave: (followUp: FollowUp) => void
  followUp: FollowUp | null
}

function FollowUpDialog({ open, onClose, onSave, followUp }: FollowUpDialogProps) {
  const [type, setType] = useState(followUp?.type || 'Call')
  const [dateTime, setDateTime] = useState(followUp?.dateTime || '')
  const [description, setDescription] = useState(followUp?.description || '')
  const [nextStep, setNextStep] = useState(followUp?.nextStep || '')

  useEffect(() => {
    if (followUp) {
      setType(followUp.type)
      setDateTime(followUp.dateTime)
      setDescription(followUp.description)
      setNextStep(followUp.nextStep)
    } else {
      setType('Call')
      setDateTime('')
      setDescription('')
      setNextStep('')
    }
  }, [followUp, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id: followUp?.id || '',
      type,
      dateTime,
      description,
      nextStep,
      status: followUp?.status || 'pending'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{followUp ? 'Edit Follow-up' : 'Add Follow-up'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FOLLOWUP_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date & Time</Label>
            <Input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter follow-up description"
              required
            />
          </div>
          <div>
            <Label>Next Step (Optional)</Label>
            <Input
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              placeholder="e.g., Schedule follow-up call"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

