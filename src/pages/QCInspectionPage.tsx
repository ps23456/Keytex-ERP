import { useState, useMemo } from 'react'
import MainLayout from '../layouts/MainLayout'
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
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { Plus, Filter, LayoutGrid, List, Eye, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { loadQCReports, deleteQCReport, QCInspectionReport } from '../lib/qcStorage'
import QCInspectionForm from '../components/QCInspectionForm'

type DisplayFormat = 'grid' | 'table' | 'list'

export default function QCInspectionPage() {
  const [reports, setReports] = useState<QCInspectionReport[]>(() => loadQCReports())
  const [displayFormat, setDisplayFormat] = useState<DisplayFormat>('table')
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<QCInspectionReport | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [customerFilter, setCustomerFilter] = useState<string>('all')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [jobCardFilter, setJobCardFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const customers = useMemo(() => {
    const unique = new Set<string>()
    reports.forEach((report) => {
      if (report.inProcessInspection.customer) {
        unique.add(report.inProcessInspection.customer)
      }
    })
    return Array.from(unique).sort()
  }, [reports])

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesSearch =
          (report.inProcessInspection.customer || '').toLowerCase().includes(search) ||
          (report.inProcessInspection.itemName || '').toLowerCase().includes(search) ||
          (report.rmInspection.jobCardNo || '').toLowerCase().includes(search)
        if (!matchesSearch) return false
      }

      // Customer filter
      if (customerFilter !== 'all' && report.inProcessInspection.customer !== customerFilter) {
        return false
      }

      // Job Card filter
      if (jobCardFilter && !report.rmInspection.jobCardNo.toLowerCase().includes(jobCardFilter.toLowerCase())) {
        return false
      }

      // Date range filter
      if (dateFromFilter) {
        const reportDate = new Date(report.rmInspection.date)
        const fromDate = new Date(dateFromFilter)
        if (reportDate < fromDate) return false
      }
      if (dateToFilter) {
        const reportDate = new Date(report.rmInspection.date)
        const toDate = new Date(dateToFilter)
        toDate.setHours(23, 59, 59, 999)
        if (reportDate > toDate) return false
      }

      return true
    })
  }, [reports, searchTerm, customerFilter, dateFromFilter, dateToFilter, jobCardFilter, statusFilter])

  const handleFormSuccess = () => {
    setReports(loadQCReports())
    setIsFormOpen(false)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this QC inspection report?')) {
      deleteQCReport(id)
      setReports(loadQCReports())
    }
  }

  const hasActiveFilters =
    customerFilter !== 'all' ||
    dateFromFilter !== '' ||
    dateToFilter !== '' ||
    jobCardFilter !== '' ||
    statusFilter !== 'all'

  const clearAllFilters = () => {
    setCustomerFilter('all')
    setDateFromFilter('')
    setDateToFilter('')
    setJobCardFilter('')
    setStatusFilter('all')
    setSearchTerm('')
  }

  return (
    <MainLayout>
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-80 bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-fit sticky top-24">
          <div className="space-y-6">
            {/* Display Format */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Display Format</Label>
              <div className="flex gap-2">
                <Button
                  variant={displayFormat === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDisplayFormat('table')}
                  className="flex-1"
                >
                  <List className="h-4 w-4 mr-1" />
                  Table
                </Button>
                <Button
                  variant={displayFormat === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDisplayFormat('grid')}
                  className="flex-1"
                >
                  <LayoutGrid className="h-4 w-4 mr-1" />
                  Grid
                </Button>
              </div>
            </div>

            {/* More Filters */}
            <div>
              <button
                onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
                className="w-full flex items-center justify-between p-2 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">More Filters</span>
                  {hasActiveFilters && (
                    <span className="h-5 w-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                      {[
                        customerFilter !== 'all' ? 1 : 0,
                        dateFromFilter ? 1 : 0,
                        dateToFilter ? 1 : 0,
                        jobCardFilter ? 1 : 0,
                        statusFilter !== 'all' ? 1 : 0,
                      ].reduce((a, b) => a + b, 0)}
                    </span>
                  )}
                </div>
                {isMoreFiltersOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {isMoreFiltersOpen && (
                <div className="mt-3 space-y-4 p-3 bg-slate-50 rounded-md border border-slate-200">
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="w-full text-xs"
                    >
                      Clear all filters
                    </Button>
                  )}

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium">Customer</Label>
                      <Select value={customerFilter} onValueChange={setCustomerFilter}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="All Customers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Customers</SelectItem>
                          {customers.map((customer) => (
                            <SelectItem key={customer} value={customer}>
                              {customer}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs font-medium">Job Card No</Label>
                      <Input
                        value={jobCardFilter}
                        onChange={(e) => setJobCardFilter(e.target.value)}
                        placeholder="Filter by job card..."
                        className="h-8 text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-medium">Date From</Label>
                      <Input
                        type="date"
                        value={dateFromFilter}
                        onChange={(e) => setDateFromFilter(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-medium">Date To</Label>
                      <Input
                        type="date"
                        value={dateToFilter}
                        onChange={(e) => setDateToFilter(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-medium">Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Create Form Button */}
            <Button
              onClick={() => setIsFormOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          </div>
        </div>

        {/* Main Display Area */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">QC Inspection Reports</h1>
              <p className="text-slate-600 mt-1">Quality Check/Inspection Report Management</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <Input
              placeholder="Search by customer, item name, or job card number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Display Section */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            {displayFormat === 'table' ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Card No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Prepared By</TableHead>
                      <TableHead>Approved By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                          No QC inspection reports found. Click "Create Form" to add a new report.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">
                            {report.rmInspection.jobCardNo || '-'}
                          </TableCell>
                          <TableCell>
                            {new Date(report.rmInspection.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{report.inProcessInspection.customer || '-'}</TableCell>
                          <TableCell>{report.inProcessInspection.itemName || '-'}</TableCell>
                          <TableCell>{report.inProcessInspection.material || '-'}</TableCell>
                          <TableCell>{report.preparedBy || '-'}</TableCell>
                          <TableCell>{report.approvedBy || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedReport(report)}
                                className="h-8 w-8"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(report.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredReports.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                      No QC inspection reports found. Click "Create Form" to add a new report.
                    </div>
                  ) : (
                    filteredReports.map((report) => (
                      <Card key={report.id}>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {report.inProcessInspection.itemName || 'Untitled Report'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="text-sm">
                            <span className="font-medium">Job Card:</span>{' '}
                            {report.rmInspection.jobCardNo || '-'}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Customer:</span>{' '}
                            {report.inProcessInspection.customer || '-'}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Date:</span>{' '}
                            {new Date(report.rmInspection.date).toLocaleDateString()}
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedReport(report)}
                              className="flex-1"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(report.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create QC Inspection Report</DialogTitle>
          </DialogHeader>
          <QCInspectionForm
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>QC Inspection Report Details</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6">
              {/* RM Inspection */}
              <div>
                <h3 className="text-lg font-bold mb-3">RM INSPECTION</h3>
                <div className="space-y-2 text-sm">
                  {selectedReport.rmInspection.materialSpecification && (
                    <div><strong>Material Specification:</strong> {selectedReport.rmInspection.materialSpecification}</div>
                  )}
                  <div><strong>Job Card No:</strong> {selectedReport.rmInspection.jobCardNo}</div>
                  <div><strong>Date:</strong> {new Date(selectedReport.rmInspection.date).toLocaleDateString()}</div>
                  {selectedReport.rmInspection.remarks && (
                    <div><strong>Remarks:</strong> {selectedReport.rmInspection.remarks}</div>
                  )}
                </div>
              </div>

              {/* In Process Inspection */}
              <div>
                <h3 className="text-lg font-bold mb-3">IN PROCESS INSPECTION</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>ISO Standard:</strong> {selectedReport.inProcessInspection.isoStandard || '-'}</div>
                  <div><strong>Order Qty:</strong> {selectedReport.inProcessInspection.orderQty || '-'}</div>
                  <div><strong>Checked Qty:</strong> {selectedReport.inProcessInspection.checkedQty || '-'}</div>
                  <div><strong>Measurement Unit:</strong> {selectedReport.inProcessInspection.measurementUnit || '-'}</div>
                  <div><strong>Customer:</strong> {selectedReport.inProcessInspection.customer || '-'}</div>
                  <div><strong>Item Name:</strong> {selectedReport.inProcessInspection.itemName || '-'}</div>
                  <div className="col-span-2"><strong>Material:</strong> {selectedReport.inProcessInspection.material || '-'}</div>
                </div>
              </div>

              {/* Final Results */}
              <div>
                <h3 className="text-lg font-bold mb-3">FINAL RESULTS</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Final Result:</strong> {selectedReport.finalResults.finalResult || '-'}</div>
                  <div><strong>Hardening:</strong> {selectedReport.finalResults.hardening || '-'}</div>
                  <div><strong>Grinding:</strong> {selectedReport.finalResults.grinding || '-'}</div>
                  <div><strong>Surface Treatment:</strong> {selectedReport.finalResults.surfaceTreatment || '-'}</div>
                  <div className="col-span-2"><strong>Aesthetic Appearance:</strong> {selectedReport.finalResults.aestheticAppearance || '-'}</div>
                </div>
              </div>

              {selectedReport.remarks && (
                <div>
                  <h3 className="text-lg font-bold mb-3">REMARKS</h3>
                  <p className="text-sm">{selectedReport.remarks}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Prepared By:</strong> {selectedReport.preparedBy || '-'}</div>
                <div><strong>Approved By:</strong> {selectedReport.approvedBy || '-'}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}

