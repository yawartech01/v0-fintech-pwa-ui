import { useState, useEffect } from 'react'
import { AdminLayout } from './AdminLayout'
import { dataStore } from '@/lib/data-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ShoppingBag, 
  Users,
  DollarSign,
  TrendingUp
} from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { APIService } from '@/services/api-service'
import { useRealAPI } from '@/config/api-mode'

export function AdminDashboard() {
  const useAPI = useRealAPI()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    pendingWithdrawals: 0,
    activeAds: 0,
    pendingRequests: 0,
    treasuryBalance: 0,
    totalLocked: 0,
  })

  useEffect(() => {
    loadStats()
    // Auto-refresh every 3 seconds for real-time updates
    const interval = setInterval(loadStats, 3000)
    
    // Listen for localStorage changes (mock mode)
    const handleStorageChange = () => loadStats()
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const loadStats = async () => {
    try {
      if (useAPI) {
        // Use real API
        const statsData = await APIService.getAdminStats()
        setStats({
          totalUsers: statsData.totalUsers || 0,
          totalDeposits: statsData.totalDeposits || 0,
          pendingWithdrawals: statsData.pendingWithdrawals || 0,
          activeAds: statsData.activeAds || 0,
          pendingRequests: statsData.pendingRequests || 0,
          treasuryBalance: statsData.treasuryBalance || 0,
          totalLocked: statsData.totalLocked || 0,
        })
      } else {
        // Use mock data
        // Count users
        const totalUsers = Object.keys(dataStore.getAllWallets() || {}).length

        // Count deposits
        let totalDeposits = 0
        Object.values(dataStore.getAllWallets() || {}).forEach((wallet: any) => {
          totalDeposits += (wallet.deposits || []).length
        })

        // Count pending withdrawals
        let pendingWithdrawals = 0
        Object.values(dataStore.getAllWallets() || {}).forEach((wallet: any) => {
          pendingWithdrawals += (wallet.withdrawRequests || []).filter(
            (w: any) => w.status === 'under_review'
          ).length
        })

        // Count active ads
        let activeAds = 0
        Object.values(dataStore.getAllSellAds() || {}).forEach((ads: any) => {
          activeAds += ads.filter((ad: any) => ad.status === 'ACTIVE').length
        })

        // Count pending requests
        let pendingRequests = 0
        Object.values(dataStore.getAllAdEditRequests() || {}).forEach((reqs: any) => {
          pendingRequests += reqs.filter((r: any) => r.status === 'PENDING').length
        })
        Object.values(dataStore.getAllAdDeleteRequests() || {}).forEach((reqs: any) => {
          pendingRequests += reqs.filter((r: any) => r.status === 'PENDING').length
        })

        // Get treasury balance
        const treasury = dataStore.getTreasury()
        const treasuryBalance = treasury?.hotWalletUsdt || 0

        // Calculate total locked
        let totalLocked = 0
        Object.values(dataStore.getAllWallets() || {}).forEach((wallet: any) => {
          totalLocked += wallet.lockedUsdt || 0
        })

        setStats({
          totalUsers,
          totalDeposits,
          pendingWithdrawals,
          activeAds,
          pendingRequests,
          treasuryBalance,
          totalLocked,
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Treasury Balance',
      value: `${formatNumber(stats.treasuryBalance)} USDT`,
      icon: DollarSign,
      color: 'text-green-500',
    },
    {
      title: 'Total Locked',
      value: `${formatNumber(stats.totalLocked)} USDT`,
      icon: TrendingUp,
      color: 'text-yellow-500',
    },
    {
      title: 'Pending Withdrawals',
      value: stats.pendingWithdrawals,
      icon: ArrowUpFromLine,
      color: 'text-orange-500',
      urgent: stats.pendingWithdrawals > 0,
    },
    {
      title: 'Active Sell Ads',
      value: stats.activeAds,
      icon: ShoppingBag,
      color: 'text-purple-500',
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests,
      icon: ArrowDownToLine,
      color: 'text-red-500',
      urgent: stats.pendingRequests > 0,
    },
  ]

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-border bg-background px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of platform activity</p>
        </div>

        {/* Stats Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.title} className={stat.urgent ? 'border-yellow-500/50' : ''}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    {stat.urgent && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        ⚠️ Requires attention
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="hover:bg-secondary/50 cursor-pointer transition-colors">
                <CardContent className="p-4 text-center">
                  <ArrowUpFromLine className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Review Withdrawals</p>
                </CardContent>
              </Card>
              <Card className="hover:bg-secondary/50 cursor-pointer transition-colors">
                <CardContent className="p-4 text-center">
                  <ShoppingBag className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Process Sell Ads</p>
                </CardContent>
              </Card>
              <Card className="hover:bg-secondary/50 cursor-pointer transition-colors">
                <CardContent className="p-4 text-center">
                  <ArrowDownToLine className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Review Requests</p>
                </CardContent>
              </Card>
              <Card className="hover:bg-secondary/50 cursor-pointer transition-colors">
                <CardContent className="p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Manage Users</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
