import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { initializeJobCardTemplates } from './lib/jobCardTemplates'
import LoginPage from './pages/LoginPage'

// Initialize job card templates on app startup
initializeJobCardTemplates()
import DashboardPage from './pages/DashboardPage'
import CustomerManagement from './pages/CustomerManagement'
import CustomerDetailPage from './pages/CustomerDetailPage'
import CustomerMastersManagement from './pages/CustomerMastersManagement'
import JobCardMasterManagement from './pages/JobCardMasterManagement'
import InquiryPage from './pages/InquiryPage'
import InquiryManagement from './pages/InquiryManagement'
import InquiryDetailPage from './pages/InquiryDetailPage'
import PublicInquiryPage from './pages/PublicInquiryPage'
import QuotationManagement from './pages/QuotationManagement'
import QuotationEditor from './pages/QuotationEditor'
import QuotationDetail from './pages/QuotationDetail'
import DesignRequirementPage from './pages/DesignRequirementPage'
import DesignIssuePage from './pages/DesignIssuePage'
import JobCardPage from './pages/JobCardPage'
import JobCardEditorPage from './pages/JobCardEditorPage'
import ProductionLogbookPage from './pages/ProductionLogbookPage'
import ProductionLogbookEditorPage from './pages/ProductionLogbookEditorPage'
import ProductionSchedulingPage from './pages/ProductionSchedulingPage'
import ProductionSchedulingEditorPage from './pages/ProductionSchedulingEditorPage'
import ShiftHandoverPage from './pages/ShiftHandoverPage'
import ShiftHandoverEditorPage from './pages/ShiftHandoverEditorPage'
import RejectionLogbookPage from './pages/RejectionLogbookPage'
import RejectionLogbookEditorPage from './pages/RejectionLogbookEditorPage'
import CLITSheetPage from './pages/CLITSheetPage'
import CLITSheetEditorPage from './pages/CLITSheetEditorPage'
import CLITSheetDetailPage from './pages/CLITSheetDetailPage'
import MaintenanceMasterManagement from './pages/MaintenanceMasterManagement'
import QCInspectionPage from './pages/QCInspectionPage'

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" replace />} 
      />
      <Route 
        path="/dashboard" 
        element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/customers" 
        element={isAuthenticated ? <CustomerManagement /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/customers/:id" 
        element={isAuthenticated ? <CustomerDetailPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/customer-masters" 
        element={isAuthenticated ? <CustomerMastersManagement /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/job-card-masters" 
        element={isAuthenticated ? <JobCardMasterManagement /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/maintenance-master" 
        element={isAuthenticated ? <MaintenanceMasterManagement /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/inquiry" 
        element={isAuthenticated ? <InquiryPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/inquiries" 
        element={isAuthenticated ? <InquiryManagement /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/inquiries/:id" 
        element={isAuthenticated ? <InquiryDetailPage /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/quotations" 
        element={isAuthenticated ? <QuotationManagement /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/quotations/new" 
        element={isAuthenticated ? <QuotationEditor /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/quotations/:id/edit" 
        element={isAuthenticated ? <QuotationEditor /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/quotations/:id" 
        element={isAuthenticated ? <QuotationDetail /> : <Navigate to="/login" replace />} 
      />
      <Route
        path="/design-issues"
        element={isAuthenticated ? <DesignIssuePage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/job-cards"
        element={isAuthenticated ? <JobCardPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/job-cards/new"
        element={isAuthenticated ? <JobCardEditorPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/job-cards/:id/edit"
        element={isAuthenticated ? <JobCardEditorPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/production-logbook"
        element={isAuthenticated ? <ProductionLogbookPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/production-logbook/new"
        element={isAuthenticated ? <ProductionLogbookEditorPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/production-logbook/:id/edit"
        element={isAuthenticated ? <ProductionLogbookEditorPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/production-scheduling"
        element={isAuthenticated ? <ProductionSchedulingPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/production-scheduling/new"
        element={isAuthenticated ? <ProductionSchedulingEditorPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/production-scheduling/:id/edit"
        element={isAuthenticated ? <ProductionSchedulingEditorPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/shift-handovers"
        element={isAuthenticated ? <ShiftHandoverPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/shift-handovers/new"
        element={isAuthenticated ? <ShiftHandoverEditorPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/shift-handovers/:id/edit"
        element={isAuthenticated ? <ShiftHandoverEditorPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/rejection-logbook"
        element={isAuthenticated ? <RejectionLogbookPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/rejection-logbook/new"
        element={isAuthenticated ? <RejectionLogbookEditorPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/rejection-logbook/:id/edit"
        element={isAuthenticated ? <RejectionLogbookEditorPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/design-requirement"
        element={isAuthenticated ? <DesignRequirementPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/clit-sheet"
        element={isAuthenticated ? <CLITSheetPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/clit-sheet/new"
        element={isAuthenticated ? <CLITSheetEditorPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/clit-sheet/:id"
        element={isAuthenticated ? <CLITSheetDetailPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/clit-sheet/:id/edit"
        element={isAuthenticated ? <CLITSheetEditorPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/qc-inspection"
        element={isAuthenticated ? <QCInspectionPage /> : <Navigate to="/login" replace />}
      />
      {/* Public Inquiry Form - No authentication required */}
      <Route 
        path="/submit-inquiry" 
        element={<PublicInquiryPage />} 
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<div className="p-8 text-center">404 - Page Not Found</div>} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
