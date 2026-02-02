"use client"

import { useState } from "react"
import { Plus, MoreVertical, Pause, Play, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SellAdsPageProps {
  onNavigate: (page: string) => void
}

type AdStatus = "active" | "paused" | "completed"

interface Ad {
  id: string
  amount: number
  remaining: number
  minOrder: number
  maxOrder: number
  bankMethod: string
  status: AdStatus
  createdAt: string
}

// Mock data
const mockAds: Ad[] = [
  {
    id: "1",
    amount: 5000,
    remaining: 3500,
    minOrder: 100,
    maxOrder: 1000,
    bankMethod: "HDFC Bank - ****4521",
    status: "active",
    createdAt: "Jan 28, 2026",
  },
  {
    id: "2",
    amount: 2000,
    remaining: 2000,
    minOrder: 50,
    maxOrder: 500,
    bankMethod: "ICICI Bank - ****8976",
    status: "paused",
    createdAt: "Jan 25, 2026",
  },
  {
    id: "3",
    amount: 10000,
    remaining: 0,
    minOrder: 200,
    maxOrder: 2000,
    bankMethod: "SBI - ****3344",
    status: "completed",
    createdAt: "Jan 20, 2026",
  },
]

const statusFilters: { id: AdStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "paused", label: "Paused" },
  { id: "completed", label: "Completed" },
]

const getStatusBadge = (status: AdStatus) => {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-primary/10 text-primary border-0 text-xs">
          Active
        </Badge>
      )
    case "paused":
      return (
        <Badge className="bg-warning/10 text-warning border-0 text-xs">
          Paused
        </Badge>
      )
    case "completed":
      return (
        <Badge className="bg-muted text-muted-foreground border-0 text-xs">
          Completed
        </Badge>
      )
  }
}

export function SellAdsPage({ onNavigate }: SellAdsPageProps) {
  const [filter, setFilter] = useState<AdStatus | "all">("all")

  const filteredAds =
    filter === "all" ? mockAds : mockAds.filter((ad) => ad.status === filter)

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-foreground">Your Sell Ads</h2>
        <Button
          size="sm"
          className="h-9 text-xs font-medium rounded-lg"
          onClick={() => onNavigate("create-ad")}
        >
          <Plus className="w-4 h-4 mr-1" />
          New Ad
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
        {statusFilters.map((status) => (
          <button
            key={status.id}
            onClick={() => setFilter(status.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              filter === status.id
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-secondary-foreground"
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Ads List */}
      <div className="space-y-3">
        {filteredAds.length === 0 ? (
          <Card className="bg-card border-border/60">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No ads found</p>
              <Button
                variant="link"
                className="text-primary text-xs mt-2"
                onClick={() => onNavigate("create-ad")}
              >
                Create your first ad
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredAds.map((ad) => (
            <Card key={ad.id} className="bg-card border-border/60">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-semibold text-foreground">
                        {ad.amount.toLocaleString()} USDT
                      </span>
                      {getStatusBadge(ad.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Remaining: {ad.remaining.toLocaleString()} USDT
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      {ad.status === "active" ? (
                        <DropdownMenuItem className="text-foreground">
                          <Pause className="w-4 h-4 mr-2" />
                          Pause Ad
                        </DropdownMenuItem>
                      ) : ad.status === "paused" ? (
                        <DropdownMenuItem className="text-foreground">
                          <Play className="w-4 h-4 mr-2" />
                          Resume Ad
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Ad
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Limit</span>
                    <span className="text-secondary-foreground">
                      {ad.minOrder} - {ad.maxOrder} USDT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank Account</span>
                    <span className="text-secondary-foreground">{ad.bankMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="text-secondary-foreground">{ad.createdAt}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                {ad.status !== "completed" && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>
                        {Math.round(
                          ((ad.amount - ad.remaining) / ad.amount) * 100
                        )}
                        %
                      </span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${
                            ((ad.amount - ad.remaining) / ad.amount) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
