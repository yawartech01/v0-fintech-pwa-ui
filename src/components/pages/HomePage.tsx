import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Plus, TrendingUp, Clock, Store, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { dataStore } from '@/lib/data-store'
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils'
import type { USDTRate, Transaction } from '@/types'

export function HomePage() {
  const navigate = useNavigate()
  const [rate, setRate] = useState<USDTRate | null>(null)
  const [balance, setBalance] = useState(0)
  const [recentActivity, setRecentActivity] = useState<Transaction[]>([])
  const [showBanner, setShowBanner] = useState(true)

  useEffect(() => {
    setRate(dataStore.getUSDTRate())
    const wallet = dataStore.getWallet()
    setBalance(wallet.balance)
    setRecentActivity(wallet.transactions.slice(0, 5))
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return '↓'
      case 'withdraw':
        return '↑'
      case 'sell_ad_locked':
        return '🔒'
      case 'sell_ad_released':
        return '🔓'
      case 'referral_reward':
        return '🎁'
      default:
        return '•'
    }
  }

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit'
      case 'withdraw':
        return 'Withdraw'
      case 'sell_ad_locked':
        return 'Funds Locked'
      case 'sell_ad_released':
        return 'Funds Released'
      case 'referral_reward':
        return 'Referral Reward'
      default:
        return 'Transaction'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'processing':
        return 'outline'
      case 'failed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Platform Update Banner */}
      {showBanner && (
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-blue-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium text-blue-100">High demand today</p>
                  <p className="text-xs text-blue-200/80">
                    Orders may take 2-3 hours longer than usual
                  </p>
                  <p className="text-xs text-blue-300/60 mt-1">10 mins ago</p>
                </div>
              </div>
              <button
                onClick={() => setShowBanner(false)}
                className="text-blue-300 hover:text-blue-100 min-h-0 min-w-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* USDT Rate Card */}
      <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">Today's USDT Rate</h2>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-foreground">
                  {rate ? formatCurrency(rate.rate) : '—'}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={rate && rate.change24h >= 0 ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {rate && rate.change24h >= 0 ? '+' : ''}
                    {rate ? rate.change24h.toFixed(2) : '0'}%
                  </Badge>
                  <span className="text-xs text-muted-foreground">vs 24h</span>
                </div>
              </div>
              <TrendingUp
                className={`w-8 h-8 ${
                  rate && rate.change24h >= 0 ? 'text-primary' : 'text-destructive'
                }`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Card */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">Available Balance</h2>
            <div className="text-3xl font-bold">{formatNumber(balance)} USDT</div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate('/wallet')}
                variant="default"
                size="sm"
                className="flex-1"
              >
                Deposit
              </Button>
              <Button
                onClick={() => navigate('/wallet')}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Withdraw
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Card
          className="cursor-pointer hover:bg-secondary/50 transition-colors"
          onClick={() => navigate('/sell-ads/create')}
        >
          <CardContent className="p-6 text-center">
            <Plus className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Create Sell Ad</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-secondary/50 transition-colors"
          onClick={() => navigate('/sell-ads')}
        >
          <CardContent className="p-6 text-center">
            <Store className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">View My Ads</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              {recentActivity.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`p-4 flex items-center justify-between ${
                    index !== recentActivity.length - 1 ? 'border-b border-border/60' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{getActivityLabel(activity.type)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatNumber(activity.amount)} USDT</p>
                    <Badge variant={getStatusColor(activity.status)} className="text-xs mt-1">
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
