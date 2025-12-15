import { useState } from 'react'
import { FieldSchema, getMasterIdField } from '../lib/schemas'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from './ui/table'
import { Eye, Edit, Trash2, Search } from 'lucide-react'

interface MasterDataTableProps {
  masterKey: string
  schema: FieldSchema[]
  records: MasterRecord[]
  isLoading: boolean
  onView: (record: MasterRecord) => void
  onEdit: (record: MasterRecord) => void
  onDelete: (record: MasterRecord) => void
}

export default function MasterDataTable({
  masterKey,
  schema,
  records,
  isLoading,
  onView,
  onEdit,
  onDelete
}: MasterDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Custom column selections for specific masters
  const CUSTOM_COLUMN_MAP: Record<string, string[]> = {
    job_card_template: ['template_name', 'template_code', 'status']
  }

  const getDisplayColumns = () => {
    const customKeys = CUSTOM_COLUMN_MAP[masterKey]
    if (customKeys) {
      return customKeys
        .map((key) => schema.find((field) => field.key === key))
        .filter((field): field is FieldSchema => Boolean(field))
    }

    // Default behavior: exclude auto/image/computed and limit to 6 columns
    return schema
      .filter(
        (field) => field.ui !== 'auto' && field.ui !== 'image' && field.ui !== 'computed'
      )
      .slice(0, 6)
  }

  const displayColumns = getDisplayColumns()

  // Filter and sort records
  const filteredRecords = Array.isArray(records) ? records
    .filter(record => {
      if (!searchTerm) return true
      return displayColumns.some(field => {
        const value = record[field.key]
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      })
    })
    .sort((a, b) => {
      if (!sortField) return 0
      const aVal = a[sortField] || ''
      const bVal = b[sortField] || ''
      const comparison = aVal.toString().localeCompare(bVal.toString())
      return sortDirection === 'asc' ? comparison : -comparison
    }) : []

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading {masterKey} data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!Array.isArray(records)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive">Failed to load data. Records is not an array.</p>
            <p className="text-muted-foreground text-sm mt-2">Type: {typeof records}</p>
            <p className="text-muted-foreground text-sm">Value: {JSON.stringify(records)}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleSort = (fieldKey: string) => {
    if (sortField === fieldKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(fieldKey)
      setSortDirection('asc')
    }
  }

  const formatValue = (value: any, field: FieldSchema) => {
    if (field.key === 'operations') {
      if (!value) return '0 operations'
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value
        if (Array.isArray(parsed)) {
          const count = parsed.length
          return `${count} operation${count === 1 ? '' : 's'}`
        }
        return '0 operations'
      } catch (error) {
        return '0 operations'
      }
    }

    if (value === null || value === undefined) return '-'
    
    switch (field.ui) {
      case 'date':
        return new Date(value).toLocaleDateString()
      case 'datetime':
        return new Date(value).toLocaleString()
      case 'time':
        return value
      case 'checkbox':
        return value ? 'Yes' : 'No'
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value
      default:
        return value.toString()
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Records ({filteredRecords.length})</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {displayColumns.map((field) => (
                  <TableHead 
                    key={field.key}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort(field.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{field.label}</span>
                      {sortField === field.key && (
                        <span className="text-xs">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={displayColumns.length + 1} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm ? 'No records match your search' : 'No records found'}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record, index) => (
                  <TableRow key={record[getMasterIdField(masterKey)] || index}>
                    {displayColumns.map((field) => (
                      <TableCell key={field.key}>
                        {formatValue(record[field.key], field)}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(record)}
                          className="h-8 w-8 p-0"
                          title="View record"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(record)}
                          className="h-8 w-8 p-0"
                          title="Edit record"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(record)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete record"
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
      </CardContent>
    </Card>
  )
}
