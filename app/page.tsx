"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { HomePage } from "@/components/pages/home-page"
import { SellAdsPage } from "@/components/pages/sell-ads-page"
import { CreateAdPage } from "@/components/pages/create-ad-page"
import { WalletPage } from "@/components/pages/wallet-page"
import { ProfilePage } from "@/components/pages/profile-page"
import { ReferralPage } from "@/components/pages/referral-page"
import { BankAccountsPage } from "@/components/pages/bank-accounts-page"
import { SecurityPage } from "@/components/pages/security-page"
import { SupportPage } from "@/components/pages/support-page"
import { WelcomePage } from "@/components/auth/welcome-page"
import { LoginPage } from "@/components/auth/login-page"
import { SignupPage } from "@/components/auth/signup-page"
import { VerifyPage } from "@/components/auth/verify-page"

type AuthScreen = "welcome" | "login" | "signup" | "verify"
type Tab = "home" | "sell-ads" | "wallet" | "profile"
type SubPage =
  | null
  | "create-ad"
  | "deposit"
  | "withdraw"
  | "referral"
  | "bank-accounts"
  | "security"
  | "support"

export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authScreen, setAuthScreen] = useState<AuthScreen>("welcome")
  const [activeTab, setActiveTab] = useState<Tab>("home")
  const [subPage, setSubPage] = useState<SubPage>(null)

  const handleNavigate = (page: string) => {
    // Handle logout
    if (page === "logout") {
      setIsAuthenticated(false)
      setAuthScreen("welcome")
      setActiveTab("home")
      setSubPage(null)
      return
    }
    
    // Check if it's a tab or a sub-page
    if (
      page === "home" ||
      page === "sell-ads" ||
      page === "wallet" ||
      page === "profile"
    ) {
      setActiveTab(page as Tab)
      setSubPage(null)
    } else {
      setSubPage(page as SubPage)
    }
  }

  const handleBack = () => {
    setSubPage(null)
  }

  const getTitle = () => {
    if (subPage) {
      switch (subPage) {
        case "create-ad":
          return "Create Sell Ad"
        case "deposit":
          return "Deposit USDT"
        case "withdraw":
          return "Withdraw USDT"
        case "referral":
          return "Invite & Earn"
        case "bank-accounts":
          return "Bank Accounts"
        case "security":
          return "Security"
        case "support":
          return "Support & FAQ"
        default:
          return "VeltoX"
      }
    }
    switch (activeTab) {
      case "home":
        return "VeltoX"
      case "sell-ads":
        return "Sell Ads"
      case "wallet":
        return "Wallet"
      case "profile":
        return "Profile"
      default:
        return "VeltoX"
    }
  }

  const renderContent = () => {
    // Handle sub-pages first
    if (subPage) {
      switch (subPage) {
        case "create-ad":
          return <CreateAdPage onBack={handleBack} />
        case "deposit":
          // Navigate to wallet with deposit tab
          setSubPage(null)
          setActiveTab("wallet")
          return <WalletPage onNavigate={handleNavigate} />
        case "withdraw":
          // Navigate to wallet with withdraw tab
          setSubPage(null)
          setActiveTab("wallet")
          return <WalletPage onNavigate={handleNavigate} />
        case "referral":
          return <ReferralPage />
        case "bank-accounts":
          return <BankAccountsPage />
        case "security":
          return <SecurityPage />
        case "support":
          return <SupportPage />
        default:
          return <HomePage onNavigate={handleNavigate} />
      }
    }

    // Handle main tabs
    switch (activeTab) {
      case "home":
        return <HomePage onNavigate={handleNavigate} />
      case "sell-ads":
        return <SellAdsPage onNavigate={handleNavigate} />
      case "wallet":
        return <WalletPage onNavigate={handleNavigate} />
      case "profile":
        return <ProfilePage onNavigate={handleNavigate} />
      default:
        return <HomePage onNavigate={handleNavigate} />
    }
  }

  // Handle auth navigation
  const handleAuthNavigate = (page: "welcome" | "login" | "signup" | "verify" | "app") => {
    if (page === "app") {
      setIsAuthenticated(true)
    } else {
      setAuthScreen(page)
    }
  }

  // Render auth screens (full-screen, no bottom nav)
  if (!isAuthenticated) {
    switch (authScreen) {
      case "welcome":
        return <WelcomePage onNavigate={handleAuthNavigate} />
      case "login":
        return <LoginPage onNavigate={handleAuthNavigate} />
      case "signup":
        return <SignupPage onNavigate={handleAuthNavigate} />
      case "verify":
        return <VerifyPage onNavigate={handleAuthNavigate} />
      default:
        return <WelcomePage onNavigate={handleAuthNavigate} />
    }
  }

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab)
        setSubPage(null)
      }}
      title={getTitle()}
      showBack={subPage !== null}
      onBack={handleBack}
    >
      {renderContent()}
    </AppShell>
  )
}
