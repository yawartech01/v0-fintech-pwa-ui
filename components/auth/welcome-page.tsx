"use client"

import { Button } from "@/components/ui/button"

interface WelcomePageProps {
  onNavigate: (page: "login" | "signup") => void
}

export function WelcomePage({ onNavigate }: WelcomePageProps) {
  return (
    <div className="flex flex-col h-dvh bg-background safe-top safe-bottom">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Logo - Clean geometric mark */}
        <div className="mb-10">
          <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-8 h-8 text-primary"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-2xl font-semibold text-foreground mb-1.5 tracking-tight">
          VeltoX
        </h1>

        {/* Headline */}
        <h2 className="text-base text-secondary-foreground text-center mb-3">
          Exchange USDT to INR
        </h2>

        {/* Subtext */}
        <p className="text-sm text-muted-foreground text-center max-w-[280px] leading-relaxed">
          {"Sell USDT at today's rate and receive INR directly to your bank."}
        </p>
      </div>

      {/* Bottom Actions */}
      <div className="flex-shrink-0 px-6 pb-10 space-y-3">
        <Button
          className="w-full h-12 text-sm font-medium rounded-xl"
          onClick={() => onNavigate("signup")}
        >
          Create account
        </Button>
        <Button
          variant="ghost"
          className="w-full h-12 text-sm font-medium text-secondary-foreground hover:text-foreground hover:bg-secondary/50 rounded-xl"
          onClick={() => onNavigate("login")}
        >
          Log in
        </Button>
      </div>
    </div>
  )
}
