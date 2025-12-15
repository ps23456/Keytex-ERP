import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { 
  Building2, 
  Users, 
  Cpu, 
  Settings, 
  TrendingUp,
  Activity,
  Database,
  Shield,
  Wrench,
  Clock,
  DollarSign,
  Receipt,
  BarChart3,
  Target
} from 'lucide-react'

export default function DashboardPage() {
  const navigate = useNavigate()

  const handleMasterClick = (masterKey: string) => {
    navigate(`/masters/${masterKey}`)
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="space-y-8 p-6">
          {/* KPI Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  Organizations
                </CardTitle>
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 mb-1">1</div>
                <div className="flex items-center text-sm text-slate-500">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  Active organizations
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  Workforce
                </CardTitle>
                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 mb-1">0</div>
                <div className="flex items-center text-sm text-slate-500">
                  <Activity className="h-3 w-3 mr-1 text-blue-500" />
                  Active employees
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  Equipment
                </CardTitle>
                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Cpu className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 mb-1">0</div>
                <div className="flex items-center text-sm text-slate-500">
                  <Target className="h-3 w-3 mr-1 text-purple-500" />
                  Machines operational
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  Performance
                </CardTitle>
                <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 mb-1">98.5%</div>
                <div className="flex items-center text-sm text-slate-500">
                  <Activity className="h-3 w-3 mr-1 text-green-500" />
                  System efficiency
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics & Insights */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span>System Analytics</span>
                </CardTitle>
                <CardDescription>Real-time performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Data Processing</div>
                        <div className="text-sm text-slate-500">Real-time operations</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">99.2%</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">Security Status</div>
                        <div className="text-sm text-slate-500">System protection</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">Secure</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <Target className="h-5 w-5 text-emerald-600" />
                  <span>Quick Actions</span>
                </CardTitle>
                <CardDescription>Frequently used operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-12 text-left hover:bg-blue-50 hover:border-blue-200"
                    onClick={() => handleMasterClick('company')}
                  >
                    <Building2 className="h-4 w-4 mr-3 text-blue-600" />
                    <div>
                      <div className="font-semibold">Company Configuration</div>
                      <div className="text-xs text-slate-500">Setup organization details</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-12 text-left hover:bg-emerald-50 hover:border-emerald-200"
                    onClick={() => handleMasterClick('user')}
                  >
                    <Users className="h-4 w-4 mr-3 text-emerald-600" />
                    <div>
                      <div className="font-semibold">User Management</div>
                      <div className="text-xs text-slate-500">Manage access & permissions</div>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-12 text-left hover:bg-purple-50 hover:border-purple-200"
                    onClick={() => handleMasterClick('machine')}
                  >
                    <Cpu className="h-4 w-4 mr-3 text-purple-600" />
                    <div>
                      <div className="font-semibold">Equipment Setup</div>
                      <div className="text-xs text-slate-500">Configure machinery</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
