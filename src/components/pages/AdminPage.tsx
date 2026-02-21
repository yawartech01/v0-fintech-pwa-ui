import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Clock, Shield, AlertCircle, DollarSign, Gift } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { dataStore } from '@/lib/data-store'
import { showToast } from '@/lib/toast'
import { formatNumber, formatRelativeTime, shortenAddress } from '@/lib/utils'
import type { WithdrawRequest, ReferralReward } from '@/types'

export function AdminPage() {
  const [pendingWithdrawals, setPendingWithdrawals] = useState<WithdrawRequest[]>([])
  const [allWithdrawals, setAllWithdrawals] = useState<WithdrawRequest[]>([])
  const [heldRewards, setHeldRewards] = useState<ReferralReward[]>([])
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'rewards'>('pending')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawRequest | undefined>()
  const [selectedReward, setSelectedReward] = useState<ReferralReward | undefined>()
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showRejectRewardDialog, setShowRejectRewardDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    loadData()

    // Refresh every 5 seconds
    const interval = setInterval(() => {
      loadData()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const loadData = () => {
    // Load withdrawals with userId
    const allWithdrawals: Array<{request: WithdrawRequest, userId: string}> = []
    const wallets = dataStore.getAllWallets()
    
    Object.entries(wallets).forEach(([userId, wallet]: [string, any]) => {
      const requests = wallet.withdrawRequests || []
      requests.forEach((request: WithdrawRequest) => {
        allWithdrawals.push({ request, userId })
      })
    })

    const pending = allWithdrawals.filter(item => item.request.status === 'under_review')
    setPendingWithdrawals(pending.map(item => item.request))
    setAllWithdrawals(allWithdrawals.map(item => item.request))
    setHeldRewards(dataStore.getAllHeldRewards())
  }

  const handleApprove = (withdrawal: WithdrawRequest) => {
    // Find userId for this withdrawal
    const wallets = dataStore.getAllWallets()
    let userId = ''
    
    for (const [uid, wallet] of Object.entries(wallets)) {
      const found = (wallet as any).withdrawRequests?.find((w: WithdrawRequest) => w.id === withdrawal.id)
      if (found) {
        userId = uid
        break
      }
    }

    if (!userId) {
      showToast('User not found for this withdrawal', 'error')
      return
    }

    try {
      dataStore.approveWithdrawal(userId, withdrawal.id)
      showToast(`Withdrawal approved: ${formatNumber(withdrawal.amount)} USDT`, 'success')
      loadData()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Approval failed', 'error')
    }
  }

  const handleRejectClick = (withdrawal: WithdrawRequest) => {
    setSelectedWithdrawal(withdrawal)
    setRejectionReason('')
    setShowRejectDialog(true)
  }

  const handleRejectConfirm = () => {
    if (!selectedWithdrawal || !rejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'error')
      return
    }

    // Find userId for this withdrawal
    const wallets = dataStore.getAllWallets()
    let userId = ''
    
    for (const [uid, wallet] of Object.entries(wallets)) {
      const found = (wallet as any).withdrawRequests?.find((w: WithdrawRequest) => w.id === selectedWithdrawal.id)
      if (found) {
        userId = uid
        break
      }
    }

    if (!userId) {
      showToast('User not found for this withdrawal', 'error')
      return
    }

    try {
      dataStore.rejectWithdrawal(userId, selectedWithdrawal.id, rejectionReason)
      showToast(`Withdrawal rejected: ${formatNumber(selectedWithdrawal.amount)} USDT`, 'success')
      setShowRejectDialog(false)
      setSelectedWithdrawal(undefined)
      setRejectionReason('')
      loadData()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Rejection failed', 'error')
    }
  }

  const handleApproveReward = (reward: ReferralReward) => {
    try {
      dataStore.approveHeldReward(reward.id)
      showToast(`Reward approved: ${formatNumber(reward.rewardUsdt)} USDT`, 'success')
      loadData()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Reward approval failed', 'error')
    }
  }

  const handleRejectRewardClick = (reward: ReferralReward) => {
    setSelectedReward(reward)
    setRejectionReason('')
    setShowRejectRewardDialog(true)
  }

  const handleRejectRewardConfirm = () => {
    if (!selectedReward || !rejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'error')
      return
    }

    try {
      dataStore.rejectHeldReward(selectedReward.id, rejectionReason)
      showToast(`Reward rejected: ${formatNumber(selectedReward.rewardUsdt)} USDT`, 'success')
      setShowRejectRewardDialog(false)
      setSelectedReward(undefined)
      setRejectionReason('')
      loadData()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Reward rejection failed', 'error')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'under_review':
        return (
          <Badge variant="secondary" className="bg-warning/20 text-warning">
            Under Review
          </Badge>
        )
      case 'approved':
        return (
          <Badge variant="default" className="bg-primary">
            Approved
          </Badge>
        )
      case 'sent':
        return (
          <Badge variant="default" className="bg-primary">
            Sent
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="default" className="bg-success">
            Completed
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="default" className="bg-destructive">
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <Card className="border-warning/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-warning" />
            <CardTitle className="text-base">Admin Panel</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage withdrawal requests, referral rewards, and system operations
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Dev Utilities */}
          <div className="p-3 bg-secondary/30 rounded-lg">
            <p className="text-xs font-medium mb-2">Dev Utilities</p>
            <Button
              onClick={() => {
                dataStore.resetOnboarding()
                showToast('Onboarding reset successfully', 'success')
              }}
              variant="outline"
              size="sm"
            >
              Reset Onboarding
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Withdrawals ({pendingWithdrawals.length})
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'rewards'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Held Rewards ({heldRewards.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          History
        </button>
      </div>

      {/* Pending Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingWithdrawals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No pending withdrawal requests</p>
              </CardContent>
            </Card>
          ) : (
            pendingWithdrawals.map((withdrawal) => (
              <Card key={withdrawal.id} className="border-warning/30">
                <CardContent className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-warning" />
                        <p className="font-bold text-lg">{formatNumber(withdrawal.amount)} USDT</p>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Requested {formatRelativeTime(withdrawal.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-[80px_1fr] gap-2">
                      <span className="text-muted-foreground">Network:</span>
                      <span className="font-medium">{withdrawal.network}</span>
                    </div>
                    <div className="grid grid-cols-[80px_1fr] gap-2">
                      <span className="text-muted-foreground">Address:</span>
                      <span className="font-mono text-xs break-all">{withdrawal.address}</span>
                    </div>
                    <div className="grid grid-cols-[80px_1fr] gap-2">
                      <span className="text-muted-foreground">User ID:</span>
                      <span className="font-mono text-xs">{shortenAddress(withdrawal.userId)}</span>
                    </div>
                    <div className="grid grid-cols-[80px_1fr] gap-2">
                      <span className="text-muted-foreground">Fee:</span>
                      <span className="font-medium">{formatNumber(withdrawal.fee)} USDT</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => handleApprove(withdrawal)} className="flex-1" size="sm">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleRejectClick(withdrawal)}
                      variant="destructive"
                      className="flex-1"
                      size="sm"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Held Rewards Tab */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
          {heldRewards.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No held referral rewards</p>
              </CardContent>
            </Card>
          ) : (
            heldRewards.map((reward) => (
              <Card key={reward.id} className="border-warning/30">
                <CardContent className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="w-5 h-5 text-warning" />
                        <p className="font-bold text-lg">{formatNumber(reward.rewardUsdt)} USDT</p>
                        <Badge variant="outline" className="text-xs">
                          {reward.level === 'direct' ? 'L1 (0.2%)' : 'L2 (0.1%)'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {formatRelativeTime(reward.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <span className="text-muted-foreground">Referrer:</span>
                      <span className="font-mono text-xs">
                        {shortenAddress(reward.referrerUserId)}
                      </span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <span className="text-muted-foreground">Referee:</span>
                      <span className="font-mono text-xs">
                        {shortenAddress(reward.refereeUserId)}
                      </span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] gap-2">
                      <span className="text-muted-foreground">Volume:</span>
                      <span className="font-medium">{formatNumber(reward.volumeUsdt)} USDT</span>
                    </div>
                    {reward.rejectionReason && (
                      <div className="grid grid-cols-[100px_1fr] gap-2">
                        <span className="text-muted-foreground">Held Reason:</span>
                        <span className="text-warning text-xs">{reward.rejectionReason}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleApproveReward(reward)}
                      className="flex-1"
                      size="sm"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleRejectRewardClick(reward)}
                      variant="destructive"
                      className="flex-1"
                      size="sm"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {allWithdrawals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No withdrawal history</p>
              </CardContent>
            </Card>
          ) : (
            allWithdrawals.map((withdrawal) => (
              <Card key={withdrawal.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{formatNumber(withdrawal.amount)} USDT</p>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(withdrawal.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Address:</span>
                      <span className="font-mono">{shortenAddress(withdrawal.address)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Network:</span>
                      <span>{withdrawal.network}</span>
                    </div>
                    {withdrawal.txHash && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TxHash:</span>
                        <span className="font-mono">{shortenAddress(withdrawal.txHash)}</span>
                      </div>
                    )}
                    {withdrawal.rejectionReason && (
                      <div className="pt-2 border-t border-border">
                        <span className="text-muted-foreground">Rejection Reason:</span>
                        <p className="text-destructive mt-1">{withdrawal.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Reject Dialog */}
      {showRejectDialog && selectedWithdrawal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                Reject Withdrawal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">
                    {formatNumber(selectedWithdrawal.amount)} USDT
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-mono text-xs">
                    {shortenAddress(selectedWithdrawal.address)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Enter reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <p className="text-xs text-warning-foreground">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  The locked amount will be refunded to the user's available balance.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowRejectDialog(false)
                    setSelectedWithdrawal(undefined)
                    setRejectionReason('')
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleRejectConfirm} variant="destructive" className="flex-1">
                  Confirm Rejection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reject Reward Dialog */}
      {showRejectRewardDialog && selectedReward && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" />
                Reject Referral Reward
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">
                    {formatNumber(selectedReward.rewardUsdt)} USDT
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Level:</span>
                  <span>{selectedReward.level === 'direct' ? 'L1 (0.2%)' : 'L2 (0.1%)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Referee:</span>
                  <span className="font-mono text-xs">
                    {shortenAddress(selectedReward.refereeUserId)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reward-rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="reward-rejection-reason"
                  placeholder="Enter reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <p className="text-xs text-warning-foreground">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  This reward will be permanently rejected and will not be paid out.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowRejectRewardDialog(false)
                    setSelectedReward(undefined)
                    setRejectionReason('')
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRejectRewardConfirm}
                  variant="destructive"
                  className="flex-1"
                >
                  Confirm Rejection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
