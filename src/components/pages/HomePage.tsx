import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import {
  Plus,
  TrendingUp,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  X,
  Info,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { APIService } from '@/services/api-service'
import { useRealAPI } from '@/config/api-mode'
import { dataStore } from '@/lib/data-store'
import { RateService } from '@/lib/rate-service'
import { ActivityService, type ActivityEvent } from '@/lib/activity-service'
import { connectWebSocket } from '@/lib/api-client'
import type { USDTRate } from '@/types'

export function HomePage() {
  const navigate = useNavigate()
  const useAPI = useRealAPI()
  const [rate, setRate] = useState<USDTRate | null>(null)
  const [availableUsdt, setAvailableUsdt] = useState(0)
  const [lockedUsdt, setLockedUsdt] = useState(0)
  const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showBanner, setShowBanner] = useState(false)
  const [bannerMessage, setBannerMessage] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      if (useAPI) {
        const [walletData, settingsData] = await Promise.all([
          APIService.getWallet(),
          APIService.getPublicSettings(),
        ])

        const w = walletData?.wallet || walletData
        setAvailableUsdt(parseFloat(w?.available_usdt || '0'))
        setLockedUsdt(parseFloat(w?.locked_usdt || '0'))

        const usdtRate = parseFloat(settingsData?.usdtInrRate || '0')
        if (usdtRate > 0) {
          setRate({
            rate: usdtRate,
            change24h: 0,
            lastUpdated: new Date(),
          })
        }

        const banner = settingsData?.adminBanner || settingsData?.bannerMessage || ''
        if (banner) {
          setBannerMessage(banner)
          setShowBanner(true)
        }
      } else {
        const authState = dataStore.getAuthState()
        if (authState.user) {
          setRate(RateService.getCurrentRate())
          const balances = dataStore.getBalances(authState.user.id)
          setAvailableUsdt(balances.available)
          setLockedUsdt(balances.locked)
          const activity = ActivityService.getRecentActivity(authState.user.id, 10)
          setRecentActivity(activity)
        }
      }
    } catch {
      // silently fail — page still renders with defaults
    } finally {
      setLoading(false)
    }
  }, [useAPI])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Real-time Socket.IO sync for rate, banner, and wallet updates
  useEffect(() => {
    if (!useAPI) return
    const userId = localStorage.getItem('user_id') || ''
    if (!userId) return

    const socket = connectWebSocket(userId)

    const onRateUpdated = (data: { rate: number }) => {
      if (data?.rate > 0) {
        setRate({ rate: data.rate, change24h: 0, lastUpdated: new Date() })
      }
    }

    const onBannerUpdated = (data: { message: string }) => {
      const msg = data?.message || ''
      setBannerMessage(msg)
      setShowBanner(!!msg)
    }

    const onWalletUpdated = () => {
      APIService.getWallet().then((walletData) => {
        const w = walletData?.wallet || walletData
        setAvailableUsdt(parseFloat(w?.available_usdt || '0'))
        setLockedUsdt(parseFloat(w?.locked_usdt || '0'))
      }).catch(() => {})
    }

    socket.on('rate_updated', onRateUpdated)
    socket.on('banner_updated', onBannerUpdated)
    socket.on('wallet_updated', onWalletUpdated)

    return () => {
      socket.off('rate_updated', onRateUpdated)
      socket.off('banner_updated', onBannerUpdated)
      socket.off('wallet_updated', onWalletUpdated)
    }
  }, [useAPI])

  const totalBalance = availableUsdt + lockedUsdt

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  return (
    <div className="space-y-3 pb-4">
      {/* Platform Banner */}
      {showBanner && bannerMessage && (
        <Card className="bg-secondary/50 border-border/50">
          <CardContent className="px-4 py-3">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-snug">{bannerMessage}</p>
              </div>
              <button
                onClick={() => setShowBanner(false)}
                className="p-2 -mr-2 -mt-1 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* USDT Rate Card */}
      <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
        <CardContent className="p-4 relative z-10">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today's USDT Rate</h2>
            {rate && (
              <p className="text-[11px] text-muted-foreground">
                {RateService.getLastUpdatedText(rate.lastUpdated)}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-foreground leading-tight">
                {rate ? `₹${formatNumber(rate.rate)}` : '—'}
              </div>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">per USDT (fixed by company)</span>
            </div>
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Balance Card - Compact */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">USDT Balance</p>
            <Button
              onClick={() => navigate('/wallet')}
              variant="ghost"
              size="sm"
              className="text-xs text-primary -mr-2"
            >
              View Wallet
            </Button>
          </div>
          <p className="text-2xl font-bold tracking-tight">
            {formatNumber(totalBalance)}
            <span className="text-sm font-medium text-muted-foreground ml-1.5">USDT</span>
          </p>
          {(availableUsdt > 0 || lockedUsdt > 0) && (
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              <span>Available: <span className="font-semibold text-foreground">{formatNumber(availableUsdt)}</span></span>
              {lockedUsdt > 0 && (
                <span>Locked: <span className="font-semibold text-foreground">{formatNumber(lockedUsdt)}</span></span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="px-4">
        <h2 className="text-sm font-semibold mb-2.5">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-2.5">
          <Card
            className="cursor-pointer hover:bg-secondary/50 active:bg-primary/20 active:scale-95 transition-all rounded-xl border-x"
            onClick={() => navigate('/sell-ads/create')}
          >
            <CardContent className="p-3.5 text-center">
              <Plus className="w-6 h-6 mx-auto mb-1.5 text-primary" />
              <p className="text-xs font-medium text-foreground">Create Ad</p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:bg-secondary/50 active:bg-primary/20 active:scale-95 transition-all rounded-xl border-x"
            onClick={() => navigate('/wallet?tab=deposit')}
          >
            <CardContent className="p-3.5 text-center">
              <ArrowDownCircle className="w-6 h-6 mx-auto mb-1.5 text-primary" />
              <p className="text-xs font-medium text-foreground">Deposit</p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:bg-secondary/50 active:bg-primary/20 active:scale-95 transition-all rounded-xl border-x"
            onClick={() => navigate('/wallet?tab=withdraw')}
          >
            <CardContent className="p-3.5 text-center">
              <ArrowUpCircle className="w-6 h-6 mx-auto mb-1.5 text-primary" />
              <p className="text-xs font-medium text-foreground">Withdraw</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-4">
          <h2 className="text-sm font-semibold">Recent Activity</h2>
          <Button onClick={loadData} variant="ghost" size="sm">
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        ) : recentActivity.length === 0 ? (
          <Card className="bg-secondary/30">
            <CardContent className="p-8 text-center space-y-4">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-sm font-medium">No Activity Yet</p>
                <p className="text-xs text-muted-foreground">
                  Start by depositing USDT or creating your first sell ad
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              {recentActivity.map((event, index) => (
                <div
                  key={event.id}
                  className={`px-4 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors ${
                    index !== recentActivity.length - 1 ? 'border-b border-border/60' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-base flex-shrink-0">
                      {event.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate leading-tight">{event.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {ActivityService.formatRelativeTime(event.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-[13px] font-semibold">{formatNumber(event.amount)}</p>
                    <Badge
                      variant={ActivityService.getStatusVariant(event.status)}
                      className="text-[11px] mt-0.5"
                    >
                      {event.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {recentActivity.length > 0 && (
          <div className="text-center pt-3">
            <Button
              onClick={() => navigate('/wallet')}
              variant="ghost"
              size="sm"
            >
              View All Transactions
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
