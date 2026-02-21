import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from './AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatNumber } from '@/lib/utils'
import { showToast } from '@/lib/toast'
import { APIService } from '@/services/api-service'
import {
  DollarSign,
  Plus,
  Minus,
  Search,
  Ban,
  CheckCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'

export function AdminUserActions() {
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const loadUsers = useCallback(async () => {
    try {
      const data = await APIService.getAllUsers()
      setUsers(data?.users || [])
    } catch (error) {
      showToast('Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const filteredUsers = users.filter(u =>
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.nickname || u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(u.uid || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleBalanceAdjustment = async () => {
    if (!selectedUser) return

    const amount = parseFloat(adjustAmount)
    if (isNaN(amount) || amount <= 0) {
      showToast('Invalid amount', 'error')
      return
    }
    if (!adjustReason.trim()) {
      showToast('Please provide a reason', 'error')
      return
    }
    if (!confirm(`${adjustType === 'add' ? 'Add' : 'Deduct'} ${amount} USDT ${adjustType === 'add' ? 'to' : 'from'} ${selectedUser.email}?`)) {
      return
    }

    setActionLoading(true)
    try {
      await APIService.adjustBalance(selectedUser.id, {
        amount,
        operation: adjustType,
        reason: adjustReason,
      })
      showToast(`Balance ${adjustType === 'add' ? 'added' : 'deducted'} successfully`, 'success')
      setAdjustAmount('')
      setAdjustReason('')
      loadUsers()
      // Refresh selected user data
      const updated = await APIService.getAllUsers()
      const u = (updated?.users || []).find((u: any) => u.id === selectedUser.id)
      if (u) setSelectedUser(u)
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to adjust balance', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleBanUser = async () => {
    if (!selectedUser) return
    if (!adjustReason.trim()) {
      showToast('Please provide a ban reason', 'error')
      return
    }
    if (!confirm(`Ban user ${selectedUser.email}? They will not be able to login.`)) return

    setActionLoading(true)
    try {
      await APIService.banUser(selectedUser.id, adjustReason)
      showToast('User banned successfully', 'success')
      setAdjustReason('')
      loadUsers()
      setSelectedUser({ ...selectedUser, is_banned: true, ban_reason: adjustReason })
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to ban user', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnbanUser = async () => {
    if (!selectedUser) return
    if (!confirm(`Unban user ${selectedUser.email}?`)) return

    setActionLoading(true)
    try {
      await APIService.unbanUser(selectedUser.id)
      showToast('User unbanned successfully', 'success')
      loadUsers()
      setSelectedUser({ ...selectedUser, is_banned: false, ban_reason: null })
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to unban user', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const getUserBalance = (user: any) => {
    return parseFloat(user.available_usdt || user.wallet_available || '0')
  }

  const getUserLockedBalance = (user: any) => {
    return parseFloat(user.locked_usdt || user.wallet_locked || '0')
  }

  return (
    <AdminLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-border bg-background px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">User Actions</h1>
              <p className="text-sm text-muted-foreground">Manage user accounts and balances</p>
            </div>
            <Button onClick={loadUsers} variant="outline" size="sm" className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, nickname, or UID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loading ? (
                <div className="text-center py-4">
                  <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => { setSelectedUser(user); setAdjustReason('') }}
                      className={`w-full text-left p-3 rounded border transition-colors ${
                        selectedUser?.id === user.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.nickname || user.name || 'No nickname'} | UID: {user.uid || user.id?.slice(-8)}
                          </p>
                          {user.is_banned && (
                            <Badge variant="destructive" className="mt-1 text-xs">BANNED</Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">
                            {formatNumber(getUserBalance(user))} USDT
                          </Badge>
                          {getUserLockedBalance(user) > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Locked: {formatNumber(getUserLockedBalance(user))}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No users found</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedUser && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Balance Adjustment - {selectedUser.email}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-secondary/30 rounded">
                    <p className="text-sm text-muted-foreground mb-1">Available</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatNumber(getUserBalance(selectedUser))} USDT
                    </p>
                  </div>
                  <div className="p-4 bg-secondary/30 rounded">
                    <p className="text-sm text-muted-foreground mb-1">Locked</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatNumber(getUserLockedBalance(selectedUser))} USDT
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setAdjustType('add')}
                    className={`flex-1 px-4 py-3 rounded font-medium transition-colors ${
                      adjustType === 'add' ? 'bg-green-500 text-white' : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Add Balance
                  </button>
                  <button
                    onClick={() => setAdjustType('deduct')}
                    className={`flex-1 px-4 py-3 rounded font-medium transition-colors ${
                      adjustType === 'deduct' ? 'bg-red-500 text-white' : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <Minus className="w-4 h-4 inline mr-2" />
                    Deduct Balance
                  </button>
                </div>

                <div className="space-y-2">
                  <Label>Amount (USDT)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reason (Required)</Label>
                  <Input
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="e.g., Refund for failed transaction"
                  />
                </div>

                <Button
                  onClick={handleBalanceAdjustment}
                  className="w-full"
                  variant={adjustType === 'add' ? 'default' : 'destructive'}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {adjustType === 'add' ? 'Add' : 'Deduct'} {adjustAmount || '0'} USDT
                </Button>
              </CardContent>
            </Card>
          )}

          {selectedUser && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-500">
                  <Ban className="w-5 h-5" />
                  User Account Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedUser.is_banned ? (
                  <>
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded">
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                        User is Currently Banned
                      </p>
                      {selectedUser.ban_reason && (
                        <p className="text-xs text-muted-foreground">Reason: {selectedUser.ban_reason}</p>
                      )}
                    </div>
                    <Button onClick={handleUnbanUser} className="w-full" variant="default" disabled={actionLoading}>
                      {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Unban User
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded">
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        Banning will prevent user from logging in and accessing the platform
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Ban Reason (Required)</Label>
                      <Input
                        value={adjustReason}
                        onChange={(e) => setAdjustReason(e.target.value)}
                        placeholder="e.g., Fraudulent activity, Terms violation"
                      />
                    </div>
                    <Button onClick={handleBanUser} className="w-full" variant="destructive" disabled={actionLoading}>
                      {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Ban className="w-4 h-4 mr-2" />}
                      Ban User
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
