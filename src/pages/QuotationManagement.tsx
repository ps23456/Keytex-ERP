import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { useMasters } from '../hooks/useMasters'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { Eye, Edit, Trash2, ChevronDown, Filter, ClipboardList } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_STYLE_MAP: Record<
  string,
  { button: string; item: string }
> = {
  Draft: {
    button: 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200/70',
    item: 'text-slate-700 data-[state=checked]:bg-slate-100',
  },
  Sent: {
    button: 'bg-sky-100 text-sky-700 border border-sky-200 hover:bg-sky-200/70',
    item: 'text-sky-700 data-[state=checked]:bg-sky-100',
  },
  Accepted: {
    button: 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200/70',
    item: 'text-emerald-700 data-[state=checked]:bg-emerald-100',
  },
  Expired: {
    button: 'bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200/70',
    item: 'text-rose-700 data-[state=checked]:bg-rose-100',
  },
}

const STATUS_OPTIONS = ['Draft', 'Sent', 'Accepted', 'Expired']
const STATUS_FILTER_OPTIONS = ['All', ...STATUS_OPTIONS]

export default function QuotationManagement() {
  const navigate = useNavigate()
  const { records, isLoading, deleteRecord, updateRecord } = useMasters('quotation')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [companyFilter, setCompanyFilter] = useState('all')
  const [contactFilter, setContactFilter] = useState('all')
  const [productFilter, setProductFilter] = useState('all')

  const companyOptions = useMemo(() => {
    const unique = new Set<string>()
    ;(records || []).forEach((quotation: any) => {
      if (quotation.companyName) {
        unique.add(quotation.companyName)
      }
    })
    return Array.from(unique)
  }, [records])

  const contactOptions = useMemo(() => {
    const unique = new Set<string>()
    ;(records || []).forEach((quotation: any) => {
      if (quotation.contactPerson) {
        unique.add(quotation.contactPerson)
      }
    })
    return Array.from(unique)
  }, [records])

  const productOptions = useMemo(() => {
    const unique = new Set<string>()
    ;(records || []).forEach((quotation: any) => {
      if (Array.isArray(quotation.items)) {
        quotation.items.forEach((item: any) => {
          if (item?.partName) {
            unique.add(item.partName)
          }
        })
      }
    })
    return Array.from(unique)
  }, [records])

  const activeAdvancedFilters = useMemo(() => {
    return [companyFilter, contactFilter, productFilter].filter((value) => value !== 'all').length
  }, [companyFilter, contactFilter, productFilter])

  const clearAdvancedFilters = () => {
    setCompanyFilter('all')
    setContactFilter('all')
    setProductFilter('all')
  }

  const filteredQuotations = useMemo(() => {
    return (records || []).filter((quotation: any) => {
      if (statusFilter !== 'All' && quotation.status !== statusFilter) {
        return false
      }

      if (companyFilter !== 'all' && (quotation.companyName || '') !== companyFilter) {
        return false
      }

      if (contactFilter !== 'all' && (quotation.contactPerson || '') !== contactFilter) {
        return false
      }

      if (productFilter !== 'all') {
        const hasMatchingProduct =
          Array.isArray(quotation.items) &&
          quotation.items.some((item: any) => (item?.partName || '') === productFilter)
        if (!hasMatchingProduct) {
          return false
        }
      }

      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const companyName = (quotation.companyName || '').toLowerCase()
        const contactPerson = (quotation.contactPerson || '').toLowerCase()
        const quotationNumber = (quotation.quotationNumber || '').toLowerCase()
        if (
          !companyName.includes(search) &&
          !contactPerson.includes(search) &&
          !quotationNumber.includes(search)
        ) {
          return false
        }
      }
      return true
    })
  }, [records, statusFilter, companyFilter, contactFilter, productFilter, searchTerm])

  const handleDelete = async (quotation: any) => {
    if (window.confirm(`Delete quotation ${quotation.quotationNumber}?`)) {
      const recordId = quotation.id || quotation.quotation_id || quotation.quotationId
      if (recordId) {
        await deleteRecord(String(recordId))
      }
    }
  }

  const handleStatusChange = async (quotation: any, newStatus: string) => {
    const recordId = quotation.id || quotation.quotation_id || quotation.quotationId
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

  const computeAmount = (quotation: any) => {
    if (typeof quotation.totalAmount === 'number') return quotation.totalAmount
    if (Array.isArray(quotation.items)) {
      return quotation.items.reduce((sum: number, item: any) => {
        const qty = parseFloat(item.quantity || '0') || 0
        const price = parseFloat(item.price || '0') || 0
        return sum + qty * price
      }, 0)
    }
    return 0
  }

const serializeQuotationForJobCard = (quotation: any) => {
    const sanitizedItems = Array.isArray(quotation?.items)
      ? quotation.items.map((item: any) => ({
          partName: item?.partName || '',
          material: item?.material || '',
          quantity: item?.quantity || '',
          description: item?.description || '',
        }))
    : []

  const templateProduct = Array.isArray(quotation?.inquiryData?.products)
    ? quotation.inquiryData.products.find((product: any) => product?.jobCardTemplateId)
    : null

    return {
      id: quotation?.id || quotation?.quotation_id || quotation?.quotationId || '',
      quotationNumber: quotation?.quotationNumber || '',
      quotationDate: quotation?.quotationDate || '',
      companyName: quotation?.companyName || '',
      address: quotation?.address || '',
      contactPerson: quotation?.contactPerson || '',
      contactPhone: quotation?.contactPhone || '',
      contactEmail: quotation?.contactEmail || '',
    notes: quotation?.notes || '',
    jobCardTemplateId: templateProduct?.jobCardTemplateId || '',
      specialNotes: quotation?.specialNotes || '',
      items: sanitizedItems,
      inquiryData: quotation?.inquiryData, // Include inquiryData with template info
    }
  }

  const handleCreateJobCard = (quotation: any) => {
    const sanitized = serializeQuotationForJobCard(quotation)
    try {
      sessionStorage.setItem('job_card_prefill', JSON.stringify(sanitized))
    } catch (error) {
      console.error('Failed to cache quotation for job card prefill:', error)
    }
    navigate('/job-cards/new', { state: { quotation: sanitized } })
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Quotation Management</h1>
          <p className="text-gray-600 mt-1">Manage and track all quotations</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-3 space-y-3 md:space-y-0">
                <div className="relative">
                  <Input
                    placeholder="Search by company, quotation no, or contact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="md:w-80"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 md:w-44 justify-between px-4 text-sm font-medium"
                    >
                      <span>{statusFilter === 'All' ? 'All Statuses' : statusFilter}</span>
                      <ChevronDown className="h-4 w-4 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44">
                    <DropdownMenuRadioGroup
                      value={statusFilter}
                      onValueChange={(value) => setStatusFilter(value)}
                    >
                      {STATUS_FILTER_OPTIONS.map((status) => (
                        <DropdownMenuRadioItem
                          key={status}
                          value={status}
                          className="capitalize"
                        >
                          {status === 'All' ? 'All Statuses' : status}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant={showAdvancedFilters ? 'default' : 'outline'}
                  onClick={() => setShowAdvancedFilters((prev) => !prev)}
                  className={`h-10 px-4 text-sm font-medium flex items-center space-x-2 ${
                    showAdvancedFilters ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span>More Filters</span>
                  {activeAdvancedFilters > 0 && (
                    <span
                      className={`ml-1 inline-flex items-center justify-center rounded-full px-2 text-xs font-semibold ${
                        showAdvancedFilters ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {activeAdvancedFilters}
                    </span>
                  )}
                </Button>
              </div>
              <Button onClick={() => navigate('/quotations/new')} className="flex items-center space-x-2">
                <span>+ New Quotation</span>
              </Button>
            </div>

            {showAdvancedFilters && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Company</Label>
                    <select
                      value={companyFilter}
                      onChange={(e) => setCompanyFilter(e.target.value)}
                      className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm"
                    >
                      <option value="all">All companies</option>
                      {companyOptions.map((company) => (
                        <option key={company} value={company}>{company}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Contact Person</Label>
                    <select
                      value={contactFilter}
                      onChange={(e) => setContactFilter(e.target.value)}
                      className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm"
                    >
                      <option value="all">All contacts</option>
                      {contactOptions.map((contact) => (
                        <option key={contact} value={contact}>{contact}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase text-slate-500">Product</Label>
                    <select
                      value={productFilter}
                      onChange={(e) => setProductFilter(e.target.value)}
                      className="h-10 rounded-md border border-input bg-white px-3 py-2 text-sm"
                    >
                      <option value="all">All products</option>
                      {productOptions.map((product) => (
                        <option key={product} value={product}>{product}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={activeAdvancedFilters === 0}
                      onClick={clearAdvancedFilters}
                      className="text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 disabled:text-slate-400"
                    >
                      Clear filters
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quotation Details</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Follow-ups</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-muted-foreground">Loading quotations...</div>
                      </TableCell>
                    </TableRow>
                  ) : filteredQuotations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No quotations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQuotations.map((quotation: any, index: number) => {
                      const recordId = quotation.id || quotation.quotation_id || quotation.quotationId || `quotation_${index}`
                      const amount = computeAmount(quotation)
                      const itemsCount = Array.isArray(quotation.items) ? quotation.items.length : 0
                      const validUntilDate = quotation.validUntil ? new Date(quotation.validUntil) : null
                      const validUntil = validUntilDate ? format(validUntilDate, 'MMM d, yyyy') : '-'
                      const isExpired = validUntilDate ? validUntilDate < new Date() : false
                      const currentStatus = quotation.status || 'Draft'
                      const statusStyles = STATUS_STYLE_MAP[currentStatus] || STATUS_STYLE_MAP.Draft
                      return (
                        <TableRow key={recordId}>
                          <TableCell className="space-y-1">
                            <div className="font-medium">{quotation.quotationNumber || '-'} </div>
                            <div className="text-xs text-muted-foreground">
                              {quotation.quotationDate ? format(new Date(quotation.quotationDate), 'MMM d, yyyy') : '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{quotation.companyName || '-'}</div>
                            <div className="text-xs text-muted-foreground">{quotation.contactPerson || ''}</div>
                            <div className="text-xs text-muted-foreground">{quotation.contactPhone || ''}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{itemsCount} item{itemsCount === 1 ? '' : 's'}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[240px]">
                              {Array.isArray(quotation.items)
                                ? quotation.items.map((item: any) => item.partName).filter(Boolean).join(', ')
                                : ''}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            ₹ {amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className={`h-8 px-3 text-xs font-semibold rounded-full transition-colors ${statusStyles.button}`}
                                >
                                  {currentStatus}
                                  <ChevronDown className="ml-1 h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-40">
                                <DropdownMenuRadioGroup
                                  value={currentStatus}
                                  onValueChange={(value) => handleStatusChange(quotation, value)}
                                >
                                  {STATUS_OPTIONS.map((status) => {
                                    const itemStyles = STATUS_STYLE_MAP[status] || STATUS_STYLE_MAP.Draft
                                    return (
                                      <DropdownMenuRadioItem
                                        key={status}
                                        value={status}
                                        className={`capitalize ${itemStyles.item}`}
                                      >
                                        {status}
                                      </DropdownMenuRadioItem>
                                    )
                                  })}
                                </DropdownMenuRadioGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          <TableCell>
                            <div className={`text-sm ${isExpired ? 'text-red-600 font-medium' : ''}`}>{validUntil}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{quotation.followUps ?? 0}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => navigate(`/quotations/${recordId}`)}
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => navigate(`/quotations/${recordId}/edit`)}
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-orange-600 hover:text-orange-700"
                                onClick={() => handleCreateJobCard(quotation)}
                                title="Create Job Card"
                              >
                                <ClipboardList className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(quotation)}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
