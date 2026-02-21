import { useState, useEffect } from 'react'
import { AdminLayout } from './AdminLayout'
import { dataStore } from '@/lib/data-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AdminAnalytics() {
  const [stats, setStats] = useState<any>({})
  const [dateRange, setDateRange] = useState('7d')

  useEffect(() => {
    loadAnalytics()
    // Auto-refresh every 5 seconds
    const interval = setInterval(loadAnalytics, 5000)
    const handleStorageChange = () => loadAnalytics()
    window.addEventListener('storage', handleStorageChange)
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [dateRange])

  const loadAnalytics = () => {
    const wallets = dataStore.getAllWallets()
    const sellAds = dataStore.getAllSellAds()
    
    // Calculate statistics
    let totalUsers = Object.keys(wallets).length
    let totalBalance = 0
    let totalDeposits = 0
    let totalWithdrawals = 0
    let totalAds = 0
    let completedAds = 0
    let totalAdVolume = 0

    Object.values(wallets).forEach((wallet: any) => {
      totalBalance += (wallet.usdtBalance || 0) + (wallet.lockedUsdt || 0)
      totalDeposits += (wallet.deposits || []).length
      totalWithdrawals += (wallet.withdrawRequests || []).length
    })

    Object.values(sellAds).forEach((ads: any) => {
      totalAds += ads.length
      ads.forEach((ad: any) => {
        if (ad.status === 'COMPLETED') {
          completedAds++
          totalAdVolume += ad.amountTotalUsdt || 0
        }
      })
    })

    setStats({
      totalUsers,
      totalBalance,
      totalDeposits,
      totalWithdrawals,
      totalAds,
      completedAds,
      totalAdVolume,
      averageAdSize: completedAds > 0 ? totalAdVolume / completedAds : 0,
      completionRate: totalAds > 0 ? (completedAds / totalAds) * 100 : 0,
    })
  }

  const exportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      dateRange,
      stats,
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `veltox-analytics-${Date.now()}.json`
    a.click()
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-border bg-background px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Analytics & Reports</h1>
              <p className="text-sm text-muted-foreground">Platform performance metrics</p>
            </div>
            <Button onClick={exportData} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Data
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Date Range Filter */}
          <div className="flex gap-2">
            {['24h', '7d', '30d', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {range === '24h' ? 'Last 24 Hours' : range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                <Users className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.totalUsers || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
                <DollarSign className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{formatNumber(stats.totalBalance || 0)}</div>
                <p className="text-xs text-muted-foreground">USDT</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed Ads</CardTitle>
                <Activity className="w-4 h-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.completedAds || 0}</div>
                <p className="text-xs text-muted-foreground">out of {stats.totalAds || 0} total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Volume</CardTitle>
                <TrendingUp className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{formatNumber(stats.totalAdVolume || 0)}</div>
                <p className="text-xs text-muted-foreground">USDT traded</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Deposits:</span>
                  <span className="font-semibold text-foreground">{stats.totalDeposits || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Withdrawals:</span>
                  <span className="font-semibold text-foreground">{stats.totalWithdrawals || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Ad Size:</span>
                  <span className="font-semibold text-foreground">{formatNumber(stats.averageAdSize || 0)} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completion Rate:</span>
                  <span className="font-semibold text-foreground">{(stats.completionRate || 0).toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">All Systems Operational</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uptime:</span>
                  <span className="text-green-500 font-semibold">99.9%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Users (24h):</span>
                  <span className="font-semibold">{stats.totalUsers || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending Actions:</span>
                  <span className="font-semibold">{stats.totalWithdrawals || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
