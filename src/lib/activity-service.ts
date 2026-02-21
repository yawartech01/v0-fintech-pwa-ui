// Activity Service - Aggregates events from wallet, ads, and referrals
import type { SellAd, ReferralReward, WithdrawRequest } from '@/types'
import { dataStore } from './data-store'

export interface ActivityEvent {
  id: string
  type:
    | 'deposit_pending'
    | 'deposit_confirmed'
    | 'withdrawal_requested'
    | 'withdrawal_approved'
    | 'withdrawal_rejected'
    | 'withdrawal_completed'
    | 'ad_created'
    | 'ad_paused'
    | 'ad_resumed'
    | 'ad_completed'
    | 'referral_pending'
    | 'referral_paid'
  label: string
  amount: number
  status: 'pending' | 'completed' | 'approved' | 'rejected' | 'active' | 'paused' | 'paid'
  timestamp: Date
  icon: string
  metadata?: {
    adId?: string
    txHash?: string
    network?: string
    refereeUserId?: string
  }
}

export class ActivityService {
  /**
   * Get recent activity events (last N events)
   */
  static getRecentActivity(userId: string, limit: number = 10): ActivityEvent[] {
    const events: ActivityEvent[] = []

    // Get wallet data
    const wallet = dataStore.getWallet(userId)

    // 1. Deposits
    wallet.deposits.forEach((deposit) => {
      events.push({
        id: `deposit-${deposit.txHash}`,
        type: deposit.status === 'confirmed' ? 'deposit_confirmed' : 'deposit_pending',
        label: deposit.status === 'confirmed' ? 'Deposit Confirmed' : 'Deposit Pending',
        amount: deposit.amountUsdt,
        status: deposit.status === 'confirmed' ? 'completed' : 'pending',
        timestamp: new Date(deposit.createdAt),
        icon: '↓',
        metadata: {
          txHash: deposit.txHash,
          network: deposit.network,
        },
      })
    })

    // 2. Withdrawals
    wallet.withdrawRequests.forEach((withdrawal: WithdrawRequest) => {
      const typeMap: Record<string, ActivityEvent['type']> = {
        'Under Review': 'withdrawal_requested',
        Approved: 'withdrawal_approved',
        Sent: 'withdrawal_approved',
        Completed: 'withdrawal_completed',
        Rejected: 'withdrawal_rejected',
      }

      const statusMap: Record<string, ActivityEvent['status']> = {
        'Under Review': 'pending',
        Approved: 'approved',
        Sent: 'approved',
        Completed: 'completed',
        Rejected: 'rejected',
      }

      const labelMap: Record<string, string> = {
        'Under Review': 'Withdrawal Requested',
        Approved: 'Withdrawal Approved',
        Sent: 'Withdrawal Sent',
        Completed: 'Withdrawal Completed',
        Rejected: 'Withdrawal Rejected',
      }

      events.push({
        id: `withdrawal-${withdrawal.id}`,
        type: typeMap[withdrawal.status] || 'withdrawal_requested',
        label: labelMap[withdrawal.status] || 'Withdrawal',
        amount: withdrawal.amount,
        status: statusMap[withdrawal.status] || 'pending',
        timestamp: new Date(withdrawal.createdAt),
        icon: '↑',
        metadata: {
          txHash: withdrawal.txHash,
          network: withdrawal.network,
        },
      })
    })

    // 3. Sell Ads
    const authState = dataStore.getAuthState()
    if (authState.user) {
      const state = dataStore['state']
      const userAds = state.sellAds[authState.user.id] || []
      userAds.forEach((ad: SellAd) => {
        // Ad created
        events.push({
          id: `ad-created-${ad.id}`,
          type: 'ad_created',
          label: 'Sell Ad Created',
          amount: ad.amountTotalUsdt,
          status: ad.status === 'ACTIVE' ? 'active' : 'paused',
          timestamp: new Date(ad.createdAt),
          icon: '📝',
          metadata: {
            adId: ad.id,
          },
        })

        // If completed, add completion event
        if (ad.status === 'COMPLETED') {
          events.push({
            id: `ad-completed-${ad.id}`,
            type: 'ad_completed',
            label: 'Sell Ad Completed',
            amount: ad.amountTotalUsdt,
            status: 'completed',
            timestamp: new Date(ad.updatedAt),
            icon: '✅',
            metadata: {
              adId: ad.id,
            },
          })
        }
      })
    }

    // 4. Referral Rewards
    const state = dataStore['state']
    const userRewards = state.referralRewards[userId] || []
    userRewards.forEach((reward: ReferralReward) => {
      const isPaid = reward.status === 'paid'
      events.push({
        id: `reward-${reward.id}`,
        type: isPaid ? 'referral_paid' : 'referral_pending',
        label: isPaid ? 'Referral Reward Paid' : 'Referral Reward Pending',
        amount: reward.rewardUsdt,
        status: isPaid ? 'paid' : 'pending',
        timestamp: new Date(reward.createdAt),
        icon: '🎁',
        metadata: {
          refereeUserId: reward.refereeUserId,
        },
      })
    })

  // Sort by timestamp (newest first) and limit
  return events
    .sort((a, b) => {
      const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime()
      const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime()
      return timeB - timeA
    })
    .slice(0, limit)
  }

  /**
   * Get status badge variant for activity status
   */
  static getStatusVariant(
    status: ActivityEvent['status']
  ): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'default'
      case 'approved':
      case 'active':
        return 'outline'
      case 'pending':
        return 'secondary'
      case 'rejected':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  /**
   * Format relative time for activity timestamp
   */
  static formatRelativeTime(date: Date | string): string {
    const dateObj = date instanceof Date ? date : new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return dateObj.toLocaleDateString()
  }
}
