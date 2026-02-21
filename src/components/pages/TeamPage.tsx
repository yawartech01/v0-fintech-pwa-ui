import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { dataStore } from '@/lib/data-store'
import type { ReferralProfile, ReferralReward, ReferralRewardStatus } from '@/types'
import { Users, TrendingUp, Calendar, DollarSign } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function TeamPage() {
  const [activeTab, setActiveTab] = useState<'members' | 'rewards'>('members')
  const [userId, setUserId] = useState<string>('')
  const [directMembers, setDirectMembers] = useState<ReferralProfile[]>([])
  const [indirectMembers, setIndirectMembers] = useState<ReferralProfile[]>([])
  const [rewards, setRewards] = useState<ReferralReward[]>([])

  useEffect(() => {
    const authState = dataStore.getAuthState()
    if (authState.user) {
      setUserId(authState.user.id)
      loadData(authState.user.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = (uid: string) => {
    const team = dataStore.getTeamMembers(uid)
    setDirectMembers(team.direct)
    setIndirectMembers(team.indirect)

    const userRewards = dataStore.getReferralRewards(uid)
    setRewards(userRewards)

    // Suppress unused variable warning
    if (userId) {
      console.debug('User ID loaded:', userId)
    }
  }

  const getStatusBadge = (status: ReferralRewardStatus) => {
    const variants: Record<
      ReferralRewardStatus,
      { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }
    > = {
      pending: { variant: 'secondary', label: 'Pending' },
      eligible: { variant: 'default', label: 'Eligible' },
      held: { variant: 'outline', label: 'Held' },
      paid: { variant: 'default', label: 'Paid' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    }
    const config = variants[status]
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  }

  const rewardsSummary = {
    pending: rewards.filter((r) => r.status === 'pending' || r.status === 'eligible').length,
    held: rewards.filter((r) => r.status === 'held').length,
    paid: rewards.filter((r) => r.status === 'paid').length,
    totalPaid: rewards.filter((r) => r.status === 'paid').reduce((sum, r) => sum + r.rewardUsdt, 0),
  }

  const directRewards = rewards.filter((r) => r.level === 'direct')
  const uplineRewards = rewards.filter((r) => r.level === 'upline')

  return (
    <div className="space-y-3 pb-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-primary" />
            My Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2.5">
            <div className="text-center p-2.5 bg-secondary/30 rounded-lg">
              <p className="text-xl font-bold text-primary">{directMembers.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Direct (L1)</p>
            </div>
            <div className="text-center p-2.5 bg-secondary/20 rounded-lg">
              <p className="text-xl font-bold text-primary">{indirectMembers.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Indirect (L2)</p>
            </div>
            <div className="text-center p-2.5 bg-secondary/30 rounded-lg">
              <p className="text-xl font-bold text-primary">
                {directMembers.length + indirectMembers.length}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rewards Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Rewards Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 bg-secondary/20 rounded">
              <p className="text-lg font-bold">{rewardsSummary.pending}</p>
              <p className="text-[10px] text-muted-foreground">Pending</p>
            </div>
            <div className="text-center p-2 bg-warning/10 rounded">
              <p className="text-lg font-bold text-warning">{rewardsSummary.held}</p>
              <p className="text-[10px] text-muted-foreground">Held</p>
            </div>
            <div className="text-center p-2 bg-success/10 rounded">
              <p className="text-lg font-bold text-success">{rewardsSummary.paid}</p>
              <p className="text-[10px] text-muted-foreground">Paid</p>
            </div>
            <div className="text-center p-2 bg-primary/10 rounded">
              <p className="text-lg font-bold text-primary">
                {rewardsSummary.totalPaid.toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground">Total USDT</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'members'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
          }`}
        >
          Members
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            activeTab === 'rewards'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
          }`}
        >
          Rewards
        </button>
      </div>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Direct Members (L1) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Direct Members (L1) • {directMembers.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {directMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No direct members yet. Share your referral code to grow your team!
                </p>
              ) : (
                <div className="space-y-2">
                  {directMembers.map((member) => (
                    <div
                      key={member.userId}
                      className="p-3 bg-secondary/30 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{member.userId.slice(0, 12)}...</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(member.joinedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium">
                          {member.cumulativeCompletedSellVolumeUsdt.toFixed(0)} USDT
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {member.completedPayoutCount} payouts
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Indirect Members (L2) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Indirect Members (L2) • {indirectMembers.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {indirectMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No indirect members yet. Grow your team to unlock L2 rewards!
                </p>
              ) : (
                <div className="space-y-2">
                  {indirectMembers.map((member) => (
                    <div
                      key={member.userId}
                      className="p-3 bg-secondary/20 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary/70" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{member.userId.slice(0, 12)}...</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(member.joinedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium">
                          {member.cumulativeCompletedSellVolumeUsdt.toFixed(0)} USDT
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {member.completedPayoutCount} payouts
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rewards Tab */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
          {/* Direct Rewards (L1 - 0.2%) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Direct Rewards (L1 • 0.2%)</span>
                <span className="text-primary">{directRewards.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {directRewards.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No direct rewards yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {directRewards.map((reward) => (
                    <div key={reward.id} className="p-3 bg-secondary/30 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold text-primary">
                            {reward.rewardUsdt.toFixed(4)} USDT
                          </span>
                        </div>
                        {getStatusBadge(reward.status)}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>From: {reward.refereeUserId.slice(0, 12)}...</p>
                        <p>Volume: {reward.volumeUsdt.toFixed(2)} USDT</p>
                        <p>Created: {formatDate(reward.createdAt)}</p>
                        {reward.holdUntil && reward.status === 'eligible' && (
                          <p className="text-warning">Payout: {formatDate(reward.holdUntil)}</p>
                        )}
                        {reward.paidAt && reward.status === 'paid' && (
                          <p className="text-success">Paid: {formatDate(reward.paidAt)}</p>
                        )}
                        {reward.rejectionReason && (
                          <p className="text-destructive">Reason: {reward.rejectionReason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upline Rewards (L2 - 0.1%) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Upline Rewards (L2 • 0.1%)</span>
                <span className="text-primary">{uplineRewards.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {uplineRewards.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upline rewards yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {uplineRewards.map((reward) => (
                    <div key={reward.id} className="p-3 bg-secondary/20 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-primary/70" />
                          <span className="text-sm font-semibold text-primary">
                            {reward.rewardUsdt.toFixed(4)} USDT
                          </span>
                        </div>
                        {getStatusBadge(reward.status)}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>From: {reward.refereeUserId.slice(0, 12)}...</p>
                        <p>Volume: {reward.volumeUsdt.toFixed(2)} USDT</p>
                        <p>Created: {formatDate(reward.createdAt)}</p>
                        {reward.holdUntil && reward.status === 'eligible' && (
                          <p className="text-warning">Payout: {formatDate(reward.holdUntil)}</p>
                        )}
                        {reward.paidAt && reward.status === 'paid' && (
                          <p className="text-success">Paid: {formatDate(reward.paidAt)}</p>
                        )}
                        {reward.rejectionReason && (
                          <p className="text-destructive">Reason: {reward.rejectionReason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
