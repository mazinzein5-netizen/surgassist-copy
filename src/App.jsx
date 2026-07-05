import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import Dashboard from '@/pages/Dashboard';
import NewReferral from '@/pages/NewReferral';
import CaseList from '@/pages/CaseList';
import CaseDetail from '@/pages/CaseDetail';
import INEWSConsult from '@/pages/INEWSConsult';
import InpatientMonitor from '@/pages/InpatientMonitor';
import TheatreLogPage from '@/pages/TheatreLogPage';
import Handover from '@/pages/Handover';
import PatientHistory from '@/pages/PatientHistory';
import DrugCalculator from '@/pages/DrugCalculator';
import Contacts from '@/pages/Contacts';
import Profile from '@/pages/Profile';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new-referral" element={<NewReferral />} />
          <Route path="/cases" element={<CaseList />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/inews-consult" element={<INEWSConsult />} />
          <Route path="/inpatient-monitor" element={<InpatientMonitor />} />
          <Route path="/theatre-log" element={<TheatreLogPage />} />
          <Route path="/handover" element={<Handover />} />
          <Route path="/patient-history" element={<PatientHistory />} />
          <Route path="/drug-calculator" element={<DrugCalculator />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App