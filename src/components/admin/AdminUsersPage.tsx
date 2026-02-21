import { useState, useEffect } from 'react'
import { AdminLayout } from './AdminLayout'
import { dataStore } from '@/lib/data-store'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatNumber, formatDate } from '@/lib/utils'
import { User, Phone, Calendar, Copy, Search } from 'lucide-react'
import { showToast } from '@/lib/toast'
import { APIService } from '@/services/api-service'
import { useRealAPI } from '@/config/api-mode'

export function AdminUsers() {
  const useAPI = useRealAPI()
  const [users, setUsers] = useState<Array<any>>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadUsers()
    // Auto-refresh every 3 seconds
    const interval = setInterval(loadUsers, 3000)
    const handleStorageChange = () => loadUsers()
    window.addEventListener('storage', handleStorageChange)
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const loadUsers = async () => {
    try {
      if (useAPI) {
        const result = await APIService.getAllUsers()
        const rawUsers: any[] = Array.isArray(result) ? result : result?.users || []
        const normalized = rawUsers.map((u: any) => ({
          userId: u.id,
          uid: u.uid || '—',
          email: u.email || '—',
          name: u.name || '—',
          phone: u.phone || 'N/A',
          createdAt: u.created_at || u.createdAt,
          isBanned: u.is_banned || false,
          banReason: u.ban_reason || '',
          availableBalance: parseFloat(u.available_usdt || '0'),
          lockedBalance: parseFloat(u.locked_usdt || '0'),
          totalBalance: parseFloat(u.total_usdt || '0'),
          depositAddress: 'N/A',
          totalDeposits: 0,
          totalWithdrawals: 0,
          bankAccountsCount: 0,
        }))
        setUsers(normalized)
      } else {
        // Use mock data
        const allUsers: Array<any> = []
        const wallets = dataStore.getAllWallets()
        const allBankAccounts: Record<string, any[]> = {}
        
        // Get all bank accounts
        Object.keys(wallets).forEach(userId => {
          allBankAccounts[userId] = dataStore.getBankAccounts(userId)
        })

        Object.entries(wallets).forEach(([userId, wallet]: [string, any]) => {
          const user = dataStore.getUserById(userId)
          const userBankAccounts = allBankAccounts[userId] || []
          
          allUsers.push({
            userId,
            uid: user?.uid || 'N/A',
            email: user?.email || 'Unknown',
            phone: user?.email || 'N/A',
            createdAt: user?.createdAt ? (typeof user.createdAt === 'string' ? new Date(user.createdAt) : user.createdAt) : new Date(),
            availableBalance: wallet.usdtBalance || 0,
            lockedBalance: wallet.lockedUsdt || 0,
            totalBalance: (wallet.usdtBalance || 0) + (wallet.lockedUsdt || 0),
            depositAddress: wallet.depositAddresses?.TRC20 || 'N/A',
            totalDeposits: (wallet.deposits || []).length,
            totalWithdrawals: (wallet.withdrawRequests || []).length,
            bankAccountsCount: userBankAccounts.length,
          })
        })

        // Sort by total balance (highest first)
        allUsers.sort((a, b) => b.totalBalance - a.totalBalance)
        setUsers(allUsers)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase()
    return (
      (user.email || '').toLowerCase().includes(term) ||
      (user.uid || '').toLowerCase().includes(term) ||
      (user.userId || '').toLowerCase().includes(term) ||
      (user.name || '').toLowerCase().includes(term)
    )
  })

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    showToast(`${label} copied`, 'success')
  }

  const handleBan = async (user: any) => {
    const reason = prompt(`Enter ban reason for ${user.email}:`)
    if (!reason) return
    try {
      await APIService.banUser(user.userId, reason)
      showToast(`${user.email} banned`, 'success')
      loadUsers()
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to ban user', 'error')
    }
  }

  const handleUnban = async (user: any) => {
    if (!confirm(`Unban ${user.email}?`)) return
    try {
      await APIService.unbanUser(user.userId)
      showToast(`${user.email} unbanned`, 'success')
      loadUsers()
    } catch (err: any) {
      showToast(err?.response?.data?.error || 'Failed to unban user', 'error')
    }
  }

  const totalStats = {
    totalUsers: users.length,
    totalBalance: users.reduce((sum, u) => sum + u.totalBalance, 0),
    totalAvailable: users.reduce((sum, u) => sum + u.availableBalance, 0),
    totalLocked: users.reduce((sum, u) => sum + u.lockedBalance, 0),
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-border bg-background px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground">Users Management</h1>
          <p className="text-sm text-muted-foreground">View all user accounts and balances</p>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 border-b border-border">
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Users</p>
              <p className="text-2xl font-bold text-foreground">{totalStats.totalUsers}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
              <p className="text-2xl font-bold text-foreground">{formatNumber(totalStats.totalBalance)} USDT</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Available</p>
              <p className="text-2xl font-bold text-green-500">{formatNumber(totalStats.totalAvailable)} USDT</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Locked</p>
              <p className="text-2xl font-bold text-yellow-500">{formatNumber(totalStats.totalLocked)} USDT</p>
            </Card>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by email, UID, or User ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="p-6 space-y-4">
          {filteredUsers.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? 'No users found matching your search' : 'No users yet'}
              </p>
            </Card>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.userId} className={`p-4 ${user.isBanned ? 'border-red-500/50' : ''}`}>
                <div className="grid grid-cols-12 gap-4">
                  {/* User Info */}
                  <div className="col-span-4 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-semibold text-foreground">{user.email}</span>
                      {user.isBanned && <Badge variant="destructive" className="text-xs">BANNED</Badge>}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="font-mono">
                        UID: {user.uid}
                      </Badge>
                      <button
                        onClick={() => copyToClipboard(user.uid, 'UID')}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>

                    {user.phone !== 'N/A' && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {user.phone}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      Joined {formatDate(user.createdAt)}
                    </div>
                  </div>

                  {/* Balances */}
                  <div className="col-span-3 space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">BALANCES</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-semibold text-foreground">
                          {formatNumber(user.totalBalance)} USDT
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Available:</span>
                        <span className="text-green-600 dark:text-green-400">
                          {formatNumber(user.availableBalance)} USDT
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Locked:</span>
                        <span className="text-yellow-600 dark:text-yellow-400">
                          {formatNumber(user.lockedBalance)} USDT
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Activity */}
                  <div className="col-span-3 space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">ACTIVITY</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Deposits:</span>
                        <span className="text-foreground">{user.totalDeposits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Withdrawals:</span>
                        <span className="text-foreground">{user.totalWithdrawals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bank Accounts:</span>
                        <span className="text-foreground">{user.bankAccountsCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 space-y-2 flex flex-col justify-center">
                    {user.isBanned ? (
                      <button
                        onClick={() => handleUnban(user)}
                        className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30 transition-colors"
                      >
                        ✓ Unban User
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBan(user)}
                        className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 transition-colors"
                      >
                        🚫 Ban User
                      </button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      ID: {(user.userId || '').slice(-8)}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
