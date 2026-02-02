"use client"

import { useState } from "react"
import {
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface HomePageProps {
  onNavigate: (page: string) => void
}

// Platform update from admin (mock data)
const platformUpdate = {
  id: "1",
  type: "info" as "info" | "warning" | "success",
  message: "High demand today. Orders may take 2-3 hours longer than usual.",
  timestamp: "10 mins ago",
}

// Mock data for demonstration
const todayRate = {
  rate: 92.45,
  change: 0.32,
  isPositive: true,
}

const recentActivity = [
  {
    id: "1",
    type: "deposit",
    amount: "500 USDT",
    status: "completed",
    time: "2 hours ago",
  },
  {
    id: "2",
    type: "ad_created",
    amount: "1,000 USDT",
    status: "active",
    time: "5 hours ago",
  },
  {
    id: "3",
    type: "payout",
    amount: "45,000 INR",
    status: "completed",
    time: "1 day ago",
  },
  {
    id: "4",
    type: "withdrawal",
    amount: "200 USDT",
    status: "pending",
    time: "2 days ago",
  },
]

const getActivityIcon = (type: string) => {
  switch (type) {
    case "deposit":
      return <ArrowDownToLine className="w-4 h-4 text-primary" />
    case "withdrawal":
      return <ArrowUpFromLine className="w-4 h-4 text-warning" />
    case "ad_created":
      return <Plus className="w-4 h-4 text-primary" />
    case "payout":
      return <CheckCircle2 className="w-4 h-4 text-primary" />
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />
  }
}

const getActivityLabel = (type: string) => {
  switch (type) {
    case "deposit":
      return "Deposit"
    case "withdrawal":
      return "Withdrawal"
    case "ad_created":
      return "Ad Created"
    case "payout":
      return "Payout Received"
    default:
      return "Activity"
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return (
        <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-xs">
          Completed
        </Badge>
      )
    case "active":
      return (
        <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-xs">
          Active
        </Badge>
      )
    case "pending":
      return (
        <Badge variant="secondary" className="bg-warning/10 text-warning border-0 text-xs">
          Pending
        </Badge>
      )
    default:
      return null
  }
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [showUpdate, setShowUpdate] = useState(true)

  const getUpdateIcon = (type: "info" | "warning" | "success") => {
    switch (type) {
      case "warning":
        return <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
      default:
        return <Info className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    }
  }

  const getUpdateStyle = (type: "info" | "warning" | "success") => {
    switch (type) {
      case "warning":
        return "bg-warning/5 border-warning/15"
      case "success":
        return "bg-primary/5 border-primary/15"
      default:
        return "bg-secondary/50 border-border/60"
    }
  }

  return (
    <div className="space-y-4">
      {/* Platform Update Banner */}
      {showUpdate && platformUpdate && (
        <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${getUpdateStyle(platformUpdate.type)}`}>
          {getUpdateIcon(platformUpdate.type)}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-secondary-foreground leading-relaxed">
              {platformUpdate.message}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {platformUpdate.timestamp}
            </p>
          </div>
          <button
            onClick={() => setShowUpdate(false)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 -mr-1 -mt-0.5"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Rate Card */}
      <Card className="bg-card border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <div className="relative p-5">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent" />
            <div className="relative">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                {"Today's USDT Rate"}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-foreground tracking-tight">
                  {todayRate.rate.toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground">INR</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-primary font-medium">
                  +{todayRate.change}% today
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Quick Actions
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            className="flex flex-col items-center justify-center h-[72px] bg-card hover:bg-secondary/50 border border-border/60 rounded-xl transition-colors"
            onClick={() => onNavigate("create-ad")}
          >
            <Plus className="w-5 h-5 mb-1.5 text-muted-foreground" />
            <span className="text-xs text-secondary-foreground">Create Ad</span>
          </button>
          <button
            className="flex flex-col items-center justify-center h-[72px] bg-card hover:bg-secondary/50 border border-border/60 rounded-xl transition-colors"
            onClick={() => onNavigate("deposit")}
          >
            <ArrowDownToLine className="w-5 h-5 mb-1.5 text-muted-foreground" />
            <span className="text-xs text-secondary-foreground">Deposit</span>
          </button>
          <button
            className="flex flex-col items-center justify-center h-[72px] bg-card hover:bg-secondary/50 border border-border/60 rounded-xl transition-colors"
            onClick={() => onNavigate("withdraw")}
          >
            <ArrowUpFromLine className="w-5 h-5 mb-1.5 text-muted-foreground" />
            <span className="text-xs text-secondary-foreground">Withdraw</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Recent Activity
          </h2>
          <button className="text-xs text-primary font-medium hover:text-primary/80 transition-colors">
            View All
          </button>
        </div>
        <Card className="bg-card border-border/60">
          <CardContent className="p-0 divide-y divide-border/60">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {getActivityLabel(activity.type)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {activity.amount}
                  </p>
                  {getStatusBadge(activity.status)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
