import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { WelcomePage } from './components/auth/WelcomePage'
import { LoginPage } from './components/auth/LoginPage'
import { SignupPage } from './components/auth/SignupPage'
import { VerifyPage } from './components/auth/VerifyPage'
import { HomePage } from './components/pages/HomePage'
import { SellAdsPage } from './components/pages/SellAdsPage'
import { CreateAdPage } from './components/pages/CreateAdPage'
import { WalletPage } from './components/pages/WalletPage'
import { ProfilePage } from './components/pages/ProfilePage'
import { ReferralPage } from './components/pages/ReferralPage'
import { BankAccountsPage } from './components/pages/BankAccountsPage'
import { SecurityPage } from './components/pages/SecurityPage'
import { SupportPage } from './components/pages/SupportPage'
import { dataStore } from './lib/data-store'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const authState = dataStore.getAuthState()
    setIsAuthenticated(authState.isAuthenticated)
  }, [])

  const handleAuthChange = (authenticated: boolean) => {
    setIsAuthenticated(authenticated)
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<WelcomePage onAuthChange={handleAuthChange} />} />
        <Route path="/login" element={<LoginPage onAuthChange={handleAuthChange} />} />
        <Route path="/signup" element={<SignupPage onAuthChange={handleAuthChange} />} />
        <Route path="/verify" element={<VerifyPage onAuthChange={handleAuthChange} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="sell-ads" element={<SellAdsPage />} />
        <Route path="sell-ads/create" element={<CreateAdPage />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="profile" element={<ProfilePage onAuthChange={handleAuthChange} />} />
        <Route path="referral" element={<ReferralPage />} />
        <Route path="bank-accounts" element={<BankAccountsPage />} />
        <Route path="security" element={<SecurityPage />} />
        <Route path="support" element={<SupportPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
