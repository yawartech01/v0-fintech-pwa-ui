import { Gift, Clock, Users, TrendingUp, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function ReferralPage() {
  return (
    <div className="space-y-4 pb-4">

      {/* Coming Soon Banner */}
      <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border-y border-yellow-500/20">
        <Clock className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
            Referral Program — Coming Soon
          </p>
          <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80 mt-0.5">
            Invite codes and referral links are currently disabled. This feature will be enabled soon — stay tuned!
          </p>
        </div>
      </div>

      {/* Header */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 text-center space-y-3">
          <Gift className="w-14 h-14 mx-auto text-primary" />
          <div>
            <h1 className="text-xl font-bold">Invite & Earn</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Earn rewards every time your referrals sell USDT on Veltox
            </p>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            How It Works
          </h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div>
                <p className="text-sm font-medium">Invite a friend</p>
                <p className="text-xs text-muted-foreground">Share your referral code or link with friends (available soon)</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <div>
                <p className="text-sm font-medium">They sell USDT</p>
                <p className="text-xs text-muted-foreground">When your referred friend creates and completes a sell ad on Veltox</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <div>
                <p className="text-sm font-medium">You earn 0.2%</p>
                <p className="text-xs text-muted-foreground">You automatically receive 0.2% of the USDT amount they sell, credited to your wallet</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reward Rate */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-5 space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Reward Rate
          </h2>

          <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Per referred sale</span>
            </div>
            <span className="text-lg font-bold text-primary">0.2%</span>
          </div>

          {/* Example */}
          <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Example</p>
            <p className="text-sm">
              Your friend sells <span className="font-semibold">1,000 USDT</span>
              {' → '}
              You earn <span className="font-semibold text-primary">2 USDT</span>
            </p>
            <p className="text-xs text-muted-foreground">
              1,000 × 0.2% = 2 USDT credited to your wallet
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats placeholder */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-secondary/40">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Referrals</p>
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/40">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Earned</p>
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
