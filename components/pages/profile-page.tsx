"use client"

import {
  Gift,
  CreditCard,
  Shield,
  HelpCircle,
  ChevronRight,
  User,
  Copy,
  Check,
  LogOut,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"

interface ProfilePageProps {
  onNavigate: (page: string) => void
}

const menuItems = [
  {
    id: "bank-accounts",
    icon: CreditCard,
    label: "Bank Accounts",
    description: "Manage your payment methods",
  },
  {
    id: "security",
    icon: Shield,
    label: "Security",
    description: "2FA, password, sessions",
  },
  {
    id: "support",
    icon: HelpCircle,
    label: "Support & FAQ",
    description: "Get help and answers",
  },
]

const userData = {
  id: "USR-8X7K2M",
  email: "user@example.com",
  joined: "January 2026",
}

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyId = () => {
    navigator.clipboard.writeText(userData.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* User Info */}
      <Card className="bg-card border-border/60">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {userData.email}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground font-mono">
                  {userData.id}
                </span>
                <button
                  onClick={handleCopyId}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Copy user ID"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-primary" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 uppercase tracking-wide">
            Member since {userData.joined}
          </p>
        </CardContent>
      </Card>

      {/* Referral Card */}
      <Card
        className="bg-card border-border/60 cursor-pointer hover:bg-secondary/30 transition-colors overflow-hidden"
        onClick={() => onNavigate("referral")}
      >
        <CardContent className="p-0">
          <div className="relative p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Invite & Earn
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Get rewards for every referral
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items */}
      <Card className="bg-card border-border/60">
        <CardContent className="p-0 divide-y divide-border/60">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            )
          })}
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Card className="bg-card border-border/60">
        <CardContent className="p-0">
          <button
            onClick={() => onNavigate("logout")}
            className="w-full flex items-center justify-between p-4 hover:bg-destructive/5 transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/8 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-destructive">Log Out</p>
                <p className="text-xs text-muted-foreground">
                  Sign out of your account
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-destructive/40 group-hover:text-destructive transition-colors" />
          </button>
        </CardContent>
      </Card>

      {/* App Version */}
      <p className="text-center text-[10px] text-muted-foreground py-6">
        VeltoX v1.0.0
      </p>
    </div>
  )
}
