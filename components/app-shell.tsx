"use client"

import type { ReactNode } from "react"
import { Home, Store, Wallet, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface AppShellProps {
  children: ReactNode
  activeTab: "home" | "sell-ads" | "wallet" | "profile"
  onTabChange: (tab: "home" | "sell-ads" | "wallet" | "profile") => void
  title?: string
  showBack?: boolean
  onBack?: () => void
  headerRight?: ReactNode
}

const tabs = [
  { id: "home" as const, label: "Home", icon: Home },
  { id: "sell-ads" as const, label: "Sell Ads", icon: Store },
  { id: "wallet" as const, label: "Wallet", icon: Wallet },
  { id: "profile" as const, label: "Profile", icon: User },
]

export function AppShell({
  children,
  activeTab,
  onTabChange,
  title,
  showBack,
  onBack,
  headerRight,
}: AppShellProps) {
  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Fixed Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 h-14 border-b border-border/60 bg-card safe-top">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={onBack}
              className="p-1.5 -ml-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          ) : null}
          <h1 className="text-base font-medium text-foreground">
            {title || "VeltoX"}
          </h1>
        </div>
        {headerRight}
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 py-4">{children}</div>
      </main>

      {/* Fixed Bottom Navigation */}
      <nav className="flex-shrink-0 border-t border-border/60 bg-card safe-bottom">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 w-full h-full transition-all",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-secondary-foreground"
                )}
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <span className="absolute top-2 w-6 h-0.5 rounded-full bg-primary" />
                )}
                <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
                <span className={cn(
                  "text-[10px] font-medium mt-0.5",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
