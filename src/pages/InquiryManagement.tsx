import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { useMasters } from '../hooks/useMasters'
import SlideOver from '../components/SlideOver'
import InquiryForm, { InquiryFormData } from '../components/InquiryForm'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { Checkbox } from '../components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Plus, Eye, FileText, Edit, Trash2, Search, Clock, Filter, Columns, CheckCircle, XCircle, Share2, Copy, MessageCircle, ClipboardList, Download } from 'lucide-react'
import TradeIndiaImportDialog from '../components/TradeIndiaImportDialog'

const STATUS_OPTIONS = ['new', 'in-progress', 'quoted', 'accepted', 'rejected', 'completed']
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent']
const SOURCE_OPTIONS = ['website', 'referral', 'social-media', 'email', 'phone-call', 'walk-in', 'trade-show', 'tradeindia', 'other']

// Fixed columns that are always visible
const FIXED_COLUMNS = ['inquiryDetails', 'company', 'products', 'status', 'priority', 'followUps', 'actions']

// Available columns mapping
const AVAILABLE_COLUMNS = {
  inquiryDetails: { label: 'Inquiry Details', fixed: true },
  company: { label: 'Company', fixed: true },
  products: { label: 'Products', fixed: true },
  status: { label: 'Status', fixed: true },
  priority: { label: 'Priority', fixed: true },
  followUps: { label: 'Follow-Ups', fixed: true },
  actions: { label: 'Actions', fixed: true },
  // Company Information columns
  contactPerson: { label: 'Contact Person', fixed: false },
  contactNumber: { label: 'Contact Number', fixed: false },
  email: { label: 'Email Address', fixed: false },
  address: { label: 'Address', fixed: false },
  source: { label: 'Source', fixed: false },
  // Product Detail columns (from first product)
  itemName: { label: 'Item Name', fixed: false },
  quantity: { label: 'Quantity Required', fixed: false },
  material: { label: 'Material', fixed: false },
  deliveryTime: { label: 'Delivery Time', fixed: false },
  designFileName: { label: 'Design File', fixed: false },
  // Manufacturing Specifications columns
  rawMaterialSize: { label: 'Raw Material Size', fixed: false },
  rawMaterialPrice: { label: 'Raw Material Price', fixed: false },
  cncSide1: { label: 'CNC Side 1', fixed: false },
  cncSide2: { label: 'CNC Side 2', fixed: false },
  cncSide3: { label: 'CNC Side 3', fixed: false },
  vmcSide1: { label: 'VMC Side 1', fixed: false },
  vmcSide2: { label: 'VMC Side 2', fixed: false },
  vmcSide3: { label: 'VMC Side 3', fixed: false },
  axis4: { label: '4th Axis Operations', fixed: false },
  axis5: { label: '5th Axis Operations', fixed: false },
  hardening: { label: 'Hardening Requirements', fixed: false },
  grinding: { label: 'Grinding Specifications', fixed: false },
  coating: { label: 'Coating Requirements', fixed: false },
  qcRequired: { label: 'QC Required', fixed: false },
  specialReq: { label: 'Special Requirements', fixed: false },
  additionalDetails: { label: 'Additional Details', fixed: false },
}

export default function InquiryManagement() {
  const navigate = useNavigate()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any | null>(null)
  const [viewingRecord, setViewingRecord] = useState<any | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [statusTab, setStatusTab] = useState<string>('all-statuses') // Main status tab filter
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  
  // Additional filters
  const [companyFilter, setCompanyFilter] = useState<string>('all')
  const [productFilter, setProductFilter] = useState<string>('all')
  const [contactPersonFilter, setContactPersonFilter] = useState<string>('all')
  const [emailFilter, setEmailFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false)
  
  // Column visibility state - all fixed columns are always visible, others default to hidden
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    Object.keys(AVAILABLE_COLUMNS).forEach(key => {
      initial[key] = AVAILABLE_COLUMNS[key as keyof typeof AVAILABLE_COLUMNS].fixed || false
    })
    return initial
  })

  const {
    records,
    isLoading,
    createRecord,
    updateRecord,
    deleteRecord,
    isCreating,
    isUpdating
  } = useMasters('inquiry')

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

  const formatProducts = (products: any) => {
    if (!Array.isArray(products) || products.length === 0) return { count: '0', names: 'No products' }
    const names = products.map((p: any) => p.itemName || p.name || '-').filter(Boolean).join(', ')
    const truncated = names.length > 40 ? names.substring(0, 40) + '...' : names
    return { count: `${products.length}`, names: truncated }
  }

  const getFirstProduct = (products: any) => {
    if (!Array.isArray(products) || products.length === 0) return null
    return products[0]
  }

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || 'new'
    if (s === 'new') return 'bg-blue-100 text-blue-800'
    if (s === 'pending') return 'bg-orange-100 text-orange-800'
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

  const handleStatusChange = async (record: any, newStatus: string) => {
    try {
      const recordId = record.id || record.inquiry_id || record.inquiryId
      await updateRecord({ id: String(recordId), data: { ...record, status: newStatus } })
      setSuccessMessage('Status updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      alert('Failed to update status')
    }
  }

  const handlePriorityChange = async (record: any, newPriority: string) => {
    try {
      const recordId = record.id || record.inquiry_id || record.inquiryId
      await updateRecord({ id: String(recordId), data: { ...record, priority: newPriority } })
      setSuccessMessage('Priority updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      alert('Failed to update priority')
    }
  }

  const normalizedRecords = (records || []).map((r: any, index: number) => {
    const followUpsArray = Array.isArray(r.followUps) ? r.followUps : []
    return {
      ...r,
      inquiryNumber: r.inquiryNumber || `#${index + 1}`,
      createdAt: r.createdAt || r.created_at || new Date().toISOString(),
      status: r.status || 'new',
      priority: r.priority || 'low',
      followUps: followUpsArray.length || r.followUpsCount || 0,
      inquiry_id: r.inquiry_id || r.id || `inquiry_${Date.now()}_${index}`
    }
  })

  const filteredRecords = normalizedRecords.filter((r: any) => {
    // Status tab filter (main filter)
    if (statusTab !== 'all') {
      if (statusTab === 'all-statuses') {
        // Show all except rejected and pending (pending inquiries are separate workflow)
        if (r.status === 'rejected' || r.status === 'pending') return false
      } else {
        // Show specific status
        if (r.status !== statusTab) return false
      }
    }
    
    // Search filter
    if (searchTerm) {
    const search = searchTerm.toLowerCase()
      const matchesSearch = (
      (r.companyName || '').toLowerCase().includes(search) ||
      (r.contactPerson || '').toLowerCase().includes(search) ||
        (r.inquiryNumber || '').toLowerCase().includes(search) ||
        (r.email || '').toLowerCase().includes(search) ||
        (r.source || '').toLowerCase().includes(search)
      )
      if (!matchesSearch) return false
    }
    
    // Status filter (from dropdown - keep for backward compatibility)
    if (statusFilter !== 'all' && r.status !== statusFilter) {
      return false
    }
    
    // Source filter
    if (sourceFilter !== 'all' && r.source !== sourceFilter) {
      return false
    }
    
    // Priority filter
    if (priorityFilter !== 'all' && r.priority !== priorityFilter) {
      return false
    }
    
    // Company filter
    if (companyFilter && companyFilter !== 'all' && r.companyName !== companyFilter) {
      return false
    }
    
    // Product filter
    if (productFilter && productFilter !== 'all') {
      const products = Array.isArray(r.products) ? r.products : []
      const hasMatchingProduct = products.some((p: any) => p.itemName === productFilter)
      if (!hasMatchingProduct) return false
    }
    
    // Contact Person filter
    if (contactPersonFilter && contactPersonFilter !== 'all' && r.contactPerson !== contactPersonFilter) {
      return false
    }
    
    // Email filter
    if (emailFilter && emailFilter !== 'all' && r.email !== emailFilter) {
      return false
    }
    
    return true
  })
  
  // Get counts for each status tab
  const getStatusCounts = () => {
    const counts: Record<string, number> = {
      'new': 0,
      'accepted': 0,
      'in-progress': 0,
      'rejected': 0,
      'quoted': 0,
      'completed': 0,
      'pending': 0,
      'all-statuses': 0
    }
    
    normalizedRecords.forEach((r: any) => {
      const status = r.status || 'new'
      if (counts.hasOwnProperty(status)) {
        counts[status]++
      }
      // For "all-statuses" (exclude rejected and pending - pending is separate workflow)
      if (status !== 'rejected' && status !== 'pending') {
        counts['all-statuses']++
      }
    })
    
    return counts
  }

  const handleAcceptInquiry = async (record: any) => {
    try {
      const recordId = record.id || record.inquiry_id || record.inquiryId
      await updateRecord({ 
        id: String(recordId), 
        data: { ...record, status: 'new' } 
      })
      setSuccessMessage('Inquiry accepted and moved to New inquiries!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      alert('Failed to accept inquiry')
    }
  }

  const handleRejectInquiry = async (record: any) => {
    if (window.confirm('Are you sure you want to reject this inquiry?')) {
      try {
        const recordId = record.id || record.inquiry_id || record.inquiryId
        await updateRecord({ 
          id: String(recordId), 
          data: { ...record, status: 'rejected' } 
        })
        setSuccessMessage('Inquiry rejected!')
        setTimeout(() => setSuccessMessage(null), 3000)
      } catch (error) {
        alert('Failed to reject inquiry')
      }
    }
  }
  
  const statusCounts = getStatusCounts()
  
  const hasActiveFilters = sourceFilter !== 'all' || priorityFilter !== 'all' || 
    (companyFilter && companyFilter !== 'all') || (productFilter && productFilter !== 'all') || 
    (contactPersonFilter && contactPersonFilter !== 'all') || (emailFilter && emailFilter !== 'all')
  
  const clearAllFilters = () => {
    setStatusFilter('all')
    setSourceFilter('all')
    setPriorityFilter('all')
    setCompanyFilter('all')
    setProductFilter('all')
    setContactPersonFilter('all')
    setEmailFilter('all')
    setSearchTerm('')
  }

  const handleAdd = () => {
    setEditingRecord(null)
    setIsFormOpen(true)
  }

  const handleEdit = (record: any) => {
    setEditingRecord(record)
    setIsFormOpen(true)
  }

  const handleView = (record: any) => {
    setViewingRecord(record)
  }

  const handleDelete = async (record: any) => {
    if (window.confirm('Are you sure you want to delete this inquiry?')) {
      try {
        const recordId = record.id || record.inquiry_id || record.inquiryId
        await deleteRecord(String(recordId))
        setSuccessMessage('Inquiry deleted successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
      } catch (error) {
        alert('Failed to delete inquiry')
      }
    }
  }

  const handleFormSubmit = async (data: InquiryFormData) => {
    try {
      if (editingRecord) {
        const recordId = editingRecord.id || editingRecord.inquiry_id || editingRecord.inquiryId
        await updateRecord({ id: String(recordId), data })
        setSuccessMessage('Inquiry updated successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        await createRecord(data)
        setSuccessMessage('Inquiry created successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
      }
      setIsFormOpen(false)
      setEditingRecord(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to save inquiry: ${errorMessage}`)
    }
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingRecord(null)
  }

  const getInquiryLink = () => {
    return `${window.location.origin}/submit-inquiry`
  }

  const handleCopyInquiryLink = async () => {
    const inquiryLink = getInquiryLink()
    try {
      await navigator.clipboard.writeText(inquiryLink)
      setSuccessMessage('Public inquiry form link copied to clipboard!')
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = inquiryLink
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setSuccessMessage('Public inquiry form link copied to clipboard!')
        setTimeout(() => {
          setSuccessMessage(null)
        }, 3000)
      } catch (err) {
        alert('Failed to copy link. Please copy manually: ' + inquiryLink)
      }
      document.body.removeChild(textArea)
    }
  }

  const handleShareOnWhatsApp = () => {
    const inquiryLink = getInquiryLink()
    const message = encodeURIComponent(`Hi! Please submit your inquiry using this form: ${inquiryLink}`)
    const whatsappUrl = `https://wa.me/?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  const handleImportLeads = async (leads: any[]) => {
    try {
      // Import each lead as a new inquiry
      for (const lead of leads) {
        // Check if lead already exists (by tradeIndiaInquiryId if available)
        const existingRecords = records || []
        const existingLead = lead.tradeIndiaInquiryId 
          ? existingRecords.find((r: any) => r.tradeIndiaInquiryId === lead.tradeIndiaInquiryId)
          : null
        
        if (!existingLead) {
          await createRecord(lead)
        }
      }
      setSuccessMessage(`Successfully imported ${leads.length} lead(s) from TradeIndia!`)
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error) {
      console.error('Error importing leads:', error)
      throw error
    }
  }

  const formatSource = (source: string) => {
    if (!source) return '-'
    return source.charAt(0).toUpperCase() + source.slice(1).replace('-', ' ')
  }

  // Extract unique values from records for dropdown filters
  const getUniqueCompanies = () => {
    const companies = new Set<string>()
    normalizedRecords.forEach((r: any) => {
      if (r.companyName) companies.add(r.companyName)
    })
    return Array.from(companies).sort()
  }

  const getUniqueProducts = () => {
    const products = new Set<string>()
    normalizedRecords.forEach((r: any) => {
      if (Array.isArray(r.products)) {
        r.products.forEach((p: any) => {
          if (p.itemName) products.add(p.itemName)
        })
      }
    })
    return Array.from(products).sort()
  }

  const getUniqueContactPersons = () => {
    const contacts = new Set<string>()
    normalizedRecords.forEach((r: any) => {
      if (r.contactPerson) contacts.add(r.contactPerson)
    })
    return Array.from(contacts).sort()
  }

  const getUniqueEmails = () => {
    const emails = new Set<string>()
    normalizedRecords.forEach((r: any) => {
      if (r.email) emails.add(r.email)
    })
    return Array.from(emails).sort()
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">{successMessage}</div>
        )}

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Inquiry Management</h1>
          <p className="text-gray-600 mt-1">Create and manage customer inquiries</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Inquiries</h2>
                <p className="text-gray-600">Manage inquiry records</p>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="flex items-center space-x-2"
                      title="Share public inquiry form link"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Share Inquiry Form</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Share Inquiry Form</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="p-2 space-y-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={handleCopyInquiryLink}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={handleShareOnWhatsApp}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Share on WhatsApp
                      </Button>
                      <div className="pt-2 border-t text-xs text-muted-foreground px-2">
                        Link: {getInquiryLink()}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              <Button 
                onClick={() => setIsImportDialogOpen(true)} 
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Import Leads</span>
              </Button>
              <Button onClick={handleAdd} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>New Inquiry</span>
              </Button>
              </div>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-2 mb-6 pb-4 border-b">
              <button
                onClick={() => setStatusTab('all-statuses')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2 ${
                  statusTab === 'all-statuses'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                All Inquiries
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  statusTab === 'all-statuses'
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {statusCounts['all-statuses']}
                </span>
              </button>
              
              <button
                onClick={() => setStatusTab('new')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  statusTab === 'new'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                New
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  statusTab === 'new'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {statusCounts['new']}
                </span>
              </button>
              
              <button
                onClick={() => setStatusTab('accepted')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  statusTab === 'accepted'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Accepted
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  statusTab === 'accepted'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {statusCounts['accepted']}
                </span>
              </button>
              
              <button
                onClick={() => setStatusTab('in-progress')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-2 ${
                  statusTab === 'in-progress'
                    ? 'bg-yellow-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                In Progress
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  statusTab === 'in-progress'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {statusCounts['in-progress']}
                </span>
              </button>
              
              <button
                onClick={() => setStatusTab('quoted')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  statusTab === 'quoted'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Quoted
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  statusTab === 'quoted'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {statusCounts['quoted']}
                </span>
              </button>
              
              <button
                onClick={() => setStatusTab('rejected')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  statusTab === 'rejected'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Rejected
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  statusTab === 'rejected'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {statusCounts['rejected']}
                </span>
              </button>
              
              <button
                onClick={() => setStatusTab('completed')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  statusTab === 'completed'
                    ? 'bg-gray-700 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Completed
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  statusTab === 'completed'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {statusCounts['completed']}
                </span>
              </button>
              
              {/* Separator for Pending (public form submissions) */}
              <div className="h-8 w-px bg-gray-300 mx-1"></div>
              
              <button
                onClick={() => setStatusTab('pending')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  statusTab === 'pending'
                    ? 'bg-orange-500 text-white shadow-sm border border-orange-600'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-dashed border-orange-300'
                }`}
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Pending
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  statusTab === 'pending'
                    ? 'bg-white/20 text-white'
                    : 'bg-orange-200 text-orange-800'
                }`}>
                  {statusCounts['pending']}
                </span>
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading inquiries...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search inquiries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                  />
                  </div>
                  
                  {/* Source Filter */}
                  <div className="flex items-center gap-2">
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        {SOURCE_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {formatSource(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* More Filters */}
                  <DropdownMenu open={isMoreFiltersOpen} onOpenChange={setIsMoreFiltersOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2 relative">
                        <Filter className="h-4 w-4" />
                        More Filters
                        {hasActiveFilters && (
                          <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                            {[
                              sourceFilter !== 'all' ? 1 : 0,
                              priorityFilter !== 'all' ? 1 : 0,
                              (companyFilter && companyFilter !== 'all') ? 1 : 0,
                              (productFilter && productFilter !== 'all') ? 1 : 0,
                              (contactPersonFilter && contactPersonFilter !== 'all') ? 1 : 0,
                              (emailFilter && emailFilter !== 'all') ? 1 : 0
                            ].reduce((a, b) => a + b, 0)}
                          </span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-96 p-0 shadow-lg">
                      <div className="px-5 py-4 border-b bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">Filter Options</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Filter inquiries by various criteria</p>
                          </div>
                          {hasActiveFilters && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearAllFilters}
                              className="h-8 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                            >
                              Clear all
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-[500px] overflow-y-auto p-5">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Priority Filter */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Priority</Label>
                            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Priorities</SelectItem>
                                {PRIORITY_OPTIONS.map((p) => (
                                  <SelectItem key={p} value={p}>
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Company Filter */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Company Name</Label>
                            <Select value={companyFilter} onValueChange={setCompanyFilter}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select company" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px]">
                                <SelectItem value="all">All Companies</SelectItem>
                                {getUniqueCompanies().map((company) => (
                                  <SelectItem key={company} value={company}>
                                    {company}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Product Filter */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Product</Label>
                            <Select value={productFilter} onValueChange={setProductFilter}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px]">
                                <SelectItem value="all">All Products</SelectItem>
                                {getUniqueProducts().map((product) => (
                                  <SelectItem key={product} value={product}>
                                    {product}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Contact Person Filter */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Contact Person</Label>
                            <Select value={contactPersonFilter} onValueChange={setContactPersonFilter}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select contact person" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px]">
                                <SelectItem value="all">All Contact Persons</SelectItem>
                                {getUniqueContactPersons().map((contact) => (
                                  <SelectItem key={contact} value={contact}>
                                    {contact}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Email Filter */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                            <Select value={emailFilter} onValueChange={setEmailFilter}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select email" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px]">
                                <SelectItem value="all">All Email Addresses</SelectItem>
                                {getUniqueEmails().map((email) => (
                                  <SelectItem key={email} value={email}>
                                    {email}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Column Selector */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Columns className="h-4 w-4" />
                        Columns
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 p-0">
                      <div className="px-3 py-2 border-b">
                        <DropdownMenuLabel className="text-sm font-semibold">Show Columns</DropdownMenuLabel>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto p-2">
                        {Object.entries(AVAILABLE_COLUMNS).map(([key, column]) => (
                          <label
                            key={key}
                            className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                          >
                            <Checkbox
                              checked={visibleColumns[key]}
                              onCheckedChange={(checked) => {
                                setVisibleColumns(prev => ({
                                  ...prev,
                                  [key]: checked as boolean
                                }))
                              }}
                              className="flex-shrink-0"
                            />
                            <span className="text-sm flex-1">{column.label}</span>
                            {column.fixed && (
                              <span className="text-xs text-muted-foreground flex-shrink-0">(Fixed)</span>
                            )}
                          </label>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {visibleColumns.inquiryDetails && <TableHead>INQUIRY DETAILS</TableHead>}
                        {visibleColumns.company && <TableHead>COMPANY</TableHead>}
                        {visibleColumns.contactPerson && <TableHead>CONTACT PERSON</TableHead>}
                        {visibleColumns.contactNumber && <TableHead>CONTACT NUMBER</TableHead>}
                        {visibleColumns.email && <TableHead>EMAIL</TableHead>}
                        {visibleColumns.address && <TableHead>ADDRESS</TableHead>}
                        {visibleColumns.source && <TableHead>SOURCE</TableHead>}
                        {visibleColumns.products && <TableHead>PRODUCTS</TableHead>}
                        {visibleColumns.itemName && <TableHead>ITEM NAME</TableHead>}
                        {visibleColumns.quantity && <TableHead>QUANTITY</TableHead>}
                        {visibleColumns.material && <TableHead>MATERIAL</TableHead>}
                        {visibleColumns.deliveryTime && <TableHead>DELIVERY TIME</TableHead>}
                        {visibleColumns.designFileName && <TableHead>DESIGN FILE</TableHead>}
                        {visibleColumns.rawMaterialSize && <TableHead>RAW MATERIAL SIZE</TableHead>}
                        {visibleColumns.rawMaterialPrice && <TableHead>RAW MATERIAL PRICE</TableHead>}
                        {visibleColumns.cncSide1 && <TableHead>CNC SIDE 1</TableHead>}
                        {visibleColumns.cncSide2 && <TableHead>CNC SIDE 2</TableHead>}
                        {visibleColumns.cncSide3 && <TableHead>CNC SIDE 3</TableHead>}
                        {visibleColumns.vmcSide1 && <TableHead>VMC SIDE 1</TableHead>}
                        {visibleColumns.vmcSide2 && <TableHead>VMC SIDE 2</TableHead>}
                        {visibleColumns.vmcSide3 && <TableHead>VMC SIDE 3</TableHead>}
                        {visibleColumns.axis4 && <TableHead>4TH AXIS</TableHead>}
                        {visibleColumns.axis5 && <TableHead>5TH AXIS</TableHead>}
                        {visibleColumns.hardening && <TableHead>HARDENING</TableHead>}
                        {visibleColumns.grinding && <TableHead>GRINDING</TableHead>}
                        {visibleColumns.coating && <TableHead>COATING</TableHead>}
                        {visibleColumns.qcRequired && <TableHead>QC REQUIRED</TableHead>}
                        {visibleColumns.specialReq && <TableHead>SPECIAL REQ</TableHead>}
                        {visibleColumns.additionalDetails && <TableHead>ADDITIONAL DETAILS</TableHead>}
                        {visibleColumns.status && <TableHead>STATUS</TableHead>}
                        {visibleColumns.priority && <TableHead>PRIORITY</TableHead>}
                        {visibleColumns.followUps && <TableHead>FOLLOW-UPS</TableHead>}
                        {visibleColumns.actions && <TableHead className="w-32">ACTIONS</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={Object.values(visibleColumns).filter(v => v).length} className="text-center py-8">
                            <div className="text-muted-foreground">
                              {searchTerm || statusTab !== 'all-statuses' || sourceFilter !== 'all' || hasActiveFilters
                                ? 'No inquiries match your filters' 
                                : 'No inquiries found'}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRecords.map((record: any, index: number) => {
                          const products = formatProducts(record.products || [])
                          const firstProduct = getFirstProduct(record.products || [])
                          return (
                            <TableRow key={record.inquiry_id || index}>
                              {visibleColumns.inquiryDetails && (
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium">{record.inquiryNumber}</div>
                                  <div className="text-sm text-muted-foreground">{formatDate(record.createdAt)}</div>
                                </div>
                              </TableCell>
                              )}
                              {visibleColumns.company && (
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium">{record.companyName || '-'}</div>
                                </div>
                              </TableCell>
                              )}
                              {visibleColumns.contactPerson && (
                                <TableCell>
                                  <div className="text-sm">{record.contactPerson || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.contactNumber && (
                                <TableCell>
                                  <div className="text-sm">{record.contactNumber || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.email && (
                                <TableCell>
                                  <div className="text-sm">{record.email || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.address && (
                                <TableCell>
                                  <div className="text-sm max-w-xs truncate">{record.address || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.source && (
                                <TableCell>
                                  <div className="text-sm">{formatSource(record.source || '')}</div>
                                </TableCell>
                              )}
                              {visibleColumns.products && (
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium">{products.count} product{products.count !== '1' ? 's' : ''}</div>
                                  <div className="text-sm text-muted-foreground">{products.names}</div>
                                </div>
                              </TableCell>
                              )}
                              {visibleColumns.itemName && (
                                <TableCell>
                                  <div className="text-sm">{firstProduct?.itemName || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.quantity && (
                                <TableCell>
                                  <div className="text-sm">{firstProduct?.quantity || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.material && (
                                <TableCell>
                                  <div className="text-sm">{firstProduct?.material || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.deliveryTime && (
                                <TableCell>
                                  <div className="text-sm">{firstProduct?.deliveryTime || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.designFileName && (
                                <TableCell>
                                  <div className="text-sm truncate max-w-xs">{firstProduct?.designFileName || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.rawMaterialSize && (
                                <TableCell>
                                  <div className="text-sm">{firstProduct?.rawMaterialSize || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.rawMaterialPrice && (
                                <TableCell>
                                  <div className="text-sm">{firstProduct?.rawMaterialPrice || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.cncSide1 && (
                                <TableCell>
                                  <div className="text-sm">{firstProduct?.cncSide1 || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.cncSide2 && (
                                <TableCell>
                                  <div className="text-sm">{firstProduct?.cncSide2 || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.cncSide3 && (
                                <TableCell>
                                  <div className="text-sm">{firstProduct?.cncSide3 || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.vmcSide1 && (
                                <TableCell>
                                  <div className="text-sm">{firstProduct?.vmcSide1 || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.vmcSide2 && (
                                <TableCell>
                                  <div className="text-sm">{firstProduct?.vmcSide2 || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.vmcSide3 && (
                                <TableCell>
                                  <div className="text-sm">{firstProduct?.vmcSide3 || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.axis4 && (
                                <TableCell>
                                  <div className="text-sm">{firstProduct?.axis4 || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.axis5 && (
                                <TableCell>
                                  <div className="text-sm">{firstProduct?.axis5 || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.hardening && (
                                <TableCell>
                                  <div className="text-sm">{firstProduct?.hardening || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.grinding && (
                                <TableCell>
                                  <div className="text-sm">{firstProduct?.grinding || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.coating && (
                                <TableCell>
                                  <div className="text-sm">{firstProduct?.coating || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.qcRequired && (
                                <TableCell>
                                  <div className="text-sm">{firstProduct?.qcRequired ? 'Yes' : 'No'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.specialReq && (
                                <TableCell>
                                  <div className="text-sm max-w-xs truncate">{firstProduct?.specialReq || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.additionalDetails && (
                                <TableCell>
                                  <div className="text-sm max-w-xs truncate">{firstProduct?.additionalDetails || '-'}</div>
                                </TableCell>
                              )}
                              {visibleColumns.status && (
                              <TableCell>
                                {record.status === 'pending' ? (
                                  <div className={`h-7 w-28 ${getStatusColor(record.status)} border-0 rounded-full px-3 text-xs font-medium flex items-center justify-center`}>
                                    Pending
                                  </div>
                                ) : (
                                <Select
                                  value={record.status}
                                  onValueChange={(value) => handleStatusChange(record, value)}
                                >
                                  <SelectTrigger className={`h-7 w-28 ${getStatusColor(record.status)} border-0 rounded-full px-3 text-xs font-medium cursor-pointer hover:opacity-80`}>
                                    <div className="flex items-center space-x-1">
                                      {(record.status || 'new').toLowerCase() === 'new' && <Clock className="h-3 w-3" />}
                                      <SelectValue />
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUS_OPTIONS.map((s) => (
                                      <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                )}
                              </TableCell>
                              )}
                              {visibleColumns.priority && (
                              <TableCell>
                                <Select
                                  value={record.priority}
                                  onValueChange={(value) => handlePriorityChange(record, value)}
                                >
                                  <SelectTrigger className={`h-7 w-24 ${getPriorityColor(record.priority)} border-0 rounded-full px-3 text-xs font-medium cursor-pointer hover:opacity-80`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {PRIORITY_OPTIONS.map((p) => (
                                      <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              )}
                              {visibleColumns.followUps && (
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <span>{record.followUps || 0}</span>
                                  {record.followUps > 0 && <span className="w-2 h-2 bg-orange-500 rounded-full"></span>}
                                </div>
                              </TableCell>
                              )}
                              {visibleColumns.actions && (
                              <TableCell>
                                {record.status === 'pending' ? (
                                  <div className="flex items-center space-x-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleAcceptInquiry(record)} 
                                      className="h-8 px-3 text-green-600 hover:text-green-700 hover:bg-green-50" 
                                      title="Accept"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Accept
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleRejectInquiry(record)} 
                                      className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50" 
                                      title="Reject"
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => {
                                        const recordId = record.id || record.inquiry_id || record.inquiryId
                                        navigate(`/inquiries/${recordId}`)
                                      }} 
                                      className="h-8 w-8" 
                                      title="View"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => navigate('/quotations/new', { state: { inquiry: record } })} 
                                      className="h-8 w-8" 
                                      title="Convert to Quotation"
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(record)} className="h-8 w-8" title="Edit">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(record)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                              )}
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </div>

        <SlideOver
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          title={editingRecord ? 'Edit Inquiry' : 'Add New Inquiry'}
          description={editingRecord ? 'Update the inquiry' : 'Fill in the details to create a new inquiry'}
        >
          <InquiryForm
            initialData={editingRecord || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isCreating || isUpdating}
          />
        </SlideOver>

        <TradeIndiaImportDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
          onImport={handleImportLeads}
        />
      </div>
    </MainLayout>
  )
}


