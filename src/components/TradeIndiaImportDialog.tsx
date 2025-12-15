import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { importTradeIndiaLeads, saveTradeIndiaConfig, getTradeIndiaConfig, testTradeIndiaConnection } from '../lib/tradeIndiaApi'
import { Loader2, Download, Settings, CheckCircle, AlertCircle } from 'lucide-react'

const importSchema = z.object({
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  limit: z.string().optional()
}).refine((data) => {
  const fromDate = new Date(data.from_date)
  const toDate = new Date(data.to_date)
  return toDate >= fromDate
}, {
  message: 'To date must be after or equal to from date',
  path: ['to_date']
})

type ImportFormData = z.infer<typeof importSchema>

interface TradeIndiaImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (leads: any[]) => Promise<void>
}

export default function TradeIndiaImportDialog({ 
  open, 
  onOpenChange, 
  onImport 
}: TradeIndiaImportDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; count: number; message?: string } | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)
  
  const config = getTradeIndiaConfig()
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ImportFormData>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      // Default to last 30 days
      from_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to_date: new Date().toISOString().split('T')[0],
      limit: ''
    }
  })

  const [apiConfig, setApiConfig] = useState({
    userid: config.userid,
    profile_id: config.profile_id,
    key: config.key,
    apiUrl: config.apiUrl
  })

  const handleImport = async (data: ImportFormData) => {
    setIsLoading(true)
    setImportResult(null)
    
    try {
      const leads = await importTradeIndiaLeads({
        from_date: data.from_date,
        to_date: data.to_date,
        limit: data.limit ? parseInt(data.limit) : undefined
      })

      if (leads.length === 0) {
        setImportResult({
          success: true,
          count: 0,
          message: 'No new leads found for the selected date range.'
        })
        setIsLoading(false)
        return
      }

      // Import leads
      await onImport(leads)
      
      setImportResult({
        success: true,
        count: leads.length,
        message: `Successfully imported ${leads.length} lead(s) from TradeIndia.`
      })
      
      // Reset form after successful import
      setTimeout(() => {
        setImportResult(null)
        onOpenChange(false)
      }, 2000)
    } catch (error) {
      console.error('Import error:', error)
      let errorMessage = error instanceof Error ? error.message : 'Failed to import leads. Please check your API credentials and try again.'
      
      // Provide more helpful messages for common errors
      if (errorMessage.includes('maintenance')) {
        errorMessage = '🛠️ ' + errorMessage + ' Your integration is working correctly - the TradeIndia service will be back online soon.'
      } else if (errorMessage.includes('404')) {
        errorMessage += ' Please verify the API endpoint URL in API Settings. The endpoint might be incorrect or the API structure may have changed.'
      } else if (errorMessage.includes('CORS')) {
        errorMessage += ' Please restart your development server after the proxy configuration changes.'
      }
      
      setImportResult({
        success: false,
        count: 0,
        message: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveConfig = () => {
    saveTradeIndiaConfig(apiConfig)
    setIsConfigOpen(false)
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    setImportResult(null)
    
    try {
      const formData = watch()
      const testResponse = await testTradeIndiaConnection({
        from_date: formData.from_date,
        to_date: formData.to_date,
        limit: formData.limit ? parseInt(formData.limit) : undefined
      })
      
      const resultText = `Test Connection Results:\n\nURL: ${testResponse.url}\n\nRaw Response (first 2000 chars):\n${testResponse.rawResponse.substring(0, 2000)}\n\nParsed JSON:\n${JSON.stringify(testResponse.parsed, null, 2).substring(0, 2000)}`
      
      setTestResult(resultText)
    } catch (error) {
      setTestResult(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck browser console (F12) for more details.`)
    } finally {
      setIsTesting(false)
    }
  }

  // Set default dates when dialog opens
  useEffect(() => {
    if (open) {
      const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const toDate = new Date().toISOString().split('T')[0]
      setValue('from_date', fromDate)
      setValue('to_date', toDate)
    }
  }, [open, setValue])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Import Leads from TradeIndia
            </DialogTitle>
            <DialogDescription>
              Fetch leads from TradeIndia API and import them as inquiries
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* API Config Button */}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsConfigOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                API Settings
              </Button>
            </div>

            {importResult && (
              <div className={`p-3 rounded-lg flex items-start gap-2 ${
                importResult.success 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {importResult.success ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{importResult.success ? 'Success!' : 'Error'}</p>
                  <p className="text-sm">{importResult.message}</p>
                </div>
              </div>
            )}

            {testResult && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-blue-900">API Test Results</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTestResult(null)}
                  >
                    Close
                  </Button>
                </div>
                <pre className="text-xs bg-white p-3 rounded border max-h-60 overflow-auto text-blue-800 whitespace-pre-wrap break-words">
                  {testResult}
                </pre>
                <p className="text-xs text-blue-600 mt-2">
                  💡 Check browser console (F12) for full response details
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit(handleImport)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="from_date">From Date <span className="text-destructive">*</span></Label>
                <Input
                  id="from_date"
                  type="date"
                  {...register('from_date')}
                />
                {errors.from_date && (
                  <p className="text-xs text-destructive">{errors.from_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="to_date">To Date <span className="text-destructive">*</span></Label>
                <Input
                  id="to_date"
                  type="date"
                  {...register('to_date')}
                />
                {errors.to_date && (
                  <p className="text-xs text-destructive">{errors.to_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="limit">Limit (Optional)</Label>
                <Input
                  id="limit"
                  type="number"
                  placeholder="Leave empty for all leads"
                  {...register('limit')}
                />
                {errors.limit && (
                  <p className="text-xs text-destructive">{errors.limit.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Maximum number of leads to import. Leave empty to import all.
                </p>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isLoading || isTesting}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false)
                      setTestResult(null)
                    }}
                    disabled={isLoading || isTesting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading || isTesting}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Import Leads
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* API Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>TradeIndia API Configuration</DialogTitle>
            <DialogDescription>
              Configure your TradeIndia API credentials
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="config_userid">User ID</Label>
              <Input
                id="config_userid"
                value={apiConfig.userid}
                onChange={(e) => setApiConfig({ ...apiConfig, userid: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="config_profile_id">Profile ID</Label>
              <Input
                id="config_profile_id"
                value={apiConfig.profile_id}
                onChange={(e) => setApiConfig({ ...apiConfig, profile_id: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="config_key">API Key</Label>
              <Input
                id="config_key"
                type="password"
                value={apiConfig.key}
                onChange={(e) => setApiConfig({ ...apiConfig, key: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="config_apiUrl">API URL</Label>
              <Input
                id="config_apiUrl"
                value={apiConfig.apiUrl}
                onChange={(e) => setApiConfig({ ...apiConfig, apiUrl: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setApiConfig(config)
                  setIsConfigOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveConfig}>
                Save Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

