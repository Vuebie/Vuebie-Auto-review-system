import { lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import './i18n'; // Initialize i18n

// Layouts
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Import pages lazily for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const OutletsPage = lazy(() => import('./pages/dashboard/OutletsPage'));
const OutletDetailPage = lazy(() => import('./pages/dashboard/OutletDetailPage'));
const QRCodesPage = lazy(() => import('./pages/dashboard/QRCodesPage'));
const CreateQRCodePage = lazy(() => import('./pages/dashboard/CreateQRCodePage'));
const IncentivesPage = lazy(() => import('./pages/dashboard/IncentivesPage'));
const IncentiveManagementPage = lazy(() => import('./pages/dashboard/IncentiveManagementPage'));
const TemplatesPage = lazy(() => import('./pages/dashboard/TemplatesPage'));
const AnalyticsPage = lazy(() => import('./pages/dashboard/AnalyticsPage'));
const CampaignsPage = lazy(() => import('./pages/dashboard/CampaignsPage'));
const CreateEditCampaignPage = lazy(() => import('./pages/dashboard/CreateEditCampaignPage'));
const ProfilePage = lazy(() => import('./pages/dashboard/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage'));
const SubscriptionPage = lazy(() => import('./pages/dashboard/SubscriptionPage'));
const ReviewPage = lazy(() => import('./pages/review/ReviewPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const CreateDemoAccountsPage = lazy(() => import('./pages/demo/CreateDemoAccounts'));

// Admin pages
const AdminRoutes = lazy(() => import('./pages/admin'));

// Create a React Query client
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Suspense 
              fallback={
                <MainLayout>
                  <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </MainLayout>
              }
            >
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/review" element={<ReviewPage />} />
                
                {/* Secured Demo Routes */}
                <Route path="/demo/accounts" element={
                  <ProtectedRoute requiredRoles={['super_admin']}>
                    <CreateDemoAccountsPage />
                  </ProtectedRoute>
                } />
                
                {/* Protected Dashboard Routes - Merchant Only */}
                <Route path="/dashboard" element={
                  <ProtectedRoute requiredRoles={['merchant']}>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/outlets" element={
                  <ProtectedRoute requiredRoles={['merchant']}>
                    <OutletsPage />
                  </ProtectedRoute>
                } />
                <Route path="/outlets/:id" element={
                  <ProtectedRoute requiredRoles={['merchant']}>
                    <OutletDetailPage />
                  </ProtectedRoute>
                } />
                <Route path="/qr-codes" element={
                  <ProtectedRoute requiredRoles={['merchant']}>
                    <QRCodesPage />
                  </ProtectedRoute>
                } />
                <Route path="/qr-codes/new" element={
                  <ProtectedRoute requiredRoles={['merchant']}>
                    <CreateQRCodePage />
                  </ProtectedRoute>
                } />
                <Route path="/incentives" element={
                  <ProtectedRoute requiredRoles={['merchant']}>
                    <IncentivesPage />
                  </ProtectedRoute>
                } />
                <Route path="/incentives/management" element={
                  <ProtectedRoute requiredRoles={['merchant']}>
                    <IncentiveManagementPage />
                  </ProtectedRoute>
                } />
                <Route path="/templates" element={
                  <ProtectedRoute requiredRoles={['merchant']}>
                    <TemplatesPage />
                  </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                  <ProtectedRoute requiredRoles={['merchant']}>
                    <AnalyticsPage />
                  </ProtectedRoute>
                } />
                <Route path="/campaigns" element={
                  <ProtectedRoute requiredRoles={['merchant']}>
                    <CampaignsPage />
                  </ProtectedRoute>
                } />
                <Route path="/campaigns/new" element={
                  <ProtectedRoute requiredRoles={['merchant']}>
                    <CreateEditCampaignPage />
                  </ProtectedRoute>
                } />
                <Route path="/campaigns/edit/:campaignId" element={
                  <ProtectedRoute requiredRoles={['merchant']}>
                    <CreateEditCampaignPage />
                  </ProtectedRoute>
                } />
                
                {/* Protected User Profile Routes */}
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } />
                <Route path="/subscription" element={
                  <ProtectedRoute requiredRoles={['merchant']}>
                    <SubscriptionPage />
                  </ProtectedRoute>
                } />

                {/* Protected Admin Routes */}
                <Route path="/admin/*" element={
                  <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
                    <AdminRoutes />
                  </ProtectedRoute>
                } />
                
                {/* 404 Route */}
                <Route path="/404" element={<NotFoundPage />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </Suspense>
            <Toaster />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}