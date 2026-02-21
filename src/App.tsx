import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AppShell } from './components/AppShell'
import { WelcomePage } from './components/auth/WelcomePage'
import { LoginPage } from './components/auth/LoginPage'
import { SignupPage } from './components/auth/SignupPage'
import { VerifyPage } from './components/auth/VerifyPage'
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage'
import { JoinTeamPage } from './components/onboarding/JoinTeamPage'
import { HomePage } from './components/pages/HomePage'
import { SellAdsPage } from './components/pages/SellAdsPage'
import { CreateAdPage } from './components/pages/CreateAdPage'
import { EditAdPage } from './components/pages/EditAdPage'
import { WalletPage } from './components/pages/WalletPage'
import { ProfilePage } from './components/pages/ProfilePage'
import { AdminPage } from './components/pages/AdminPage'
import { TeamPage } from './components/pages/TeamPage'
import { ReferralPage } from './components/pages/ReferralPage'
import { BankAccountsPage } from './components/pages/BankAccountsPage'
import { SecurityPage } from './components/pages/SecurityPage'
import { SupportPage } from './components/pages/SupportPage'
import { FAQPage } from './components/pages/FAQPage'
import { AboutPage } from './components/pages/AboutPage'
import { AdminDashboard } from './components/admin/AdminDashboard'
import { AdminDeposits } from './components/admin/AdminOtherPages'
import { AdminUsers } from './components/admin/AdminUsersPage'
import { AdminSettings } from './components/admin/AdminSettingsPage'
import { AdminWithdrawals } from './components/admin/AdminWithdrawals'
import { AdminSellAds } from './components/admin/AdminSellAds'
import { AdminAdRequests } from './components/admin/AdminAdRequests'
import { AdminUserActions } from './components/admin/AdminUserActions'
import { AdminAnalytics } from './components/admin/AdminAnalytics'
import { AdminActivityLog } from './components/admin/AdminActivityLog'
import { AdminLoginPage } from './components/admin/AdminLoginPage'
import { AdminAuthGuard } from './components/admin/AdminAuthGuard'
import { ToastContainer } from './components/ToastContainer'
import { dataStore } from './lib/data-store'

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const authState = dataStore.getAuthState()
    const onboardingComplete = dataStore.isOnboardingComplete()
    const hasJwt = !!localStorage.getItem('auth_token')

    // Only enforce onboarding in mock mode (dataStore auth), not real API mode (JWT)
    if (!hasJwt && authState.isAuthenticated && !onboardingComplete) {
      navigate('/onboarding/join-team')
    }
    setIsChecking(false)
  }, [navigate])

  if (isChecking) {
    return null // Or a loading spinner
  }

  return <>{children}</>
}

function App() {
  // Check both dataStore (mock mode) AND localStorage JWT token (real API mode)
  const hasJwtToken = !!localStorage.getItem('auth_token')
  const [isAuthenticated, setIsAuthenticated] = useState(
    hasJwtToken || dataStore.getAuthState().isAuthenticated
  )
  const location = window.location.pathname

  useEffect(() => {
    const authState = dataStore.getAuthState()
    const jwtToken = localStorage.getItem('auth_token')
    const authenticated = authState.isAuthenticated || !!jwtToken
    setIsAuthenticated(authenticated)
  }, [])

  const handleAuthChange = (authenticated: boolean) => {
    setIsAuthenticated(authenticated)
  }

  // If accessing admin routes, render only admin routes
  if (location.startsWith('/admin')) {
    return (
      <>
        <ErrorBoundary>
          <Routes>
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminAuthGuard><AdminDashboard /></AdminAuthGuard>} />
            <Route path="/admin/analytics" element={<AdminAuthGuard><AdminAnalytics /></AdminAuthGuard>} />
            <Route path="/admin/deposits" element={<AdminAuthGuard><AdminDeposits /></AdminAuthGuard>} />
            <Route path="/admin/withdrawals" element={<AdminAuthGuard><AdminWithdrawals /></AdminAuthGuard>} />
            <Route path="/admin/ads" element={<AdminAuthGuard><AdminSellAds /></AdminAuthGuard>} />
            <Route path="/admin/requests" element={<AdminAuthGuard><AdminAdRequests /></AdminAuthGuard>} />
            <Route path="/admin/users" element={<AdminAuthGuard><AdminUsers /></AdminAuthGuard>} />
            <Route path="/admin/user-actions" element={<AdminAuthGuard><AdminUserActions /></AdminAuthGuard>} />
            <Route path="/admin/activity-log" element={<AdminAuthGuard><AdminActivityLog /></AdminAuthGuard>} />
            <Route path="/admin/settings" element={<AdminAuthGuard><AdminSettings /></AdminAuthGuard>} />
            <Route path="*" element={<Navigate to="/admin/login" replace />} />
          </Routes>
        </ErrorBoundary>
        <ToastContainer />
      </>
    )
  }

  // Regular user app routes
  if (!isAuthenticated) {
    return (
      <>
        <Routes>
          <Route path="/" element={<WelcomePage onAuthChange={handleAuthChange} />} />
          <Route path="/login" element={<LoginPage onAuthChange={handleAuthChange} />} />
          <Route path="/signup" element={<SignupPage onAuthChange={handleAuthChange} />} />
          <Route path="/verify" element={<VerifyPage onAuthChange={handleAuthChange} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </>
    )
  }

  return (
    <>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route
              index
              element={
                <OnboardingGuard>
                  <HomePage />
                </OnboardingGuard>
              }
            />
            <Route path="sell-ads" element={<SellAdsPage />} />
            <Route path="sell-ads/create" element={<CreateAdPage />} />
            <Route path="sell-ads/edit/:adId" element={<EditAdPage />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="admin-old" element={<AdminPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="profile" element={<ProfilePage onAuthChange={handleAuthChange} />} />
            <Route path="referral" element={<ReferralPage />} />
            <Route path="bank-accounts" element={<BankAccountsPage />} />
            <Route path="security" element={<SecurityPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="faq" element={<FAQPage />} />
            <Route path="about" element={<AboutPage />} />
          </Route>
          <Route path="/onboarding/join-team" element={<JoinTeamPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
      <ToastContainer />
    </>
  )
}

export default App
