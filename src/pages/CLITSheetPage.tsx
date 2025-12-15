import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
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
import { Eye, Pencil, Trash2, Plus, Search, Filter } from 'lucide-react'
import { deleteCLITSheet, loadCLITSheets, CLITSheetEntry } from '../lib/clitSheetStorage'

export default function CLITSheetPage() {
  const [records, setRecords] = useState<CLITSheetEntry[]>(() => loadCLITSheets())
  const [selectedRecord, setSelectedRecord] = useState<CLITSheetEntry | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false)
  
  // Filters
  const [monthFilter, setMonthFilter] = useState<string>('all')
  const [machineNameFilter, setMachineNameFilter] = useState<string>('all')
  const [frequencyFilter, setFrequencyFilter] = useState<string>('all')
  const [stepFilter, setStepFilter] = useState<string>('all')

  const navigate = useNavigate()
  const location = useLocation()

  const machineNames = useMemo(() => {
    const unique = new Set<string>()
    records.forEach((record) => {
      if (record.machineName) unique.add(record.machineName)
    })
    return Array.from(unique).sort()
  }, [records])

  const months = useMemo(() => {
    const unique = new Set<string>()
    records.forEach((record) => {
      if (record.month) unique.add(record.month)
    })
    return Array.from(unique).sort().reverse()
  }, [records])

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const matchesSearch =
          (record.machineName || '').toLowerCase().includes(search) ||
          (record.month || '').toLowerCase().includes(search)
        if (!matchesSearch) return false
      }

      // Month filter
      if (monthFilter !== 'all' && record.month !== monthFilter) {
        return false
      }

      // Machine name filter
      if (machineNameFilter !== 'all' && record.machineName !== machineNameFilter) {
        return false
      }

      // Frequency filter (check if any task matches)
      if (frequencyFilter !== 'all') {
        const hasMatchingFrequency = record.tasks?.some(
          (task) => task.frequency === frequencyFilter
        )
        if (!hasMatchingFrequency) return false
      }

      // Step filter (check if any task matches)
      if (stepFilter !== 'all') {
        const hasMatchingStep = record.tasks?.some((task) => task.step === stepFilter)
        if (!hasMatchingStep) return false
      }

      return true
    })
  }, [records, searchTerm, monthFilter, machineNameFilter, frequencyFilter, stepFilter])

  const handleDelete = (record: CLITSheetEntry) => {
    if (window.confirm('Delete this CLIT sheet?')) {
      const updated = deleteCLITSheet(record.id)
      setRecords(updated)
      setSuccessMessage('CLIT sheet deleted.')
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  useEffect(() => {
    const success = (location.state as any)?.success
    if (success) {
      setSuccessMessage(success)
      setRecords(loadCLITSheets())
      setTimeout(() => setSuccessMessage(null), 3000)
      navigate(location.pathname, { replace: true })
    }
  }, [location.pathname, location.state, navigate])

  const hasActiveFilters =
    monthFilter !== 'all' ||
    machineNameFilter !== 'all' ||
    frequencyFilter !== 'all' ||
    stepFilter !== 'all'

  const clearAllFilters = () => {
    setMonthFilter('all')
    setMachineNameFilter('all')
    setFrequencyFilter('all')
    setStepFilter('all')
    setSearchTerm('')
  }

  const formatMonth = (month: string) => {
    if (!month) return '-'
    try {
      const [year, monthNum] = month.split('-')
      const date = new Date(parseInt(year), parseInt(monthNum) - 1)
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    } catch {
      return month
    }
  }

  const getTaskCount = (record: CLITSheetEntry) => {
    return record.tasks?.length || 0
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">CLIT Sheet</h1>
            <p className="text-slate-600 mt-1">Autonomous Maintenance - Cleaning, Lubrication, Inspection, Tightening</p>
          </div>
          <Button
            onClick={() => navigate('/clit-sheet/new')}
            className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Create CLIT Sheet</span>
          </Button>
        </div>

        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 text-sm">
            {successMessage}
          </div>
        )}

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-3 space-y-3 md:space-y-0 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by machine name or month..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>

                {/* More Filters Button */}
                <DropdownMenu open={isMoreFiltersOpen} onOpenChange={setIsMoreFiltersOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 relative">
                      <Filter className="h-4 w-4" />
                      More Filters
                      {hasActiveFilters && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                          {[
                            monthFilter !== 'all' ? 1 : 0,
                            machineNameFilter !== 'all' ? 1 : 0,
                            frequencyFilter !== 'all' ? 1 : 0,
                            stepFilter !== 'all' ? 1 : 0,
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
                          <p className="text-xs text-gray-500 mt-0.5">Filter CLIT sheets by various criteria</p>
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
                        {/* Month Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Month</Label>
                          <Select value={monthFilter} onValueChange={setMonthFilter}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select month" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Months</SelectItem>
                              {months.map((month) => (
                                <SelectItem key={month} value={month}>
                                  {formatMonth(month)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Machine Name Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Machine Name</Label>
                          <Select value={machineNameFilter} onValueChange={setMachineNameFilter}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select machine" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Machines</SelectItem>
                              {machineNames.map((machine) => (
                                <SelectItem key={machine} value={machine}>
                                  {machine}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Frequency Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Frequency</Label>
                          <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Frequencies</SelectItem>
                              <SelectItem value="Daily">Daily</SelectItem>
                              <SelectItem value="Weekly">Weekly</SelectItem>
                              <SelectItem value="Monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Step Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Step</Label>
                          <Select value={stepFilter} onValueChange={setStepFilter}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select step" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Steps</SelectItem>
                              <SelectItem value="Cleaning">Cleaning</SelectItem>
                              <SelectItem value="Lubrication">Lubrication</SelectItem>
                              <SelectItem value="Inspection">Inspection</SelectItem>
                              <SelectItem value="Tightening">Tightening</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Machine Name</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        No CLIT sheets found. Use "Create CLIT Sheet" to add a new one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {formatMonth(record.month)}
                        </TableCell>
                        <TableCell>{record.machineName || '-'}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                            {getTaskCount(record)} task{getTaskCount(record) !== 1 ? 's' : ''}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/clit-sheet/${record.id}`)}
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/clit-sheet/${record.id}/edit`)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(record)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
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

