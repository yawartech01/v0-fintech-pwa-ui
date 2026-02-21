"use client"

import { useState } from "react"
import { Copy, Check, Share2, Gift, Clock, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const referralData = {
  code: "CRYPTO-X7K2M",
  link: "https://cryptox.app/ref/X7K2M",
  totalEarned: 2500,
  pendingRewards: 500,
  referralCount: 12,
}

const rewardsHistory = [
  {
    id: "1",
    user: "User ***89",
    amount: 250,
    status: "paid",
    date: "Jan 28, 2026",
  },
  {
    id: "2",
    user: "User ***45",
    amount: 500,
    status: "pending",
    date: "Jan 30, 2026",
  },
  {
    id: "3",
    user: "User ***12",
    amount: 250,
    status: "paid",
    date: "Jan 25, 2026",
  },
  {
    id: "4",
    user: "User ***78",
    amount: 250,
    status: "paid",
    date: "Jan 22, 2026",
  },
]

export function ReferralPage() {
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralData.code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralData.link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join VeltoX",
          text: `Use my referral code ${referralData.code} to get started!`,
          url: referralData.link,
        })
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopyLink()
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-xl font-semibold text-primary">
              {referralData.totalEarned}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">INR Earned</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/60">
          <CardContent className="p-4 text-center">
            <p className="text-xl font-semibold text-foreground">
              {referralData.referralCount}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Referrals</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Rewards */}
      {referralData.pendingRewards > 0 && (
        <Card className="bg-warning/5 border-warning/15">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning" />
                <span className="text-sm text-muted-foreground">
                  Pending Rewards
                </span>
              </div>
              <span className="text-sm font-semibold text-warning">
                {referralData.pendingRewards} INR
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral Code */}
      <Card className="bg-card border-border/60">
        <CardContent className="p-4 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Your Referral Code
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-base font-semibold text-foreground bg-secondary/50 px-4 py-3 rounded-xl text-center font-mono tracking-wider">
                {referralData.code}
              </code>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleCopyCode}
                className="h-12 w-12 shrink-0"
              >
                {copiedCode ? (
                  <Check className="w-5 h-5 text-primary" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Referral Link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-foreground bg-secondary/50 px-3 py-2.5 rounded-lg truncate font-mono">
                {referralData.link}
              </code>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Button */}
      <Button
        onClick={handleShare}
        className="w-full h-12 text-sm font-medium rounded-xl"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share with Friends
      </Button>

      {/* How it Works */}
      <Card className="bg-card border-border/60">
        <CardContent className="p-4">
          <p className="text-xs font-medium text-foreground mb-3 uppercase tracking-wide">
            How it Works
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Share your referral code with friends
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p className="text-xs text-muted-foreground">
                They sign up and complete their first trade
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <p className="text-xs text-muted-foreground">
                You both earn rewards - 250 INR each!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rewards History */}
      <div className="space-y-3">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Rewards History
        </h2>
        <Card className="bg-card border-border/60">
          <CardContent className="p-0 divide-y divide-border/60">
            {rewardsHistory.map((reward) => (
              <div
                key={reward.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Gift className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {reward.user}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {reward.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">
                    +{reward.amount} INR
                  </p>
                  <Badge
                    className={`text-xs border-0 ${
                      reward.status === "paid"
                        ? "bg-primary/10 text-primary"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {reward.status === "paid" ? "Paid" : "Pending"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
