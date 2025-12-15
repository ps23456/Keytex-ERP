import { ReactNode, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger
} from '../components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { 
  LogOut, 
  LayoutDashboard, 
  ChevronLeft, 
  ChevronRight,
  Users,
  Database,
  ChevronDown,
  FileText,
  ClipboardList,
  Palette,
  Factory,
  AlertTriangle,
  Wrench,
  CheckCircle2
} from 'lucide-react'

interface MainLayoutProps {
  children: ReactNode
}

interface NavItem {
  name: string
  path: string
  icon: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mastersDropdownOpen, setMastersDropdownOpen] = useState(
    location.pathname === '/customer-masters' || 
    location.pathname === '/job-card-masters' ||
    location.pathname === '/maintenance-master'
  )
  const [designDropdownOpen, setDesignDropdownOpen] = useState(location.pathname.startsWith('/design'))
  const [productionDropdownOpen, setProductionDropdownOpen] = useState(
    location.pathname.startsWith('/production-logbook') ||
      location.pathname.startsWith('/production-scheduling') ||
      location.pathname.startsWith('/shift-handovers') ||
      location.pathname.startsWith('/rejection-logbook')
  )
  const [maintenanceDropdownOpen, setMaintenanceDropdownOpen] = useState(
    location.pathname.startsWith('/clit-sheet')
  )
  const [qcDropdownOpen, setQcDropdownOpen] = useState(
    location.pathname.startsWith('/qc-inspection')
  )

  // Masters navigation removed

  const navigation: NavItem[] = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      name: 'Customers',
      path: '/customers',
      icon: <Users className="h-5 w-5" />
    },
    {
      name: 'Inquiries',
      path: '/inquiries',
      icon: <Users className="h-5 w-5" />
    },
    {
      name: 'Quotations',
      path: '/quotations',
      icon: <FileText className="h-5 w-5" />
    },
    {
      name: 'Job Cards',
      path: '/job-cards',
      icon: <ClipboardList className="h-5 w-5" />
    }
  ]

  const getPageTitle = () => {
    if (location.pathname === '/dashboard') return 'Dashboard'
    if (location.pathname === '/customers') return 'Customer Management'
    if (location.pathname === '/inquiries') return 'Inquiry Management'
    if (location.pathname.startsWith('/quotations')) return 'Quotation Management'
    if (location.pathname === '/design-requirement') return 'Design Requirement Checklist'
    if (location.pathname === '/design-issues') return 'Design Issue Log'
    if (location.pathname === '/job-cards') return 'Job Cards'
    if (location.pathname.startsWith('/production-logbook')) return 'Production Logbook'
    if (location.pathname.startsWith('/production-scheduling')) return 'Production Scheduling'
    if (location.pathname.startsWith('/shift-handovers')) return 'Shift Handover'
    if (location.pathname.startsWith('/rejection-logbook')) return 'Rejection & Rework Logbook'
    if (location.pathname.startsWith('/clit-sheet')) return 'CLIT Sheet'
    if (location.pathname.startsWith('/qc-inspection')) return 'QC Inspection'
    if (location.pathname === '/customer-masters') return 'Customer Masters'
    if (location.pathname === '/job-card-masters') return 'Job Card Master'
    if (location.pathname === '/maintenance-master') return 'Maintenance Master'
    return 'Keytex ERP'
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className={`
        bg-white border-r border-slate-200 transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-72' : 'w-20'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          {sidebarOpen ? (
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 block leading-tight">Keytex ERP</span>
                <div className="text-xs text-slate-500 font-medium leading-tight">Manufacturing Intelligence</div>
              </div>
            </div>
          ) : (
            <div className="h-8 w-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg mx-auto">
              <span className="text-white font-bold text-sm">K</span>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-8 w-8 p-0 hover:bg-slate-100"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
          {/* Dashboard */}
          {navigation.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Button
                key={item.name}
                variant={isActive ? 'default' : 'ghost'}
                onClick={() => navigate(item.path)}
                className={`
                  w-full justify-start space-x-3 transition-all duration-200
                  ${sidebarOpen ? 'px-3' : 'px-2'}
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:text-blue-800' 
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                <div className={`${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
                  {item.icon}
                </div>
                {sidebarOpen && (
                  <span className="font-medium">{item.name}</span>
                )}
              </Button>
            )
          })}

          {/* Design Dropdown */}
          <div className="space-y-1">
            <Button
              variant="ghost"
              onClick={() => setDesignDropdownOpen(!designDropdownOpen)}
              className={`
                w-full justify-start space-x-3 transition-all duration-200
                ${sidebarOpen ? 'px-3' : 'px-2'}
                text-slate-700 hover:text-slate-900 hover:bg-slate-50
              `}
            >
              <div className="text-slate-500">
                <Palette className="h-5 w-5" />
              </div>
              {sidebarOpen && (
                <>
                  <span className="font-medium">Design</span>
                  <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${designDropdownOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </Button>

            {sidebarOpen && designDropdownOpen && (
              <div className="ml-4 space-y-0.5 max-h-96 overflow-y-auto">
                <Button
                  key="Design Requirement"
                  variant="ghost"
                  onClick={() => navigate('/design-requirement')}
                  className={`
                    w-full justify-start space-x-2 transition-all duration-200
                    px-2 py-2 text-sm
                    ${location.pathname === '/design-requirement' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
                  `}
                >
                  <div className={`${location.pathname === '/design-requirement' ? 'text-emerald-600' : 'text-slate-500'} flex-shrink-0`}>
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <span className="font-medium truncate">Design Requirement</span>
                </Button>
                <Button
                  key="Design Issue"
                  variant="ghost"
                  onClick={() => navigate('/design-issues')}
                  className={`
                    w-full justify-start space-x-2 transition-all duration-200
                    px-2 py-2 text-sm
                    ${location.pathname === '/design-issues' 
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:text-indigo-800' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
                  `}
                >
                  <div className={`${location.pathname === '/design-issues' ? 'text-indigo-600' : 'text-slate-500'} flex-shrink-0`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="font-medium truncate">Design Issue Log</span>
                </Button>
              </div>
            )}
          </div>

          {/* Masters Dropdown */}
          <div className="space-y-1">
            <Button
              variant="ghost"
              onClick={() => setMastersDropdownOpen(!mastersDropdownOpen)}
              className={`
                w-full justify-start space-x-3 transition-all duration-200
                ${sidebarOpen ? 'px-3' : 'px-2'}
                text-slate-700 hover:text-slate-900 hover:bg-slate-50
              `}
            >
              <div className="text-slate-500">
                <Database className="h-5 w-5" />
              </div>
              {sidebarOpen && (
                <>
                  <span className="font-medium">Masters</span>
                  <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${mastersDropdownOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </Button>

            {sidebarOpen && mastersDropdownOpen && (
              <div className="ml-4 space-y-0.5 max-h-96 overflow-y-auto">
                <Button
                  key="Customer Masters"
                  variant="ghost"
                  onClick={() => navigate('/customer-masters')}
                  className={`
                    w-full justify-start space-x-2 transition-all duration-200
                    px-2 py-2 text-sm
                    ${location.pathname === '/customer-masters' 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:text-blue-800' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
                  `}
                >
                  <div className={`${location.pathname === '/customer-masters' ? 'text-blue-600' : 'text-slate-500'} flex-shrink-0`}>
                    <Database className="h-4 w-4" />
                  </div>
                  <span className="font-medium truncate">Customer Masters</span>
                </Button>
                <Button
                  key="Job Card Master"
                  variant="ghost"
                  onClick={() => navigate('/job-card-masters')}
                  className={`
                    w-full justify-start space-x-2 transition-all duration-200
                    px-2 py-2 text-sm
                    ${location.pathname === '/job-card-masters' 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:text-blue-800' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
                  `}
                >
                  <div className={`${location.pathname === '/job-card-masters' ? 'text-blue-600' : 'text-slate-500'} flex-shrink-0`}>
                    <Database className="h-4 w-4" />
                  </div>
                  <span className="font-medium truncate">Job Card Master</span>
                </Button>
                <Button
                  key="Maintenance Master"
                  variant="ghost"
                  onClick={() => navigate('/maintenance-master')}
                  className={`
                    w-full justify-start space-x-2 transition-all duration-200
                    px-2 py-2 text-sm
                    ${location.pathname === '/maintenance-master' 
                      ? 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 hover:text-teal-800' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
                  `}
                >
                  <div className={`${location.pathname === '/maintenance-master' ? 'text-teal-600' : 'text-slate-500'} flex-shrink-0`}>
                    <Database className="h-4 w-4" />
                  </div>
                  <span className="font-medium truncate">Maintenance Master</span>
                </Button>
              </div>
            )}
          </div>

          {/* Production Dropdown */}
          <div className="space-y-1">
            <Button
              variant="ghost"
              onClick={() => setProductionDropdownOpen(!productionDropdownOpen)}
              className={`
                w-full justify-start space-x-3 transition-all duration-200
                ${sidebarOpen ? 'px-3' : 'px-2'}
                text-slate-700 hover:text-slate-900 hover:bg-slate-50
              `}
            >
              <div className="text-slate-500">
                <Factory className="h-5 w-5" />
              </div>
              {sidebarOpen && (
                <>
                  <span className="font-medium">Production</span>
                  <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${productionDropdownOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </Button>

            {sidebarOpen && productionDropdownOpen && (
              <div className="ml-4 space-y-0.5 max-h-96 overflow-y-auto">
                <Button
                  key="Production Logbook"
                  variant="ghost"
                  onClick={() => navigate('/production-logbook')}
                  className={`
                    w-full justify-start space-x-2 transition-all duration-200
                    px-2 py-2 text-sm
                    ${location.pathname.startsWith('/production-logbook') 
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:text-amber-800' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
                  `}
                >
                  <div className={`${location.pathname.startsWith('/production-logbook') ? 'text-amber-600' : 'text-slate-500'} flex-shrink-0`}>
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <span className="font-medium truncate">Production Logbook</span>
                </Button>
                <Button
                  key="Production Scheduling"
                  variant="ghost"
                  onClick={() => navigate('/production-scheduling')}
                  className={`
                    w-full justify-start space-x-2 transition-all duration-200
                    px-2 py-2 text-sm
                    ${location.pathname.startsWith('/production-scheduling') 
                      ? 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 hover:text-orange-800' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
                  `}
                >
                  <div className={`${location.pathname.startsWith('/production-scheduling') ? 'text-orange-600' : 'text-slate-500'} flex-shrink-0`}>
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <span className="font-medium truncate">Production Scheduling</span>
                </Button>
                <Button
                  key="Shift Handover"
                  variant="ghost"
                  onClick={() => navigate('/shift-handovers')}
                  className={`
                    w-full justify-start space-x-2 transition-all duration-200
                    px-2 py-2 text-sm
                    ${location.pathname.startsWith('/shift-handovers') 
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:text-rose-800' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
                  `}
                >
                  <div className={`${location.pathname.startsWith('/shift-handovers') ? 'text-rose-600' : 'text-slate-500'} flex-shrink-0`}>
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <span className="font-medium truncate">Shift Handover</span>
                </Button>
                <Button
                  key="Rejection Logbook"
                  variant="ghost"
                  onClick={() => navigate('/rejection-logbook')}
                  className={`
                    w-full justify-start space-x-2 transition-all duration-200
                    px-2 py-2 text-sm
                    ${location.pathname.startsWith('/rejection-logbook') 
                      ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:text-red-800' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
                  `}
                >
                  <div className={`${location.pathname.startsWith('/rejection-logbook') ? 'text-red-600' : 'text-slate-500'} flex-shrink-0`}>
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <span className="font-medium truncate">Rejection Logbook</span>
                </Button>
              </div>
            )}
          </div>

          {/* QC Dropdown */}
          <div className="space-y-1">
            <Button
              variant="ghost"
              onClick={() => setQcDropdownOpen(!qcDropdownOpen)}
              className={`
                w-full justify-start space-x-3 transition-all duration-200
                ${sidebarOpen ? 'px-3' : 'px-2'}
                text-slate-700 hover:text-slate-900 hover:bg-slate-50
              `}
            >
              <div className="text-slate-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              {sidebarOpen && (
                <>
                  <span className="font-medium">QC</span>
                  <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${qcDropdownOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </Button>

            {sidebarOpen && qcDropdownOpen && (
              <div className="ml-4 space-y-0.5 max-h-96 overflow-y-auto">
                <Button
                  key="QC Inspection"
                  variant="ghost"
                  onClick={() => navigate('/qc-inspection')}
                  className={`
                    w-full justify-start space-x-2 transition-all duration-200
                    px-2 py-2 text-sm
                    ${location.pathname.startsWith('/qc-inspection') 
                      ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:text-green-800' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
                  `}
                >
                  <div className={`${location.pathname.startsWith('/qc-inspection') ? 'text-green-600' : 'text-slate-500'} flex-shrink-0`}>
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <span className="font-medium truncate">QC Inspection</span>
                </Button>
              </div>
            )}
          </div>

          {/* Maintenance Dropdown */}
          <div className="space-y-1">
            <Button
              variant="ghost"
              onClick={() => setMaintenanceDropdownOpen(!maintenanceDropdownOpen)}
              className={`
                w-full justify-start space-x-3 transition-all duration-200
                ${sidebarOpen ? 'px-3' : 'px-2'}
                text-slate-700 hover:text-slate-900 hover:bg-slate-50
              `}
            >
              <div className="text-slate-500">
                <Wrench className="h-5 w-5" />
              </div>
              {sidebarOpen && (
                <>
                  <span className="font-medium">Maintenance</span>
                  <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${maintenanceDropdownOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </Button>

            {sidebarOpen && maintenanceDropdownOpen && (
              <div className="ml-4 space-y-0.5 max-h-96 overflow-y-auto">
                <Button
                  key="CLIT Sheet"
                  variant="ghost"
                  onClick={() => navigate('/clit-sheet')}
                  className={`
                    w-full justify-start space-x-2 transition-all duration-200
                    px-2 py-2 text-sm
                    ${location.pathname.startsWith('/clit-sheet') 
                      ? 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 hover:text-teal-800' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
                  `}
                >
                  <div className={`${location.pathname.startsWith('/clit-sheet') ? 'text-teal-600' : 'text-slate-500'} flex-shrink-0`}>
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <span className="font-medium truncate">CLIT Sheet</span>
                </Button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header - Cleaned up version */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/95 shadow-sm">
          <div className="flex h-16 items-center justify-between px-6">
            {/* Page Title */}
            <div>
              <h1 className="text-xl font-semibold text-slate-800">{getPageTitle()}</h1>
            </div>

            {/* Right: User Menu Only */}
            <div className="flex items-center space-x-4">
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold">
                        {user?.fullName?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user?.fullName}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  )
}