import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { useMasters, useMasterOptions } from '../hooks/useMasters'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { X, User, Phone, Briefcase, Clock, Calendar, Play, Edit, Mail, MapPin, CheckCircle2, XCircle, Plus, Building, Users, History } from 'lucide-react'

interface Reminder {
  id: string
  date: string
  time: string
  note: string
}

interface ActivitySession {
  id: string
  type: string
  startTime: string
  endTime: string
  duration: number // in seconds
  note: string
  outcome: string
}

const OUTCOME_OPTIONS = ['Completed', 'No Answer', 'Busy', 'Call Back', 'Not Interested', 'Interested', 'Follow Up Required', 'Rescheduled', 'Cancelled']

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { records } = useMasters('customer')
  const { options: companies } = useMasterOptions('company')
  const { options: customerTypes } = useMasterOptions('customer_type')
  const [customer, setCustomer] = useState<any>(null)

  // Create a lookup map for company IDs to company names
  const companyLookup = useMemo(() => {
    const lookup = new Map<string, string>()
    companies.forEach((company) => {
      const id = String(company.company_id || company.id)
      const name = company.company_name || company.name || id
      lookup.set(id, name)
    })
    return lookup
  }, [companies])

  // Create a lookup map for customer type IDs to customer type names
  const customerTypeLookup = useMemo(() => {
    const lookup = new Map<string, string>()
    customerTypes.forEach((type) => {
      const id = String(type.customer_type_id || type.id)
      const name = type.name || type.customer_type || id
      lookup.set(id, name)
    })
    return lookup
  }, [customerTypes])
  const [activeTab, setActiveTab] = useState('history')
  const [isEditing, setIsEditing] = useState(false)
  const [activityType, setActivityType] = useState('Call')
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [totalTimeSpent, setTotalTimeSpent] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [sessionNote, setSessionNote] = useState('')
  const [sessionOutcome, setSessionOutcome] = useState('')
  const [activitySessions, setActivitySessions] = useState<ActivitySession[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [showReminderForm, setShowReminderForm] = useState(false)
  const [reminderDate, setReminderDate] = useState('')
  const [reminderTime, setReminderTime] = useState({ hours: '00', minutes: '00', ampm: 'AM' })

  useEffect(() => {
    if (id && records) {
      const found = records.find((r: any) => {
        const recordId = r.customer_id || r.id
        return String(recordId) === String(id)
      })
      if (found) {
        // Resolve company name and customer type from IDs
        let customerData = { ...found }
        if (customerData.company_name && companyLookup.has(String(customerData.company_name))) {
          customerData.company_name = companyLookup.get(String(customerData.company_name)) || customerData.company_name
        }
        if (customerData.customer_type && customerTypeLookup.has(String(customerData.customer_type))) {
          customerData.customer_type = customerTypeLookup.get(String(customerData.customer_type)) || customerData.customer_type
        }
        setCustomer(customerData)
        // Load activity sessions from customer data
        if (customerData.activitySessions && Array.isArray(customerData.activitySessions)) {
          setActivitySessions(customerData.activitySessions)
        }
      }
    }
  }, [id, records, companyLookup, customerTypeLookup])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerRunning])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0')
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
    const secs = (seconds % 60).toString().padStart(2, '0')
    return `${hrs}:${mins}:${secs}`
  }

  const handleStartTimer = () => {
    setTimerRunning(true)
    setSessionStartTime(new Date())
    setSessionNote('')
    setSessionOutcome('')
  }

  const handleStopTimer = () => {
    if (!sessionStartTime) return
    
    const endTime = new Date()
    const newSession: ActivitySession = {
      id: `session_${Date.now()}`,
      type: activityType,
      startTime: sessionStartTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: timerSeconds,
      note: sessionNote,
      outcome: sessionOutcome || 'Completed'
    }
    
    setActivitySessions(prev => [newSession, ...prev])
    setTotalTimeSpent(prev => prev + timerSeconds)
    setTimerRunning(false)
    setTimerSeconds(0)
    setSessionStartTime(null)
    setSessionNote('')
    setSessionOutcome('')
    
    // Save to customer record (you might want to persist this to backend)
    if (customer) {
      const updatedSessions = [newSession, ...activitySessions]
      // You can add logic here to save to backend/database
    }
  }

  const handleAddReminder = () => {
    if (!reminderDate || !reminderTime.hours || !reminderTime.minutes) return
    const newReminder: Reminder = {
      id: `reminder_${Date.now()}`,
      date: reminderDate,
      time: `${reminderTime.hours}:${reminderTime.minutes} ${reminderTime.ampm}`,
      note: ''
    }
    setReminders([...reminders, newReminder])
    setReminderDate('')
    setReminderTime({ hours: '00', minutes: '00', ampm: 'AM' })
    setShowReminderForm(false)
  }

  const handleDeleteReminder = (reminderId: string) => {
    setReminders(reminders.filter(r => r.id !== reminderId))
  }

  if (!customer) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading customer...</p>
        </div>
      </MainLayout>
    )
  }

  const primaryContact = customer.contacts?.find((c: any) => c.primary_contact) || customer.contacts?.[0]
  const customerPhone = primaryContact?.mobile_number || customer.phone || '-'

  const tabs = [
    { id: 'history', label: 'History', icon: History },
    { id: 'company-information', label: 'Company Information', icon: Building },
    { id: 'organization-detail', label: 'Organization Detail', icon: Briefcase },
    { id: 'branch', label: 'Branch', icon: Building },
    { id: 'contact', label: 'Contact', icon: Users },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header with Close Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{customer.customer_name || 'Customer'}</h1>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>{customerPhone}</span>
              </div>
              {customer.company_name && (
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>{customer.company_name}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>{customer.email}</span>
                </div>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/customers')}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 py-3 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center space-x-2 px-1 py-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                      ${isActive 
                        ? 'border-blue-600 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="flex">
            {/* Left Sidebar */}
            <div className="w-80 border-r p-6 space-y-6 bg-gray-50">
              {/* Activity Timer */}
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <h3 className="font-medium text-sm">Activity Timer</h3>
                  </div>
                  <Select value={activityType} onValueChange={setActivityType}>
                    <SelectTrigger className="h-8 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Call">Call</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Meeting">Meeting</SelectItem>
                      <SelectItem value="Note">Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-center mb-4">
                  <div className="text-3xl font-mono font-bold text-gray-900 mb-1">
                    {formatTime(timerSeconds)}
                  </div>
                  <p className="text-xs text-gray-500">{timerRunning ? 'Timer Running' : 'Timer Stopped'}</p>
                </div>
                <div className="bg-gray-100 rounded px-3 py-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Total Time Spent</span>
                    <span className="font-medium">{formatTime(totalTimeSpent)}</span>
                  </div>
                </div>
                
                {timerRunning && (
                  <div className="space-y-3 mb-4">
                    <div>
                      <Label className="text-xs mb-1 block">Note</Label>
                      <Textarea
                        value={sessionNote}
                        onChange={(e) => setSessionNote(e.target.value)}
                        placeholder="Enter note..."
                        className="h-16 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Outcome</Label>
                      <Select value={sessionOutcome} onValueChange={setSessionOutcome}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select outcome" />
                        </SelectTrigger>
                        <SelectContent>
                          {OUTCOME_OPTIONS.map((outcome) => (
                            <SelectItem key={outcome} value={outcome} className="text-xs">
                              {outcome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                
                {timerRunning ? (
                  <Button onClick={handleStopTimer} variant="destructive" className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Stop Session
                  </Button>
                ) : (
                  <Button onClick={handleStartTimer} className="w-full bg-green-600 hover:bg-green-700">
                    <Play className="h-4 w-4 mr-2" />
                    Start Session
                  </Button>
                )}
              </div>

              {/* Reminders */}
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <h3 className="font-medium text-sm">Reminders</h3>
                  </div>
                  {showReminderForm ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowReminderForm(false)}
                      className="h-6 text-xs"
                    >
                      × Hide Form
                    </Button>
                  ) : (
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => setShowReminderForm(true)}
                      className="h-6 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Reminder
                    </Button>
                  )}
                </div>

                {showReminderForm && (
                  <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded border">
                    <div>
                      <Label className="text-xs">Date *</Label>
                      <Input
                        type="date"
                        value={reminderDate}
                        onChange={(e) => setReminderDate(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Time *</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="1"
                          max="12"
                          value={reminderTime.hours}
                          onChange={(e) => setReminderTime({...reminderTime, hours: e.target.value.padStart(2, '0')})}
                          className="h-8 w-16 text-xs text-center"
                          placeholder="00"
                        />
                        <span className="text-xs">:</span>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={reminderTime.minutes}
                          onChange={(e) => setReminderTime({...reminderTime, minutes: e.target.value.padStart(2, '0')})}
                          className="h-8 w-16 text-xs text-center"
                          placeholder="00"
                        />
                        <Select value={reminderTime.ampm} onValueChange={(v) => setReminderTime({...reminderTime, ampm: v})}>
                          <SelectTrigger className="h-8 w-16 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleAddReminder} size="sm" className="w-full text-xs h-8">
                      Add Reminder
                    </Button>
                  </div>
                )}

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {reminders.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No reminders yet</p>
                  ) : (
                    reminders.map((reminder) => (
                      <div key={reminder.id} className="border rounded p-2 bg-white flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-xs font-medium">{reminder.date}</div>
                          <div className="text-xs text-gray-500">{reminder.time}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6">
              {activeTab === 'history' && (
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Activity Time Log</h2>
                    <span className="text-sm text-gray-500">{activitySessions.length} session{activitySessions.length !== 1 ? 's' : ''}</span>
                  </div>
                  {activitySessions.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No activity sessions recorded yet</p>
                  ) : (
                    <div className="space-y-3">
                      {activitySessions.map((session) => {
                        const startDate = new Date(session.startTime)
                        const endDate = new Date(session.endTime)
                        const startFormatted = startDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ', ' + startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()
                        const endFormatted = endDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ', ' + endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()
                        
                        return (
                          <div key={session.id} className="border rounded-lg p-4 bg-white">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  session.type === 'Call' ? 'bg-blue-100 text-blue-800' :
                                  session.type === 'Email' ? 'bg-purple-100 text-purple-800' :
                                  session.type === 'Meeting' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {session.type.toUpperCase()}
                                </span>
                                <span className="text-sm font-semibold text-blue-900">{formatTime(session.duration)}</span>
                              </div>
                            </div>
                            <div className="mt-3 text-xs text-gray-600 space-y-1">
                              <div>Start: {startFormatted}</div>
                              <div>End: {endFormatted}</div>
                              {session.outcome && (
                                <div className="mt-2">
                                  <span className="text-gray-500">Outcome: </span>
                                  <span className="font-medium">{session.outcome}</span>
                                </div>
                              )}
                              {session.note && (
                                <div className="mt-2">
                                  <span className="text-gray-500">Note: </span>
                                  <span>{session.note}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'company-information' && (
                <div className="bg-white border rounded-lg">
                  <div className="p-6 border-b flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Company Information</h2>
                    <Button
                      onClick={() => setIsEditing(!isEditing)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>
                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Customer Name</Label>
                        {isEditing ? (
                          <Input value={customer.customer_name || ''} className="h-9" />
                        ) : (
                          <p className="text-sm font-medium">{customer.customer_name || '-'}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Company Name</Label>
                        {isEditing ? (
                          <Input value={customer.company_name || ''} className="h-9" />
                        ) : (
                          <p className="text-sm font-medium">
                            {customer.company_name && companyLookup.has(String(customer.company_name))
                              ? companyLookup.get(String(customer.company_name))
                              : customer.company_name || '-'}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Customer Type</Label>
                        {isEditing ? (
                          <Input value={customer.customer_type || ''} className="h-9" />
                        ) : (
                          <p className="text-sm">
                            {customer.customer_type && customerTypeLookup.has(String(customer.customer_type))
                              ? customerTypeLookup.get(String(customer.customer_type))
                              : customer.customer_type || '-'}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Industry</Label>
                        {isEditing ? (
                          <Input value={customer.industry || ''} className="h-9" />
                        ) : (
                          <p className="text-sm">{customer.industry || '-'}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Territory</Label>
                        {isEditing ? (
                          <Input value={customer.territory || ''} className="h-9" />
                        ) : (
                          <p className="text-sm">{customer.territory || '-'}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Market Segment</Label>
                        {isEditing ? (
                          <Input value={customer.market_segment || ''} className="h-9" />
                        ) : (
                          <p className="text-sm">{customer.market_segment || '-'}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Email</Label>
                        {isEditing ? (
                          <Input type="email" value={customer.email || ''} className="h-9" />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <p className="text-sm">{customer.email || '-'}</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Phone</Label>
                        {isEditing ? (
                          <Input value={customer.phone || ''} className="h-9" />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <p className="text-sm">{customer.phone || '-'}</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Website</Label>
                        {isEditing ? (
                          <Input value={customer.website || ''} className="h-9" />
                        ) : (
                          <p className="text-sm">{customer.website || '-'}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Status</Label>
                        <div>
                          {customer.status === 'Active' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              {customer.status || 'Inactive'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'organization-detail' && (
                <div className="bg-white border rounded-lg">
                  <div className="p-6 border-b flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Organization Detail</h2>
                    <Button
                      onClick={() => setIsEditing(!isEditing)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>
                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">GST Number</Label>
                        {isEditing ? (
                          <Input value={customer.gst_number || ''} className="h-9" />
                        ) : (
                          <p className="text-sm">{customer.gst_number || '-'}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">PAN Number</Label>
                        {isEditing ? (
                          <Input value={customer.pan_number || ''} className="h-9" />
                        ) : (
                          <p className="text-sm">{customer.pan_number || '-'}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Number of Employees</Label>
                        {isEditing ? (
                          <Input 
                            type="number" 
                            value={customer.number_of_employees || ''} 
                            className="h-9"
                            onChange={(e) => {}}
                          />
                        ) : (
                          <p className="text-sm">{customer.number_of_employees ? customer.number_of_employees.toLocaleString() : '-'}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Annual Revenue</Label>
                        {isEditing ? (
                          <Input 
                            type="number" 
                            value={customer.annual_revenue || ''} 
                            className="h-9"
                            onChange={(e) => {}}
                          />
                        ) : (
                          <p className="text-sm">{customer.annual_revenue ? `₹${customer.annual_revenue.toLocaleString()}` : '-'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'branch' && (
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">
                      Branches {customer.branches && customer.branches.length > 0 && `(${customer.branches.length})`}
                    </h2>
                    <Button
                      onClick={() => setIsEditing(!isEditing)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>
                  {customer.branches && customer.branches.length > 0 ? (
                    <div className="space-y-4">
                      {customer.branches.map((branch: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <h3 className="font-medium mb-3">
                            {branch.branch_name || `Branch ${index + 1}`}
                            {branch.primary_branch && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Primary</span>
                            )}
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            {branch.branch_code && (
                              <div>
                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Branch Code</Label>
                                <p className="text-sm">{branch.branch_code}</p>
                              </div>
                            )}
                            {branch.phone && (
                              <div>
                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Phone</Label>
                                <div className="flex items-center space-x-2">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  <p className="text-sm">{branch.phone}</p>
                                </div>
                              </div>
                            )}
                            {branch.email && (
                              <div>
                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Email</Label>
                                <div className="flex items-center space-x-2">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <p className="text-sm">{branch.email}</p>
                                </div>
                              </div>
                            )}
                            {(branch.address_line1 || branch.address_line2 || branch.city || branch.state || branch.pincode) && (
                              <div className="md:col-span-2">
                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Address</Label>
                                <div className="flex items-start space-x-2">
                                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                  <div className="text-sm">
                                    {branch.address_line1 && <div>{branch.address_line1}</div>}
                                    {branch.address_line2 && <div>{branch.address_line2}</div>}
                                    {[branch.city, branch.state, branch.pincode].filter(Boolean).join(', ') || '-'}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No branches added yet</p>
                  )}
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">
                      Contacts {customer.contacts && customer.contacts.length > 0 && `(${customer.contacts.length})`}
                    </h2>
                    <Button
                      onClick={() => setIsEditing(!isEditing)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {isEditing ? 'Cancel' : 'Edit'}
                    </Button>
                  </div>
                  {customer.contacts && customer.contacts.length > 0 ? (
                    <div className="space-y-4">
                      {customer.contacts.map((contact: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <h3 className="font-medium mb-3">
                            {contact.salutation && `${contact.salutation} `}
                            {contact.first_name} {contact.last_name}
                            {contact.primary_contact && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Primary</span>
                            )}
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            {contact.designation && (
                              <div>
                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Designation</Label>
                                <p className="text-sm">{contact.designation}</p>
                              </div>
                            )}
                            {contact.email && (
                              <div>
                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Email</Label>
                                <div className="flex items-center space-x-2">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <p className="text-sm">{contact.email}</p>
                                </div>
                              </div>
                            )}
                            {contact.mobile_number && (
                              <div>
                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Mobile Number</Label>
                                <div className="flex items-center space-x-2">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  <p className="text-sm">{contact.mobile_number}</p>
                                </div>
                              </div>
                            )}
                            {contact.whatsapp_number && (
                              <div>
                                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">WhatsApp Number</Label>
                                <div className="flex items-center space-x-2">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  <p className="text-sm">{contact.whatsapp_number}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No contacts added yet</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

