import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { useMasters, useMasterOptions } from '../hooks/useMasters'
import CustomerForm from '../components/CustomerForm'
import SlideOver from '../components/SlideOver'
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
import { Plus, Eye, Edit, Trash2, Search, Filter, Columns } from 'lucide-react'
import { MasterRecord } from '../lib/api'

// Fixed columns that are always visible
const FIXED_COLUMNS = ['customerName', 'companyName', 'customerType', 'industry', 'email', 'phone', 'actions']

// Available columns mapping - all fields from customer form
const AVAILABLE_COLUMNS = {
  customerName: { label: 'Customer Name', fixed: true },
  companyName: { label: 'Company Name', fixed: true },
  customerType: { label: 'Customer Type', fixed: true },
  industry: { label: 'Industry', fixed: true },
  email: { label: 'Email', fixed: true },
  phone: { label: 'Phone', fixed: true },
  actions: { label: 'Actions', fixed: true },
  // Additional columns from form
  gstNumber: { label: 'GST Number', fixed: false },
  panNumber: { label: 'PAN Number', fixed: false },
  website: { label: 'Website', fixed: false },
  territory: { label: 'Territory', fixed: false },
  marketSegment: { label: 'Market Segment', fixed: false },
  status: { label: 'Status', fixed: false },
  numberOfEmployees: { label: 'Number of Employees', fixed: false },
  annualRevenue: { label: 'Annual Revenue', fixed: false },
}

export default function CustomerManagement() {
  const navigate = useNavigate()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MasterRecord | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusTab, setStatusTab] = useState<string>('all') // Status tab: 'all', 'Active', 'Inactive'
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false)
  
  // Filter states
  const [customerTypeFilter, setCustomerTypeFilter] = useState<string>('all')
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [territoryFilter, setTerritoryFilter] = useState<string>('all')
  const [marketSegmentFilter, setMarketSegmentFilter] = useState<string>('all')
  const [companyFilter, setCompanyFilter] = useState<string>('all')
  const [branchNameFilter, setBranchNameFilter] = useState<string>('all')
  const [contactFirstNameFilter, setContactFirstNameFilter] = useState<string>('all')
  
  // Column visibility state
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
  } = useMasters('customer')

  const { options: companies } = useMasterOptions('company')
  const { options: customerTypes } = useMasterOptions('customer_type')

  // Create lookup maps
  const companyLookup = useMemo(() => {
    const lookup = new Map<string, string>()
    companies.forEach((company) => {
      const id = String(company.company_id || company.id)
      const name = company.company_name || company.name || id
      lookup.set(id, name)
    })
    return lookup
  }, [companies])

  const customerTypeLookup = useMemo(() => {
    const lookup = new Map<string, string>()
    customerTypes.forEach((type) => {
      const id = String(type.customer_type_id || type.id)
      const name = type.name || type.customer_type || id
      lookup.set(id, name)
    })
    return lookup
  }, [customerTypes])

  // Transform records to resolve company names and customer types
  const displayRecords = useMemo(() => {
    return (records || []).map((record: MasterRecord) => {
      const updatedRecord = { ...record }
      
      // Resolve company name
      if (record.company_name && companyLookup.has(String(record.company_name))) {
        updatedRecord.company_name = companyLookup.get(String(record.company_name)) || record.company_name
      }
      
      // Resolve customer type
      if (record.customer_type && customerTypeLookup.has(String(record.customer_type))) {
        updatedRecord.customer_type = customerTypeLookup.get(String(record.customer_type)) || record.customer_type
      }
      
      return updatedRecord
    })
  }, [records, companyLookup, customerTypeLookup])

  // Filter records
  const filteredRecords = displayRecords.filter((r: any) => {
    // Status tab filter
    if (statusTab !== 'all') {
      const recordStatus = (r.status || 'Active').toString()
      if (statusTab === 'Active' && recordStatus !== 'Active') return false
      if (statusTab === 'Inactive' && recordStatus !== 'Inactive') return false
    }
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const matchesSearch = (
        (r.customer_name || '').toLowerCase().includes(search) ||
        (r.company_name || '').toLowerCase().includes(search) ||
        (r.email || '').toLowerCase().includes(search) ||
        (r.phone || '').toLowerCase().includes(search) ||
        (r.industry || '').toLowerCase().includes(search)
      )
      if (!matchesSearch) return false
    }
    
    // Customer Type filter
    if (customerTypeFilter !== 'all') {
      const recordType = r.customer_type || ''
      if (recordType !== customerTypeFilter) return false
    }
    
    // Industry filter
    if (industryFilter !== 'all' && r.industry !== industryFilter) {
      return false
    }
    
    // Territory filter
    if (territoryFilter !== 'all' && r.territory !== territoryFilter) {
      return false
    }
    
    // Market Segment filter
    if (marketSegmentFilter !== 'all' && r.market_segment !== marketSegmentFilter) {
      return false
    }
    
    // Company filter
    if (companyFilter !== 'all' && r.company_name !== companyFilter) {
      return false
    }
    
    // Branch Name filter
    if (branchNameFilter !== 'all') {
      const branches = Array.isArray(r.branches) ? r.branches : []
      const hasMatchingBranch = branches.some((branch: any) => 
        (branch.branch_name || '').toString() === branchNameFilter
      )
      if (!hasMatchingBranch) return false
    }
    
    // Contact First Name filter
    if (contactFirstNameFilter !== 'all') {
      const contacts = Array.isArray(r.contacts) ? r.contacts : []
      const hasMatchingContact = contacts.some((contact: any) => 
        (contact.first_name || '').toString() === contactFirstNameFilter
      )
      if (!hasMatchingContact) return false
    }
    
    return true
  })

  // Get status counts
  const getStatusCounts = () => {
    const counts = { all: 0, Active: 0, Inactive: 0 }
    displayRecords.forEach((r: any) => {
      counts.all++
      const status = (r.status || 'Active').toString()
      if (status === 'Active') counts.Active++
      else if (status === 'Inactive') counts.Inactive++
    })
    return counts
  }

  const statusCounts = getStatusCounts()

  // Extract unique values for dropdowns
  const getUniqueIndustries = () => {
    const industries = new Set<string>()
    displayRecords.forEach((r: any) => {
      if (r.industry) industries.add(r.industry)
    })
    return Array.from(industries).sort()
  }

  const getUniqueTerritories = () => {
    const territories = new Set<string>()
    displayRecords.forEach((r: any) => {
      if (r.territory) territories.add(r.territory)
    })
    return Array.from(territories).sort()
  }

  const getUniqueMarketSegments = () => {
    const segments = new Set<string>()
    displayRecords.forEach((r: any) => {
      if (r.market_segment) segments.add(r.market_segment)
    })
    return Array.from(segments).sort()
  }

  const getUniqueCompanies = () => {
    const companies = new Set<string>()
    displayRecords.forEach((r: any) => {
      if (r.company_name) companies.add(r.company_name)
    })
    return Array.from(companies).sort()
  }

  const getUniqueCustomerTypes = () => {
    const types = new Set<string>()
    displayRecords.forEach((r: any) => {
      if (r.customer_type) types.add(r.customer_type)
    })
    return Array.from(types).sort()
  }

  const getUniqueBranchNames = () => {
    const branchNames = new Set<string>()
    displayRecords.forEach((r: any) => {
      if (Array.isArray(r.branches)) {
        r.branches.forEach((branch: any) => {
          if (branch.branch_name) branchNames.add(branch.branch_name)
        })
      }
    })
    return Array.from(branchNames).sort()
  }

  const getUniqueContactFirstNames = () => {
    const firstNames = new Set<string>()
    displayRecords.forEach((r: any) => {
      if (Array.isArray(r.contacts)) {
        r.contacts.forEach((contact: any) => {
          if (contact.first_name) firstNames.add(contact.first_name)
        })
      }
    })
    return Array.from(firstNames).sort()
  }

  const hasActiveFilters = customerTypeFilter !== 'all' || industryFilter !== 'all' || 
    territoryFilter !== 'all' || marketSegmentFilter !== 'all' || companyFilter !== 'all' ||
    branchNameFilter !== 'all' || contactFirstNameFilter !== 'all'

  const clearAllFilters = () => {
    setCustomerTypeFilter('all')
    setIndustryFilter('all')
    setTerritoryFilter('all')
    setMarketSegmentFilter('all')
    setCompanyFilter('all')
    setBranchNameFilter('all')
    setContactFirstNameFilter('all')
    setSearchTerm('')
  }

  const handleAdd = () => {
    setEditingRecord(null)
    setIsFormOpen(true)
  }

  const handleEdit = (record: MasterRecord) => {
    setEditingRecord(record)
    setIsFormOpen(true)
  }

  const handleView = (record: MasterRecord) => {
    const recordId = record.customer_id || record.id
    navigate(`/customers/${recordId}`)
  }

  const handleDelete = async (record: MasterRecord) => {
    if (window.confirm(`Are you sure you want to delete customer "${record.customer_name}"?`)) {
      try {
        const recordId = record.customer_id || record.id
        await deleteRecord(String(recordId))
        setSuccessMessage('Customer deleted successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
      } catch (error) {
        alert('Failed to delete customer')
      }
    }
  }

  const handleFormSubmit = async (data: MasterRecord) => {
    try {
      if (editingRecord) {
        const recordId = editingRecord.customer_id || editingRecord.id
        await updateRecord({ id: String(recordId), data })
        setSuccessMessage('Customer updated successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        await createRecord(data)
        setSuccessMessage('Customer created successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
      }
      setIsFormOpen(false)
      setEditingRecord(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to save customer: ${errorMessage}`)
    }
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setEditingRecord(null)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">Manage customer information, branches, and contacts</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Customers</h2>
                <p className="text-gray-600">Manage customer records</p>
              </div>
              <Button onClick={handleAdd} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Customer</span>
              </Button>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-2 mb-6 pb-4 border-b">
              <button
                onClick={() => setStatusTab('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  statusTab === 'all'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Customers
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  statusTab === 'all'
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {statusCounts.all}
                </span>
              </button>
              
              <button
                onClick={() => setStatusTab('Active')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  statusTab === 'Active'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Active
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  statusTab === 'Active'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {statusCounts.Active}
                </span>
              </button>
              
              <button
                onClick={() => setStatusTab('Inactive')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  statusTab === 'Inactive'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Inactive
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  statusTab === 'Inactive'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {statusCounts.Inactive}
                </span>
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading customers...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search customers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
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
                              customerTypeFilter !== 'all' ? 1 : 0,
                              industryFilter !== 'all' ? 1 : 0,
                              territoryFilter !== 'all' ? 1 : 0,
                              marketSegmentFilter !== 'all' ? 1 : 0,
                              companyFilter !== 'all' ? 1 : 0,
                              branchNameFilter !== 'all' ? 1 : 0,
                              contactFirstNameFilter !== 'all' ? 1 : 0
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
                            <p className="text-xs text-gray-500 mt-0.5">Filter customers by various criteria</p>
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
                          {/* Customer Type Filter */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Customer Type</Label>
                            <Select value={customerTypeFilter} onValueChange={setCustomerTypeFilter}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px]">
                                <SelectItem value="all">All Types</SelectItem>
                                {getUniqueCustomerTypes().map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Industry Filter */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Industry</Label>
                            <Select value={industryFilter} onValueChange={setIndustryFilter}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select industry" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px]">
                                <SelectItem value="all">All Industries</SelectItem>
                                {getUniqueIndustries().map((industry) => (
                                  <SelectItem key={industry} value={industry}>
                                    {industry}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Territory Filter */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Territory</Label>
                            <Select value={territoryFilter} onValueChange={setTerritoryFilter}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select territory" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px]">
                                <SelectItem value="all">All Territories</SelectItem>
                                {getUniqueTerritories().map((territory) => (
                                  <SelectItem key={territory} value={territory}>
                                    {territory}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Market Segment Filter */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Market Segment</Label>
                            <Select value={marketSegmentFilter} onValueChange={setMarketSegmentFilter}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select segment" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px]">
                                <SelectItem value="all">All Segments</SelectItem>
                                {getUniqueMarketSegments().map((segment) => (
                                  <SelectItem key={segment} value={segment}>
                                    {segment}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Company Filter */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Company</Label>
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

                          {/* Branch Name Filter */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Branch Name</Label>
                            <Select value={branchNameFilter} onValueChange={setBranchNameFilter}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select branch" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px]">
                                <SelectItem value="all">All Branches</SelectItem>
                                {getUniqueBranchNames().map((branchName) => (
                                  <SelectItem key={branchName} value={branchName}>
                                    {branchName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Contact First Name Filter */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Contact First Name</Label>
                            <Select value={contactFirstNameFilter} onValueChange={setContactFirstNameFilter}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select contact" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px]">
                                <SelectItem value="all">All Contacts</SelectItem>
                                {getUniqueContactFirstNames().map((firstName) => (
                                  <SelectItem key={firstName} value={firstName}>
                                    {firstName}
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
                        {visibleColumns.customerName && <TableHead>CUSTOMER NAME</TableHead>}
                        {visibleColumns.companyName && <TableHead>COMPANY NAME</TableHead>}
                        {visibleColumns.customerType && <TableHead>CUSTOMER TYPE</TableHead>}
                        {visibleColumns.industry && <TableHead>INDUSTRY</TableHead>}
                        {visibleColumns.email && <TableHead>EMAIL</TableHead>}
                        {visibleColumns.phone && <TableHead>PHONE</TableHead>}
                        {visibleColumns.gstNumber && <TableHead>GST NUMBER</TableHead>}
                        {visibleColumns.panNumber && <TableHead>PAN NUMBER</TableHead>}
                        {visibleColumns.website && <TableHead>WEBSITE</TableHead>}
                        {visibleColumns.territory && <TableHead>TERRITORY</TableHead>}
                        {visibleColumns.marketSegment && <TableHead>MARKET SEGMENT</TableHead>}
                        {visibleColumns.status && <TableHead>STATUS</TableHead>}
                        {visibleColumns.numberOfEmployees && <TableHead>EMPLOYEES</TableHead>}
                        {visibleColumns.annualRevenue && <TableHead>ANNUAL REVENUE</TableHead>}
                        {visibleColumns.actions && <TableHead className="w-32">ACTIONS</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={Object.values(visibleColumns).filter(v => v).length} className="text-center py-8">
                            <div className="text-muted-foreground">
                              {searchTerm || statusTab !== 'all' || hasActiveFilters
                                ? 'No customers match your filters' 
                                : 'No customers found'}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRecords.map((record: any, index: number) => (
                          <TableRow key={record.customer_id || record.id || index}>
                            {visibleColumns.customerName && (
                              <TableCell>
                                <div className="font-medium">{record.customer_name || '-'}</div>
                              </TableCell>
                            )}
                            {visibleColumns.companyName && (
                              <TableCell>
                                <div className="text-sm">{record.company_name || '-'}</div>
                              </TableCell>
                            )}
                            {visibleColumns.customerType && (
                              <TableCell>
                                <div className="text-sm">{record.customer_type || '-'}</div>
                              </TableCell>
                            )}
                            {visibleColumns.industry && (
                              <TableCell>
                                <div className="text-sm">{record.industry || '-'}</div>
                              </TableCell>
                            )}
                            {visibleColumns.email && (
                              <TableCell>
                                <div className="text-sm">{record.email || '-'}</div>
                              </TableCell>
                            )}
                            {visibleColumns.phone && (
                              <TableCell>
                                <div className="text-sm">{record.phone || '-'}</div>
                              </TableCell>
                            )}
                            {visibleColumns.gstNumber && (
                              <TableCell>
                                <div className="text-sm">{record.gst_number || '-'}</div>
                              </TableCell>
                            )}
                            {visibleColumns.panNumber && (
                              <TableCell>
                                <div className="text-sm">{record.pan_number || '-'}</div>
                              </TableCell>
                            )}
                            {visibleColumns.website && (
                              <TableCell>
                                <div className="text-sm truncate max-w-xs">{record.website || '-'}</div>
                              </TableCell>
                            )}
                            {visibleColumns.territory && (
                              <TableCell>
                                <div className="text-sm">{record.territory || '-'}</div>
                              </TableCell>
                            )}
                            {visibleColumns.marketSegment && (
                              <TableCell>
                                <div className="text-sm">{record.market_segment || '-'}</div>
                              </TableCell>
                            )}
                            {visibleColumns.status && (
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  (record.status || 'Active') === 'Active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {record.status || 'Active'}
                                </span>
                              </TableCell>
                            )}
                            {visibleColumns.numberOfEmployees && (
                              <TableCell>
                                <div className="text-sm">{record.number_of_employees ? record.number_of_employees.toLocaleString() : '-'}</div>
                              </TableCell>
                            )}
                            {visibleColumns.annualRevenue && (
                              <TableCell>
                                <div className="text-sm">{record.annual_revenue ? `₹${record.annual_revenue.toLocaleString()}` : '-'}</div>
                              </TableCell>
                            )}
                            {visibleColumns.actions && (
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleView(record)} 
                                    className="h-8 w-8 p-0" 
                                    title="View"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleEdit(record)} className="h-8 w-8 p-0" title="Edit">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDelete(record)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
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
          title={editingRecord ? 'Edit Customer' : 'Add New Customer'}
          description={editingRecord ? 'Update the customer information' : 'Fill in the details to create a new customer'}
        >
          <CustomerForm
            initialData={editingRecord || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isCreating || isUpdating}
          />
        </SlideOver>
      </div>
    </MainLayout>
  )
}
